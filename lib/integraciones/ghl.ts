import "server-only";

import { descifrar } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";
import {
  contactoAFila,
  esContactoDePrueba,
  tieneTag,
  type ContactoGhl,
  type FilaVenta,
  type MapeoVenta,
  type VentanaLanzamiento,
} from "./ghl-puro";
import type { CursorSync, ResultadoSync } from "./tipos";

/**
 * Sincroniza las ventas de un cliente que vende por GoHighLevel. Con un token
 * de solo lectura de contactos no hay pagos: una venta es un contacto con la
 * etiqueta mapeada (p. ej. `compra-bootcamp-oct26`).
 *
 * Endpoints (API v2, header Version 2021-07-28):
 *  - POST /contacts/search  -> busca por etiqueta (preferido, paginado)
 *  - GET  /contacts/        -> recorrido completo si la búsqueda no se puede
 * El cuerpo exacto del search no está documentado públicamente (el spec
 * oficial trae el schema vacío): se usa el formato conocido y, si GHL lo
 * rechaza (400/404/422), se cae al recorrido. En ambos casos la etiqueta se
 * vuelve a verificar de nuestro lado antes de importar.
 */

const BASE = "https://services.leadconnectorhq.com";
const PAGINA = 100;
/** Margen bajo el maxDuration de 60 s de la ruta. */
const PRESUPUESTO_MS = 50_000;
const MAX_REINTENTOS_429 = 3;

