import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import { webinarDeLanzamiento } from "@/lib/lanzamientos/despues-datos";
import { esLugar, esTipoEnlace, type MarcaLugar, type TipoEnlace } from "@/lib/lanzamientos/enlaces";
import type { GrupoWhatsapp } from "@/lib/lanzamientos/grupos";
import { gruposDeLanzamiento } from "@/lib/lanzamientos/grupos-datos";

/**
 * Lecturas y cambios de los enlaces de un lanzamiento (webinar y grupo de
 * WhatsApp). Todas reciben el `clientId` y filtran por él, como el resto de
 * lanzamientos; el panel (owner) y el portal (cliente) validan su permiso antes.
 */

export interface DatosEnlace {
  /** Token del link estable. */
  token: string;
  /** Hay a dónde mandar: URL del webinar o al menos un grupo cargado. */
  tieneDestino: boolean;
  usos: number;
  ultimoUso: string | null;
  marcas: MarcaLugar[];
}

export interface EnlacesLanzamiento {
  webinar: (DatosEnlace & { url: string | null }) | null;
  grupo: (DatosEnlace & { grupos: GrupoWhatsapp[] }) | null;
}

/** Ingresos al webinar (launch_events) y cuándo fue el último. */
async function usoWebinar(clientId: string, launchId: string): Promise<{ usos: number; ultimoUso: string | null }> {
  const db = supabaseAdmin();
  const [{ count, error }, { data }] = await Promise.all([
    db
      .from("launch_events")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("launch_id", launchId)
      .eq("kind", "webinar_join"),
    db
      .from("launch_events")
      .select("occurred_at")
      .eq("client_id", clientId)
      .eq("launch_id", launchId)
      .eq("kind", "webinar_join")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error) console.error("[enlaces] no se pudieron contar los ingresos al webinar:", error.message);
  return { usos: count ?? 0, ultimoUso: (data?.occurred_at as string | undefined) ?? null };
}

/** Último uso del link del grupo. Null si la migración no está aplicada. */
async function ultimoUsoGrupo(clientId: string, launchId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from("launches")
    .select("group_last_used_at")
    .eq("client_id", clientId)
    .eq("id", launchId)
    .maybeSingle();
  if (error) {
    console.error("[enlaces] no se pudo leer el último uso del grupo:", error.message);
    return null;
  }
  return (data?.group_last_used_at as string | null | undefined) ?? null;
}

/** Lugares tildados del lanzamiento. Vacío si la migración no está aplicada. */
export async function marcasDeLanzamiento(clientId: string, launchId: string): Promise<MarcaLugar[]> {
  const { data, error } = await supabaseAdmin()
    .from("launch_link_placements")
    .select("link, placement, checked_by, checked_at")
    .eq("client_id", clientId)
    .eq("launch_id", launchId);
  if (error) {
    console.error("[enlaces] no se pudieron leer los lugares:", error.message);
    return [];
  }
  return (data ?? []) as MarcaLugar[];
}

/** Todo lo que muestra la pestaña Enlaces. Cada bloque es null si no se pudo leer. */
export async function enlacesDeLanzamiento(clientId: string, launchId: string): Promise<EnlacesLanzamiento> {
  const [webinar, grupos, uso, ultimoGrupo, marcas] = await Promise.all([
    webinarDeLanzamiento(clientId, launchId).catch(() => null),
    gruposDeLanzamiento(clientId, launchId).catch(() => null),
    usoWebinar(clientId, launchId).catch(() => ({ usos: 0, ultimoUso: null })),
    ultimoUsoGrupo(clientId, launchId).catch(() => null),
    marcasDeLanzamiento(clientId, launchId).catch(() => []),
  ]);
  return {
    webinar: webinar
      ? {
          token: webinar.token,
          url: webinar.url,
          tieneDestino: Boolean(webinar.url),
          usos: uso.usos,
          ultimoUso: uso.ultimoUso,
          marcas: marcas.filter((m) => m.link === "webinar"),
        }
      : null,
    grupo: grupos
      ? {
          token: grupos.token,
          grupos: grupos.grupos,
          tieneDestino: grupos.grupos.length > 0,
          usos: grupos.grupos.reduce((t, g) => t + g.joins, 0),
          ultimoUso: ultimoGrupo,
          marcas: marcas.filter((m) => m.link === "grupo"),
        }
      : null,
  };
}

/** Tilda o destilda un lugar. Destildar borra la fila. El lanzamiento tiene que ser del cliente. */
export async function marcarLugar(
  clientId: string,
  launchId: string,
  link: string,
  placement: string,
  marcado: boolean,
  autor: string,
): Promise<{ error: string } | null> {
  if (!esTipoEnlace(link) || !esLugar(placement)) return { error: "Lugar inválido" };
  const db = supabaseAdmin();

  const { data: lanzamiento } = await db
    .from("launches")
    .select("id")
    .eq("client_id", clientId)
    .eq("id", launchId)
    .maybeSingle();
  if (!lanzamiento) return { error: "El lanzamiento no existe" };

  const tipo: TipoEnlace = link;
  const { error } = marcado
    ? await db.from("launch_link_placements").upsert(
        { launch_id: launchId, client_id: clientId, link: tipo, placement, checked_by: autor, checked_at: new Date().toISOString() },
        { onConflict: "launch_id,link,placement" },
      )
    : await db
        .from("launch_link_placements")
        .delete()
        .eq("client_id", clientId)
        .eq("launch_id", launchId)
        .eq("link", tipo)
        .eq("placement", placement);
  if (error) {
    console.error("[enlaces] no se pudo guardar el lugar:", error.message);
    return { error: "No se pudo guardar: probá de nuevo" };
  }
  return null;
}

/** Guarda (o quita, con null) el destino del webinar. Error si el lanzamiento no es del cliente. */
export async function guardarDestinoWebinar(clientId: string, launchId: string, url: string | null): Promise<{ error: string } | null> {
  const { data, error } = await supabaseAdmin()
    .from("launches")
    .update({ webinar_url: url, updated_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .eq("id", launchId)
    .select("id")
    .maybeSingle();
  if (error) return { error: "No se pudo guardar el link del webinar" };
  if (!data) return { error: "El lanzamiento no existe" };
  return null;
}
