import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import { MAX_GRUPOS_POR_CARGA, type GrupoWhatsapp } from "@/lib/lanzamientos/grupos";

/**
 * Lecturas y cambios de los grupos de WhatsApp de un lanzamiento. Todas reciben
 * el `clientId` y filtran por él: la clave de aislamiento va en cada consulta,
 * igual que el resto de lanzamientos. Las usan el panel (owner) y el portal
 * (cliente); cada uno valida su permiso antes de llamar.
 */

const COLUMNAS = "id, url, position, cap, joins, full_at";

export interface GruposLanzamiento {
  token: string;
  grupos: GrupoWhatsapp[];
}

/** Null si el lanzamiento no es del cliente o la migración no está aplicada. */
export async function gruposDeLanzamiento(clientId: string, launchId: string): Promise<GruposLanzamiento | null> {
  const db = supabaseAdmin();
  const { data: lanzamiento, error } = await db
    .from("launches")
    .select("group_token")
    .eq("client_id", clientId)
    .eq("id", launchId)
    .maybeSingle();
  if (error) {
    console.error("[grupos] no se pudo leer el lanzamiento:", error.message);
    return null;
  }
  if (!lanzamiento) return null;

  const { data, error: errGrupos } = await db
    .from("launch_whatsapp_groups")
    .select(COLUMNAS)
    .eq("client_id", clientId)
    .eq("launch_id", launchId)
    .order("position");
  if (errGrupos) {
    console.error("[grupos] no se pudieron leer los grupos:", errGrupos.message);
    return null;
  }
  return {
    token: lanzamiento.group_token as string,
    grupos: (data ?? []).map((g) => ({ ...g, joins: Number(g.joins), cap: Number(g.cap) })) as GrupoWhatsapp[],
  };
}

/** Agrega los links al final de la fila, en el orden en que vinieron. Los repetidos se saltean. */
export async function agregarGrupos(
  clientId: string,
  launchId: string,
  links: string[],
  autor: string,
): Promise<{ error: string } | { agregados: number; repetidos: number }> {
  if (links.length === 0) return { error: "Pegá al menos un link de grupo de WhatsApp" };
  if (links.length > MAX_GRUPOS_POR_CARGA) return { error: `Hasta ${MAX_GRUPOS_POR_CARGA} grupos por vez` };

  const actuales = await gruposDeLanzamiento(clientId, launchId);
  if (!actuales) return { error: "El lanzamiento no existe" };

  const existentes = new Set(actuales.grupos.map((g) => g.url));
  const nuevos = links.filter((l) => !existentes.has(l));
  if (nuevos.length === 0) return { agregados: 0, repetidos: links.length };

  const ultima = actuales.grupos.reduce((m, g) => Math.max(m, g.position), 0);
  const { error } = await supabaseAdmin()
    .from("launch_whatsapp_groups")
    .insert(
      nuevos.map((url, i) => ({
        launch_id: launchId,
        client_id: clientId,
        url,
        position: ultima + i + 1,
        created_by: autor,
      })),
    );
  if (error) {
    console.error("[grupos] no se pudieron agregar:", error.message);
    return { error: "No se pudieron guardar los grupos: probá de nuevo" };
  }
  return { agregados: nuevos.length, repetidos: links.length - nuevos.length };
}

/**
 * Marca un grupo como lleno (sale de la rotación) o lo vuelve a abrir. Uno que
 * llegó a su tope de personas no se reabre: seguiría lleno igual.
 */
export async function marcarGrupo(clientId: string, groupId: string, lleno: boolean): Promise<{ error: string } | null> {
  if (!lleno) {
    const { data: grupo } = await supabaseAdmin()
      .from("launch_whatsapp_groups")
      .select("joins, cap")
      .eq("client_id", clientId)
      .eq("id", groupId)
      .maybeSingle();
    if (grupo && Number(grupo.joins) >= Number(grupo.cap)) {
      return { error: "Ese grupo ya llegó a su tope de personas: cargá uno nuevo" };
    }
  }
  const { data, error } = await supabaseAdmin()
    .from("launch_whatsapp_groups")
    .update({ full_at: lleno ? new Date().toISOString() : null, alerted_at: null })
    .eq("client_id", clientId)
    .eq("id", groupId)
    .select("id")
    .maybeSingle();
  if (error) return { error: "No se pudo actualizar el grupo" };
  if (!data) return { error: "El grupo no existe" };
  return null;
}

/** Solo se borra un grupo al que todavía no se mandó a nadie: si no, se pierde a quién se mandó. */
export async function borrarGrupo(clientId: string, groupId: string): Promise<{ error: string } | null> {
  const { data, error } = await supabaseAdmin()
    .from("launch_whatsapp_groups")
    .delete()
    .eq("client_id", clientId)
    .eq("id", groupId)
    .eq("joins", 0)
    .select("id")
    .maybeSingle();
  if (error) return { error: "No se pudo borrar el grupo" };
  if (!data) return { error: "Ese grupo ya recibió gente: marcalo como lleno en vez de borrarlo" };
  return null;
}
