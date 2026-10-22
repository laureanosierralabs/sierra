import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import { cerrarVencidos } from "@/lib/lanzamientos/datos";
import { diaDe } from "@/lib/lanzamientos/tipos";
import { evaluarAlertas, type Alerta, type EstadoLanzamientoActivo } from "@/lib/lanzamientos/alertas";

type Fila = Record<string, unknown>;
const nombreCliente = (c: unknown) =>
  ((Array.isArray(c) ? c[0] : c) as { name?: string } | null)?.name ?? "—";
const masReciente = (...fechas: (string | null | undefined)[]) =>
  fechas.filter((f): f is string => Boolean(f)).sort().at(-1) ?? null;

/**
 * Alertas de los lanzamientos activos de todos los clientes. Solo para el
 * owner (inicio del panel). Pocas consultas por lanzamiento: suele haber uno
 * o dos activos a la vez.
 */
export async function alertasDeLanzamientos(): Promise<Alerta[]> {
  await cerrarVencidos();
  const db = supabaseAdmin();
  const hoy = diaDe(new Date());

  const { data: lanzamientos, error } = await db
    .from("launches")
    .select("id, name, client_id, starts_on, ends_on, clients(name)")
    .eq("status", "activo");
  if (error) throw new Error("No se pudieron leer los lanzamientos activos");
  const activos = ((lanzamientos ?? []) as Fila[]).filter(
    (l) => (!l.starts_on || (l.starts_on as string) <= hoy) && (!l.ends_on || (l.ends_on as string) >= hoy),
  );
  if (activos.length === 0) return [];

  const ids = activos.map((l) => l.id as string);
  const hace24 = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const [{ data: paginas }, { data: fallidos }] = await Promise.all([
    db.from("launch_pages").select("launch_id, site_id, path, mailerlite_group_id").in("launch_id", ids),
    db
      .from("webhook_log")
      .select("launch_id, error, received_at")
      .in("launch_id", ids)
      .gte("received_at", hace24)
      .or("signature_ok.eq.false,error.not.is.null")
      .order("received_at", { ascending: false }),
  ]);

  const siteIds = [...new Set(((paginas ?? []) as Fila[]).map((p) => p.site_id as string | null).filter(Boolean))] as string[];
  const { data: sitios } = siteIds.length
    ? await db.from("client_sites").select("id, name, last_event_at").in("id", siteIds)
    : { data: [] };

  // Última visita por proyecto conectado (last_event_at solo se mueve con conversiones).
  const ultimaVisita = new Map<string, string | null>();
  await Promise.all(
    siteIds.map(async (id) => {
      const { data } = await db
        .from("site_visits")
        .select("visited_at")
        .eq("site_id", id)
        .order("day", { ascending: false })
        .order("visited_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      ultimaVisita.set(id, (data?.visited_at as string | undefined) ?? null);
    }),
  );

  const estados: EstadoLanzamientoActivo[] = await Promise.all(
    activos.map(async (l) => {
      const id = l.id as string;
      const propias = ((paginas ?? []) as Fila[]).filter((p) => p.launch_id === id);
      const sitiosDelLanzamiento = [...new Set(propias.map((p) => p.site_id as string | null).filter(Boolean))] as string[];
      const rutas = propias.map((p) => p.path as string | null).filter(Boolean) as string[];
      const errores = ((fallidos ?? []) as Fila[]).filter((f) => f.launch_id === id);

      const [{ data: ultimoMailerlite }, { data: ultimoKit }] = await Promise.all([
        db
          .from("launch_registrations")
          .select("registered_at")
          .eq("launch_id", id)
          .order("registered_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        sitiosDelLanzamiento.length && rutas.length
          ? db
              .from("site_conversions")
              .select("occurred_at")
              .in("site_id", sitiosDelLanzamiento)
              .in("path", rutas)
              .eq("kind", "lead")
              .order("occurred_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        id,
        name: l.name as string,
        cliente: nombreCliente(l.clients),
        starts_on: (l.starts_on as string | null) ?? null,
        sitios: ((sitios ?? []) as Fila[])
          .filter((s) => sitiosDelLanzamiento.includes(s.id as string))
          .map((s) => ({
            id: s.id as string,
            name: s.name as string,
            ultimoEvento: masReciente(ultimaVisita.get(s.id as string), s.last_event_at as string | null),
          })),
        usaMailerlite: propias.some((p) => p.mailerlite_group_id),
        webhookFallidos: errores.length,
        ultimoErrorWebhook: (errores[0]?.error as string | null | undefined) ?? (errores.length ? "firma inválida" : null),
        ultimoRegistro: masReciente(
          (ultimoMailerlite as Fila | null)?.registered_at as string | undefined,
          (ultimoKit as Fila | null)?.occurred_at as string | undefined,
        ),
      };
    }),
  );

  return evaluarAlertas(estados);
}
