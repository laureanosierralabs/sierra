import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type { RutaDescubierta, SitioConectado } from "@/lib/sitios/tipos";

/**
 * Lecturas de proyectos conectados. Todas reciben el `clientId` y filtran por
 * él (igual que lanzamientos): la clave de aislamiento va en cada consulta.
 */

const COLUMNAS = "id, client_id, name, domain, site_key, last_event_at, created_at";

export async function sitiosDeCliente(clientId: string): Promise<SitioConectado[]> {
  const { data, error } = await supabaseAdmin()
    .from("client_sites")
    .select(COLUMNAS)
    .eq("client_id", clientId)
    .order("created_at");
  if (error) throw new Error("No se pudieron leer los proyectos conectados");
  return (data ?? []) as SitioConectado[];
}

export async function rutasDeSitio(clientId: string, siteId: string): Promise<RutaDescubierta[]> {
  const { data, error } = await supabaseAdmin().rpc("site_paths", {
    p_client: clientId,
    p_site: siteId,
  });
  if (error) throw new Error("No se pudieron leer las rutas del proyecto");
  return ((data ?? []) as RutaDescubierta[])
    .map((r) => ({ ...r, visitors: Number(r.visitors), conversions: Number(r.conversions) }))
    .sort((a, b) => (b.last_seen ?? "").localeCompare(a.last_seen ?? "") || a.path.localeCompare(b.path));
}

export interface VisitaDeRuta {
  path: string;
  day: string;
  utm_source: string | null;
  visitors: number;
}

export interface ConversionDeRuta {
  id: string;
  kind: "lead" | "purchase";
  path: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  amount: number | null;
  currency: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  occurred_at: string;
}

/** Visitantes por ruta, día y fuente de las rutas pedidas, en un período. */
export async function visitasDeRutas(
  clientId: string,
  siteId: string,
  rutas: string[],
  desde: string,
  hasta: string,
): Promise<VisitaDeRuta[]> {
  if (rutas.length === 0) return [];
  const { data, error } = await supabaseAdmin().rpc("site_visit_stats", {
    p_client: clientId,
    p_site: siteId,
    p_paths: rutas,
    p_from: desde,
    p_to: hasta,
  });
  if (error) throw new Error("No se pudieron leer las visitas del proyecto");
  return ((data ?? []) as VisitaDeRuta[]).map((v) => ({ ...v, visitors: Number(v.visitors) }));
}

const LOTE = 1000;
const TOPE = 20_000;

/** Registros y compras de las rutas pedidas, en un período (fechas inclusive). */
export async function conversionesDeRutas(
  clientId: string,
  siteId: string,
  rutas: string[],
  desde: string,
  hasta: string,
): Promise<ConversionDeRuta[]> {
  if (rutas.length === 0) return [];
  const db = supabaseAdmin();
  const salida: ConversionDeRuta[] = [];
  for (let inicio = 0; salida.length < TOPE; inicio += LOTE) {
    const { data, error } = await db
      .from("site_conversions")
      .select(
        "id, kind, path, email, name, phone, amount, currency, utm_source, utm_medium, utm_campaign, utm_content, occurred_at",
      )
      .eq("client_id", clientId)
      .eq("site_id", siteId)
      .in("path", rutas)
      // Días completos en hora de Buenos Aires (UTC-3).
      .gte("occurred_at", `${desde}T00:00:00-03:00`)
      .lte("occurred_at", `${hasta}T23:59:59.999-03:00`)
      .order("occurred_at", { ascending: false })
      .range(inicio, inicio + LOTE - 1);
    if (error) throw new Error("No se pudieron leer las conversiones del proyecto");
    salida.push(
      ...((data ?? []) as ConversionDeRuta[]).map((c) => ({
        ...c,
        amount: c.amount === null ? null : Number(c.amount),
      })),
    );
    if ((data ?? []).length < LOTE) break;
  }
  return salida;
}
