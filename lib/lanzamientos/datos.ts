import "server-only";

import { cache } from "react";
import { supabaseAdmin } from "@/lib/landing/supabase";
import {
  diaDe,
  type Compra,
  type Lanzamiento,
  type PaginaLanzamiento,
  type Registro,
  type VisitaAgregada,
} from "@/lib/lanzamientos/tipos";
import { conversionesDeRutas, visitasDeRutas } from "@/lib/sitios/datos";
import { cruzarListas, type ListaCruzada, type Miembro } from "@/lib/lanzamientos/listas";
import { validarEntregables } from "@/lib/portal/entrega";

/**
 * Lecturas de lanzamientos. Toda función recibe el `clientId` y filtra por
 * él: sirven igual al panel (el owner pasa el cliente del lanzamiento) y al
 * portal (pasa el cliente de su contexto), y ninguna puede leer sin cliente.
 *
 * Las columnas se nombran una por una: `launches` guarda el token y el
 * secreto del webhook, que nunca salen de `conexionDeLanzamiento`.
 */
const COLUMNAS_LANZAMIENTO =
  "id, client_id, name, status, starts_on, ends_on, goal_registrations, closing_notes, cover_url, banner_url, created_at";
const COLUMNAS_PAGINA =
  "id, launch_id, name, url, thanks_url, whatsapp_url, checkout_url, project_id, mailerlite_group_id, track_key, site_id, path, kind, deliverables, position";
const COLUMNAS_REGISTRO =
  "id, page_id, email, name, phone, utm_source, utm_medium, utm_campaign, utm_content, registered_at, extra";

export interface LanzamientoConTotal extends Lanzamiento {
  registros: number;
}

/**
 * Cierra los lanzamientos activos de un cliente (o de todos) cuya fecha de
 * fin ya pasó: un lanzamiento vencido no puede seguir figurando como activo.
 * Corre antes de leerlos, una vez por pedido; si falla, se lee igual.
 */
export const cerrarVencidos = cache(async (clientId?: string) => {
  let consulta = supabaseAdmin()
    .from("launches")
    .update({ status: "cerrado", updated_at: new Date().toISOString() })
    .eq("status", "activo")
    .lt("ends_on", diaDe(new Date()));
  if (clientId) consulta = consulta.eq("client_id", clientId);
  const { error } = await consulta;
  if (error) console.error("[lanzamientos] no se pudieron cerrar los vencidos:", error.message);
});

export async function lanzamientosDeCliente(clientId: string): Promise<LanzamientoConTotal[]> {
  await cerrarVencidos(clientId);
  const { data, error } = await supabaseAdmin()
    .from("launches")
    .select(`${COLUMNAS_LANZAMIENTO}, launch_registrations(count)`)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("No se pudieron leer los lanzamientos");
  const lanzamientos = (data ?? []).map((fila) => {
    const { launch_registrations, ...l } = fila as unknown as Lanzamiento & {
      launch_registrations: { count: number }[] | null;
    };
    return { ...l, registros: launch_registrations?.[0]?.count ?? 0 };
  });

  // Las landings de un proyecto conectado guardan sus registros por sitio y
  // ruta, no en launch_registrations: se suman igual que en el detalle.
  const extra = await registrosDeSitios(clientId, lanzamientos);
  return lanzamientos.map((l) => ({ ...l, registros: l.registros + (extra.get(l.id) ?? 0) }));
}

/**
 * Registros (no compras) que llegaron por proyecto conectado, por
 * lanzamiento: mismas rutas y mismo período que lee `lanzamientoDeCliente`.
 * Si falla, el total muestra solo lo propio en vez de romper la lista.
 */
async function registrosDeSitios(clientId: string, lanzamientos: Lanzamiento[]): Promise<Map<string, number>> {
  const totales = new Map<string, number>();
  if (lanzamientos.length === 0) return totales;
  const db = supabaseAdmin();
  const { data: paginas, error } = await db
    .from("launch_pages")
    .select("launch_id, site_id, path")
    .eq("client_id", clientId)
    .not("site_id", "is", null)
    .not("path", "is", null);
  if (error) {
    console.error("[lanzamientos] no se pudieron leer las landings conectadas:", error.message);
    return totales;
  }

  await Promise.all(
    lanzamientos.map(async (l) => {
      const porSitio = new Map<string, string[]>();
      for (const p of paginas ?? []) {
        if (p.launch_id !== l.id) continue;
        porSitio.set(p.site_id as string, [...(porSitio.get(p.site_id as string) ?? []), p.path as string]);
      }
      const desde = l.starts_on ?? diaDe(l.created_at);
      const hasta = l.ends_on ?? diaDe(new Date());
      for (const [siteId, rutas] of porSitio) {
        const { count, error: errConteo } = await db
          .from("site_conversions")
          .select("id", { count: "exact", head: true })
          .eq("client_id", clientId)
          .eq("site_id", siteId)
          .in("path", rutas)
          .neq("kind", "purchase")
          .not("email", "is", null)
          .neq("email", "")
          .gte("occurred_at", `${desde}T00:00:00-03:00`)
          .lte("occurred_at", `${hasta}T23:59:59.999-03:00`);
        if (errConteo) {
          console.error("[lanzamientos] no se pudieron contar los registros del proyecto:", errConteo.message);
          continue;
        }
        totales.set(l.id, (totales.get(l.id) ?? 0) + (count ?? 0));
      }
    }),
  );
  return totales;
}

