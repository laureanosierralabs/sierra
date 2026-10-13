import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type { Lanzamiento, PaginaLanzamiento, Registro } from "@/lib/lanzamientos/tipos";

/**
 * Lecturas de lanzamientos. Toda función recibe el `clientId` y filtra por
 * él: sirven igual al panel (el owner pasa el cliente del lanzamiento) y al
 * portal (pasa el cliente de su contexto), y ninguna puede leer sin cliente.
 *
 * Las columnas se nombran una por una: `launches` guarda el token y el
 * secreto del webhook, que nunca salen de `conexionDeLanzamiento`.
 */
const COLUMNAS_LANZAMIENTO =
  "id, client_id, name, status, starts_on, ends_on, goal_registrations, created_at";
const COLUMNAS_PAGINA =
  "id, launch_id, name, url, thanks_url, whatsapp_url, checkout_url, project_id, mailerlite_group_id, position";
const COLUMNAS_REGISTRO =
  "id, page_id, email, name, phone, utm_source, utm_medium, utm_campaign, utm_content, registered_at";

export interface LanzamientoConTotal extends Lanzamiento {
  registros: number;
}

export async function lanzamientosDeCliente(clientId: string): Promise<LanzamientoConTotal[]> {
  const { data, error } = await supabaseAdmin()
    .from("launches")
    .select(`${COLUMNAS_LANZAMIENTO}, launch_registrations(count)`)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("No se pudieron leer los lanzamientos");
  return (data ?? []).map((fila) => {
    const { launch_registrations, ...l } = fila as unknown as Lanzamiento & {
      launch_registrations: { count: number }[] | null;
    };
    return { ...l, registros: launch_registrations?.[0]?.count ?? 0 };
  });
}

export interface DetalleLanzamiento {
  lanzamiento: Lanzamiento;
  paginas: PaginaLanzamiento[];
  registros: Registro[];
  /** `true` si hay más registros que el tope leído (los totales serían parciales). */
  truncado: boolean;
}

/* PostgREST devuelve de a 1000 filas: se pagina hasta un tope razonable. */
const LOTE = 1000;
const TOPE = 20_000;

/** Null si el lanzamiento no existe o no es de ese cliente. */
export async function lanzamientoDeCliente(
  clientId: string,
  id: string,
): Promise<DetalleLanzamiento | null> {
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

  return {
    lanzamiento: lanzamiento as unknown as Lanzamiento,
    paginas: (paginas ?? []) as unknown as PaginaLanzamiento[],
    registros,
    truncado,
  };
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
