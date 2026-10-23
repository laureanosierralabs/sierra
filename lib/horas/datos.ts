import "server-only";

import { auth } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { fechaValida, horaValida, type EntradaHora } from "@/lib/horas/tipos";

/**
 * Lecturas de la tabla de horas. El equipo ve SOLO sus horas: el filtro por
 * persona sale de la sesión, nunca de la URL. El owner ve las de todos y puede
 * filtrar por persona.
 */

export interface FiltroHoras {
  desde: string;
  hasta: string;
  /** Solo lo respeta el owner. */
  persona?: string | null;
  cliente?: string | null;
}

export interface VistaHoras {
  entradas: EntradaHora[];
  esOwner: boolean;
  userId: string;
  /** Personas con horas cargadas (para el filtro del owner). */
  personas: { id: string; nombre: string }[];
  /** Hay más cargas que el tope leído: los totales serían parciales. */
  truncado: boolean;
}

const TOPE = 5000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function horasVisibles(filtro: FiltroHoras): Promise<VistaHoras | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const { esOwner, esCliente } = await accesoActual();
  if (esCliente) return null;

  const db = supabaseAdmin();
  const desde = fechaValida(filtro.desde);
  const hasta = fechaValida(filtro.hasta);

  let consulta = db
    .from("time_entries")
    .select("id, user_id, user_name, client_id, work_date, start_time, end_time, minutes, notes, team_payment_id")
    .order("work_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(TOPE);
  if (desde) consulta = consulta.gte("work_date", desde);
  if (hasta) consulta = consulta.lte("work_date", hasta);
  if (!esOwner) consulta = consulta.eq("user_id", userId);
  else if (filtro.persona) consulta = consulta.eq("user_id", filtro.persona);
  // Un cliente que no es uuid haría fallar la consulta: se ignora el filtro.
  if (filtro.cliente && UUID.test(filtro.cliente)) consulta = consulta.eq("client_id", filtro.cliente);

  const { data, error } = await consulta;
  if (error) throw new Error("No se pudieron leer las horas");

  const entradas = ((data ?? []) as EntradaHora[]).map((e) => ({
    ...e,
    start_time: horaValida(e.start_time) ?? e.start_time,
    end_time: horaValida(e.end_time) ?? e.end_time,
    minutes: Number(e.minutes),
  }));

  let personas: { id: string; nombre: string }[] = [];
  if (esOwner) {
    // Nombres de todos los que cargaron horas alguna vez, no solo los del filtro.
    const { data: todas } = await db.from("time_entries").select("user_id, user_name").limit(TOPE);
    const mapa = new Map<string, string>();
    for (const f of todas ?? []) mapa.set(f.user_id as string, f.user_name as string);
    personas = [...mapa.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  return { entradas, esOwner, userId, personas, truncado: entradas.length >= TOPE };
}
