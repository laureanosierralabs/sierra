import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type { DatosDespues, EventoSitio, EventoWebinar } from "@/lib/lanzamientos/despues";

const LOTE = 1000;
const TOPE = 20_000;

/**
 * Eventos de después del registro de un lanzamiento: clics de los proyectos
 * conectados de sus landings (dentro de las fechas del lanzamiento) e ingresos
 * al webinar. Filtra por cliente en cada consulta, como el resto de las
 * lecturas. Lanza si la base falla (por ejemplo, migración sin aplicar):
 * quien llama lo registra y sigue sin la sección.
 */
export async function eventosDeLanzamiento(
  clientId: string,
  launchId: string,
  sitios: string[],
  desde: string,
  hasta: string,
): Promise<DatosDespues> {
  const db = supabaseAdmin();

  const eventos: EventoSitio[] = [];
  if (sitios.length > 0) {
    for (let inicio = 0; eventos.length < TOPE; inicio += LOTE) {
      const { data, error } = await db
        .from("site_events")
        .select("site_id, kind, path, email, target, day")
        .eq("client_id", clientId)
        .in("site_id", sitios)
        .gte("day", desde)
        .lte("day", hasta)
        .order("id")
        .range(inicio, inicio + LOTE - 1);
      if (error) throw new Error(`No se pudieron leer los eventos de las landings: ${error.message}`);
      eventos.push(...((data ?? []) as EventoSitio[]));
      if ((data ?? []).length < LOTE) break;
    }
  }

  const webinar: EventoWebinar[] = [];
  for (let inicio = 0; webinar.length < TOPE; inicio += LOTE) {
    const { data, error } = await db
      .from("launch_events")
      .select("email, day, occurred_at")
      .eq("client_id", clientId)
      .eq("launch_id", launchId)
      .eq("kind", "webinar_join")
      .order("id")
      .range(inicio, inicio + LOTE - 1);
    if (error) throw new Error(`No se pudieron leer los ingresos al webinar: ${error.message}`);
    webinar.push(...((data ?? []) as EventoWebinar[]));
    if ((data ?? []).length < LOTE) break;
  }

  return { eventos, webinar };
}

export interface WebinarLanzamiento {
  url: string | null;
  token: string;
}

/**
 * Link del webinar y token del link personal. SOLO para el panel del owner:
 * el portal del cliente no necesita armar links.
 */
export async function webinarDeLanzamiento(clientId: string, id: string): Promise<WebinarLanzamiento | null> {
  const { data, error } = await supabaseAdmin()
    .from("launches")
    .select("webinar_url, webinar_token")
    .eq("client_id", clientId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    // Migración sin aplicar: la pantalla se ve igual, sin la sección.
    console.error("[lanzamientos] no se pudo leer el webinar:", error.message);
    return null;
  }
  if (!data) return null;
  return { url: (data.webinar_url as string | null) ?? null, token: data.webinar_token as string };
}