export interface DetalleLanzamiento {
  lanzamiento: Lanzamiento;
  paginas: PaginaLanzamiento[];
  registros: Registro[];
  /** Visitantes únicos por landing, día y fuente (ya agregados en la base). */
  visitas: VisitaAgregada[];
  /** Compras confirmadas de las landings de proyectos conectados. */
  compras: Compra[];
  /** `true` si hay más registros que el tope leído (los totales serían parciales). */
  truncado: boolean;
  /** Listas cruzadas con los registros (asistentes, grupo, compradores): solo ids. */
  listas: ListaCruzada[];
}

/* PostgREST devuelve de a 1000 filas: se pagina hasta un tope razonable. */
const LOTE = 1000;
const TOPE = 20_000;

/** Null si el lanzamiento no existe o no es de ese cliente. */
export async function lanzamientoDeCliente(
  clientId: string,
  id: string,
): Promise<DetalleLanzamiento | null> {
  await cerrarVencidos(clientId);
  const db = supabaseAdmin();

  const { data: lanzamiento, error } = await db
    .from("launches")
    .select(COLUMNAS_LANZAMIENTO)
    .eq("client_id", clientId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo leer el lanzamiento");
  if (!lanzamiento) return null;

  const { data: paginas, error: errPaginas } = await db
    .from("launch_pages")
    .select(COLUMNAS_PAGINA)
    .eq("client_id", clientId)
    .eq("launch_id", id)
    .order("position");
  if (errPaginas) throw new Error("No se pudieron leer las landings");

  const registros: Registro[] = [];
  let truncado = false;
  for (let desde = 0; ; desde += LOTE) {
    const { data: lote, error: errRegistros } = await db
      .from("launch_registrations")
      .select(COLUMNAS_REGISTRO)
      .eq("client_id", clientId)
      .eq("launch_id", id)
      .order("registered_at", { ascending: false })
      .range(desde, desde + LOTE - 1);
    if (errRegistros) throw new Error("No se pudieron leer los registros");
    registros.push(...((lote ?? []) as Registro[]));
    if ((lote ?? []).length < LOTE) break;
    if (registros.length >= TOPE) {
      truncado = true;
      break;
    }
  }

  const { data: visitas, error: errVisitas } = await db.rpc("launch_visit_stats", {
    p_client: clientId,
    p_launch: id,
  });
  // Las visitas son un agregado aparte: si fallan, el panel muestra "—" en
  // visitantes y conversión, pero los registros se siguen viendo.
  if (errVisitas) console.error("[lanzamientos] no se pudieron leer las visitas:", errVisitas.message);

  const l = lanzamiento as unknown as Lanzamiento;
  // Los entregables se revalidan al leer: un dato raro nunca rompe el portal.
  const listaPaginas = ((paginas ?? []) as unknown as PaginaLanzamiento[]).map((p) => ({
    ...p,
    deliverables: validarEntregables(p.deliverables),
  }));
  const visitasTotales = ((visitas ?? []) as VisitaAgregada[]).map((v) => ({
    ...v,
    visitors: Number(v.visitors),
  }));
  const compras: Compra[] = [];

  // Landings que son rutas de un proyecto conectado: sus datos viven por
  // proyecto y ruta, y se suman entre las fechas del lanzamiento.
  const desde = l.starts_on ?? diaDe(l.created_at);
  const hasta = l.ends_on ?? diaDe(new Date());
  const porSitio = new Map<string, Map<string, string>>();
  for (const p of listaPaginas) {
    if (!p.site_id || !p.path) continue;
    const rutas = porSitio.get(p.site_id) ?? new Map<string, string>();
    rutas.set(p.path, p.id);
    porSitio.set(p.site_id, rutas);
  }

  for (const [siteId, paginaPorRuta] of porSitio) {
    const rutas = [...paginaPorRuta.keys()];
    try {
      const [vis, conv] = await Promise.all([
        visitasDeRutas(clientId, siteId, rutas, desde, hasta),
        conversionesDeRutas(clientId, siteId, rutas, desde, hasta),
      ]);
      for (const v of vis) {
        const pageId = paginaPorRuta.get(v.path);
        if (pageId) visitasTotales.push({ page_id: pageId, day: v.day, utm_source: v.utm_source, visitors: v.visitors });
      }
      for (const c of conv) {
        const pageId = c.path ? (paginaPorRuta.get(c.path) ?? null) : null;
        if (c.kind === "purchase") {
          compras.push({ id: c.id, page_id: pageId, amount: c.amount, currency: c.currency, occurred_at: c.occurred_at });
        } else if (c.email) {
          registros.push({
            id: c.id,
            page_id: pageId,
            email: c.email,
            name: c.name,
            phone: c.phone,
            utm_source: c.utm_source,
            utm_medium: c.utm_medium,
            utm_campaign: c.utm_campaign,
            utm_content: c.utm_content,
            registered_at: c.occurred_at,
            extra: null,
          });
        }
      }
    } catch (e) {
      console.error("[lanzamientos] no se pudieron leer los datos del proyecto conectado:", e);
    }
  }
  registros.sort((a, b) => b.registered_at.localeCompare(a.registered_at));

  // Si las listas fallan, el panel se ve igual sin el embudo.
  const listas = await listasDeLanzamiento(clientId, id)
    .then((l) => cruzarListas(registros, l))
    .catch((e) => {
      console.error("[lanzamientos] no se pudieron leer las listas:", e);
      return [];
    });

  return {
    lanzamiento: l,
    paginas: listaPaginas,
    registros,
    visitas: visitasTotales,
    compras,
    truncado,
    listas,
  };
}

/** Listas del lanzamiento con sus miembros (email y teléfono normalizados). */
async function listasDeLanzamiento(
  clientId: string,
  launchId: string,
): Promise<{ id: string; name: string; miembros: Miembro[] }[]> {
  const db = supabaseAdmin();
  const { data: listas, error } = await db
    .from("launch_lists")
    .select("id, name")
    .eq("client_id", clientId)
    .eq("launch_id", launchId)
    // "~…" es una lista que se está cargando (reemplazo en curso): todavía no cuenta.
    .not("name", "like", "~%")
    .order("position")
    .order("created_at");
  if (error) throw new Error("No se pudieron leer las listas");
  if (!listas?.length) return [];

  const miembros = new Map<string, Miembro[]>(listas.map((l) => [l.id as string, []]));
  for (let desde = 0; ; desde += LOTE) {
    const { data: lote, error: errMiembros } = await db
      .from("launch_list_members")
      .select("list_id, email, phone")
      .eq("client_id", clientId)
      .in("list_id", [...miembros.keys()])
      .order("id")
      .range(desde, desde + LOTE - 1);
    if (errMiembros) throw new Error("No se pudieron leer las listas");
    for (const m of lote ?? []) {
      miembros.get(m.list_id as string)?.push({ email: m.email as string | null, phone: m.phone as string | null });
    }
    if ((lote ?? []).length < LOTE || desde >= 50_000) break;
  }
  return listas.map((l) => ({ id: l.id as string, name: l.name as string, miembros: miembros.get(l.id as string) ?? [] }));
}

/** Cliente dueño de un lanzamiento: el panel entra por id y de acá saca el filtro. */
export async function clienteDeLanzamiento(id: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from("launches")
    .select("client_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo leer el lanzamiento");
  return (data?.client_id as string | undefined) ?? null;
}

export interface ConexionLanzamiento {
  webhookToken: string;
  /** Hay webhook creado en MailerLite desde el panel (con firma). */
  conectado: boolean;
  ultimoEnvio: { recibido: string; firmaOk: boolean | null; guardados: number; error: string | null } | null;
}

/**
 * Datos de la conexión con MailerLite. SOLO para el panel del owner: incluye
 * el token de la URL del webhook. El secreto de firma no sale nunca.
 */
export async function conexionDeLanzamiento(
  clientId: string,
  id: string,
): Promise<ConexionLanzamiento | null> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("launches")
    .select("webhook_token, mailerlite_webhook_id")
    .eq("client_id", clientId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo leer la conexión");
  if (!data) return null;

  const { data: log } = await db
    .from("webhook_log")
    .select("received_at, signature_ok, stored, error")
    .eq("launch_id", id)
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    webhookToken: data.webhook_token as string,
    conectado: Boolean(data.mailerlite_webhook_id),
    ultimoEnvio: log
      ? {
          recibido: log.received_at as string,
          firmaOk: log.signature_ok as boolean | null,
          guardados: log.stored as number,
          error: (log.error as string | null) ?? null,
        }
      : null,
  };
}