class ErrorGhl extends Error {
  constructor(
    mensaje: string,
    readonly status: number,
  ) {
    super(mensaje);
  }
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function llamar<T>(
  token: string,
  ruta: string,
  init: { method: "GET" | "POST"; body?: unknown },
  limite: number,
): Promise<T> {
  for (let intento = 0; ; intento++) {
    const res = await fetch(`${BASE}${ruta}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    if (res.status === 429 && intento < MAX_REINTENTOS_429) {
      const retry = Number(res.headers.get("retry-after"));
      const espera = Math.min((Number.isFinite(retry) && retry > 0 ? retry * 1000 : 0) || 1000 * 2 ** intento, 8000);
      if (Date.now() + espera >= limite) throw new ErrorGhl("GHL limitó las llamadas (429)", 429);
      await dormir(espera);
      continue;
    }
    if (!res.ok) {
      const texto = (await res.text().catch(() => "")).slice(0, 200);
      const motivo =
        res.status === 401
          ? "token inválido o vencido"
          : res.status === 403
            ? "el token no tiene permiso (¿Location ID correcto?)"
            : texto || `HTTP ${res.status}`;
      throw new ErrorGhl(`GHL ${res.status}: ${motivo}`, res.status);
    }
    return (await res.json()) as T;
  }
}

interface RespuestaContactos {
  contacts?: ContactoGhl[];
  meta?: { startAfter?: number | null; startAfterId?: string | null };
}

interface Contexto {
  clientId: string;
  token: string;
  locationId: string;
  limite: number;
  /** tag normalizada -> mapeos */
  porTag: Map<string, MapeoVenta[]>;
  ventanas: Map<string, VentanaLanzamiento>;
  resultado: ResultadoSync;
}

const clave = (tag: string) => tag.trim().toLowerCase();

/** Guarda las ventas de una tanda de contactos y cuenta las nuevas por etiqueta. */
async function guardarTanda(ctx: Contexto, contactos: ContactoGhl[], etiquetas: string[]) {
  const db = supabaseAdmin();
  const filas = new Map<string, FilaVenta & { _tag: string }>();
  for (const c of contactos) {
    if (!c.id || esContactoDePrueba(c)) continue;
    for (const tag of etiquetas) {
      if (!tieneTag(c, tag)) continue;
      const stats = (ctx.resultado.porEtiqueta[tag] ??= { encontrados: 0, nuevas: 0 });
      stats.encontrados++;
      for (const m of ctx.porTag.get(clave(tag)) ?? []) {
        const fila = contactoAFila(c, m, ctx.clientId, ctx.ventanas.get(m.page_id) ?? { starts_on: null, ends_on: null });
        filas.set(`${fila.page_id}|${fila.external_id}`, { ...fila, _tag: tag });
      }
    }
  }
  if (filas.size === 0) return;
  const lista = [...filas.values()];

  // Qué ya existe (y si le falta la fecha): se inserta solo lo nuevo y se completan fechas.
  const ids = [...new Set(lista.map((f) => f.external_id))];
  const existentes = new Map<string, string | null>();
  const { data: previas, error: errLectura } = await db
    .from("launch_sale_imports")
    .select("page_id, external_id, occurred_at")
    .eq("client_id", ctx.clientId)
    .in("external_id", ids);
  if (errLectura) throw new Error(`no se pudieron leer las ventas previas: ${errLectura.message}`);
  for (const p of previas ?? []) existentes.set(`${p.page_id}|${p.external_id}`, p.occurred_at as string | null);

  const nuevas = lista.filter((f) => !existentes.has(`${f.page_id}|${f.external_id}`));
  if (nuevas.length > 0) {
    const { error } = await db.from("launch_sale_imports").upsert(
      nuevas.map((f) => ({
        page_id: f.page_id,
        client_id: f.client_id,
        external_id: f.external_id,
        occurred_at: f.occurred_at,
        amount: f.amount,
        currency: f.currency,
        list_price: f.list_price,
        source: f.source,
      })),
      { onConflict: "page_id,external_id", ignoreDuplicates: true },
    );
    if (error) throw new Error(`no se pudieron guardar las ventas: ${error.message}`);
    for (const f of nuevas) ctx.resultado.porEtiqueta[f._tag].nuevas++;
  }

  // Las que estaban sin fecha y ahora se conoce: completarla (nunca pisar una existente).
  const aFechar = lista.filter(
    (f) => f.occurred_at && existentes.get(`${f.page_id}|${f.external_id}`) === null,
  );
  for (let i = 0; i < aFechar.length; i += 10) {
    await Promise.all(
      aFechar.slice(i, i + 10).map((f) =>
        db
          .from("launch_sale_imports")
          .update({ occurred_at: f.occurred_at })
          .eq("page_id", f.page_id)
          .eq("external_id", f.external_id)
          .is("occurred_at", null),
      ),
    );
  }
}

/** Búsqueda por etiqueta. Lanza ErrorGhl 400/422 si GHL no acepta el filtro. */
async function porBusqueda(ctx: Contexto, cursor: CursorSync | null, etiquetas: string[]): Promise<CursorSync | null> {
  const enBusqueda = cursor?.modo === "search" ? cursor : null;
  const hechas = new Set(enBusqueda?.hechas ?? []);
  let tagActual = enBusqueda?.tag;
  let pagina = enBusqueda?.page ?? 1;

  for (const tag of etiquetas) {
    if (hechas.has(tag)) continue;
    if (tagActual && tag !== tagActual) continue;
    tagActual = undefined;
    for (;;) {
      if (Date.now() >= ctx.limite) return { modo: "search", hechas: [...hechas], tag, page: pagina };
      const r = await llamar<RespuestaContactos>(
        ctx.token,
        "/contacts/search",
        {
          method: "POST",
          body: {
            locationId: ctx.locationId,
            pageLimit: PAGINA,
            page: pagina,
            filters: [{ field: "tags", operator: "contains", value: [tag] }],
          },
        },
        ctx.limite,
      );
      const contactos = r.contacts ?? [];
      await guardarTanda(ctx, contactos, [tag]);
      if (contactos.length < PAGINA) break;
      pagina++;
    }
    hechas.add(tag);
    pagina = 1;
  }
  return null;
}

/** Recorrido completo de contactos (todas las etiquetas en una sola pasada). */
async function porRecorrido(ctx: Contexto, cursor: CursorSync | null, etiquetas: string[]): Promise<CursorSync | null> {
  const enRecorrido = cursor?.modo === "scan" ? cursor : null;
  let startAfter = enRecorrido?.startAfter ?? null;
  let startAfterId = enRecorrido?.startAfterId ?? null;
  for (;;) {
    if (Date.now() >= ctx.limite) return { modo: "scan", startAfter, startAfterId };
    const q = new URLSearchParams({ locationId: ctx.locationId, limit: String(PAGINA) });
    if (startAfterId) q.set("startAfterId", startAfterId);
    if (startAfter) q.set("startAfter", String(startAfter));
    const r = await llamar<RespuestaContactos>(ctx.token, `/contacts/?${q}`, { method: "GET" }, ctx.limite);
    const contactos = r.contacts ?? [];
    await guardarTanda(ctx, contactos, etiquetas);
    const sigId = r.meta?.startAfterId ?? null;
    if (contactos.length < PAGINA || !sigId || sigId === startAfterId) return null;
    startAfterId = sigId;
    startAfter = r.meta?.startAfter ?? null;
  }
}

interface FilaIntegracion {
  id: string;
  client_id: string;
  location_id: string | null;
  token_encrypted: string | null;
  last_sync_result: ResultadoSync | null;
}

async function sincronizarIntegracion(fila: FilaIntegracion, limite: number): Promise<ResultadoSync> {
  const db = supabaseAdmin();
  const previo = fila.last_sync_result;
  const reanuda = previo && !previo.completo && previo.cursor ? previo : null;
  const resultado: ResultadoSync = {
    at: new Date().toISOString(),
    porEtiqueta: reanuda ? { ...reanuda.porEtiqueta } : {},
    errores: [],
    completo: false,
    modo: reanuda?.modo ?? "search",
    cursor: null,
  };

  const terminar = async (): Promise<ResultadoSync> => {
    resultado.at = new Date().toISOString();
    await db
      .from("client_integrations")
      .update({ last_sync_at: resultado.at, last_sync_result: resultado })
      .eq("id", fila.id);
    return resultado;
  };

  const token = fila.token_encrypted ? descifrar(fila.token_encrypted) : null;
  if (!token || !fila.location_id) {
    resultado.errores.push(
      fila.token_encrypted && !token ? "No se pudo descifrar el token: volvé a cargarlo" : "Falta el token o el Location ID",
    );
    resultado.completo = true;
    return terminar();
  }

  try {
    const { data: mapeos, error } = await db
      .from("ghl_sale_mappings")
      .select("tag, page_id, amount, currency")
      .eq("integration_id", fila.id);
    if (error) throw new Error(error.message);
    if (!mapeos || mapeos.length === 0) {
      resultado.completo = true;
      resultado.errores.push("No hay etiquetas mapeadas todavía");
      return terminar();
    }

    const porTag = new Map<string, MapeoVenta[]>();
    const etiquetas: string[] = [];
    for (const m of mapeos) {
      const k = clave(m.tag as string);
      if (!porTag.has(k)) {
        porTag.set(k, []);
        etiquetas.push(m.tag as string);
      }
      porTag.get(k)!.push({
        tag: m.tag as string,
        page_id: m.page_id as string,
        amount: m.amount === null ? null : Number(m.amount),
        currency: m.currency as string,
      });
    }

    // Ventana de fechas de cada landing: la de su lanzamiento.
    const pageIds = [...new Set(mapeos.map((m) => m.page_id as string))];
    const ventanas = new Map<string, VentanaLanzamiento>();
    const { data: paginas } = await db.from("launch_pages").select("id, launch_id").in("id", pageIds);
    const launchIds = [...new Set((paginas ?? []).map((p) => p.launch_id as string))];
    const { data: lanz } = await db.from("launches").select("id, starts_on, ends_on").in("id", launchIds);
    const deLanz = new Map(
      (lanz ?? []).map((l) => [l.id as string, { starts_on: l.starts_on as string | null, ends_on: l.ends_on as string | null }]),
    );
    for (const p of paginas ?? []) {
      ventanas.set(p.id as string, deLanz.get(p.launch_id as string) ?? { starts_on: null, ends_on: null });
    }

    const ctx: Contexto = {
      clientId: fila.client_id,
      token,
      locationId: fila.location_id,
      limite,
      porTag,
      ventanas,
      resultado,
    };

    // Corrida nueva: contadores en cero para las etiquetas actuales.
    const reiniciar = () => {
      resultado.porEtiqueta = {};
      for (const t of etiquetas) resultado.porEtiqueta[t] = { encontrados: 0, nuevas: 0 };
    };
    if (!reanuda) reiniciar();

    let modo: "search" | "scan" = reanuda?.cursor?.modo ?? "search";
    let cursor: CursorSync | null = reanuda?.cursor ?? null;
    try {
      cursor = modo === "search" ? await porBusqueda(ctx, cursor, etiquetas) : await porRecorrido(ctx, cursor, etiquetas);
    } catch (e) {
      // Si GHL no acepta el filtro de la búsqueda, se recorren todos los contactos.
      if (modo === "search" && e instanceof ErrorGhl && [400, 404, 422].includes(e.status)) {
        modo = "scan";
        reiniciar();
        cursor = await porRecorrido(ctx, null, etiquetas);
      } else {
        throw e;
      }
    }
    resultado.modo = modo;
    resultado.cursor = cursor;
    resultado.completo = cursor === null;
  } catch (e) {
    resultado.errores.push(e instanceof Error ? e.message : "error desconocido");
    // Un corte transitorio conserva el cursor para retomar donde quedó.
    resultado.cursor = reanuda?.cursor ?? null;
    resultado.completo = !reanuda;
  }
  return terminar();
}

const COLUMNAS = "id, client_id, location_id, token_encrypted, last_sync_result";

/** Sincroniza la conexión GHL de un cliente (botón "Sincronizar ahora"). */
export async function sincronizarCliente(clientId: string): Promise<ResultadoSync | null> {
  const { data } = await supabaseAdmin()
    .from("client_integrations")
    .select(COLUMNAS)
    .eq("client_id", clientId)
    .eq("provider", "ghl")
    .maybeSingle();
  if (!data) return null;
  return sincronizarIntegracion(data as FilaIntegracion, Date.now() + PRESUPUESTO_MS);
}

/** Sincroniza todas las conexiones GHL (para el cron), compartiendo el tiempo. */
export async function sincronizarTodas(): Promise<{ clientId: string; resultado: ResultadoSync }[]> {
  const limite = Date.now() + PRESUPUESTO_MS;
  const { data } = await supabaseAdmin()
    .from("client_integrations")
    .select(COLUMNAS)
    .eq("provider", "ghl")
    .not("token_encrypted", "is", null)
    .not("location_id", "is", null)
    // Las menos recientes (o nunca sincronizadas) primero.
    .order("last_sync_at", { ascending: true, nullsFirst: true });
  const salida: { clientId: string; resultado: ResultadoSync }[] = [];
  for (const fila of (data ?? []) as FilaIntegracion[]) {
    if (Date.now() >= limite) break;
    salida.push({ clientId: fila.client_id, resultado: await sincronizarIntegracion(fila, limite) });
  }
  return salida;
}
