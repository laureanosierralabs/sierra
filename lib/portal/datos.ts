import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type { EstadoPago, Moneda } from "@/lib/landing/tipos";
import {
  lanzamientoDeCliente,
  lanzamientosDeCliente,
  type DetalleLanzamiento,
  type LanzamientoConTotal,
} from "@/lib/lanzamientos/datos";
import type { ContextoPortal } from "@/lib/portal/contexto";

/**
 * Lecturas del portal. Regla de esta capa: toda función recibe el
 * ContextoPortal y filtra por `ctx.clientId`. Nunca importar
 * `lib/landing/datos.ts` desde el portal: esas consultas son del panel y no
 * filtran por cliente.
 */

/** Lanzamientos del cliente, con su total de registros. */
export async function lanzamientosPortal(ctx: ContextoPortal): Promise<LanzamientoConTotal[]> {
  return lanzamientosDeCliente(ctx.clientId);
}

/** Null si el lanzamiento no existe o es de otro cliente (mismo 404 en los dos casos). */
export async function lanzamientoPortal(
  ctx: ContextoPortal,
  id: string,
): Promise<DetalleLanzamiento | null> {
  return lanzamientoDeCliente(ctx.clientId, id);
}

export interface CotizacionPortal {
  numero: number;
  title: string;
  total_amount: number | null;
  currency: Moneda;
  payment_status: EstadoPago;
  public_token: string;
  sent_at: string | null;
  created_at: string;
}

/**
 * Cotizaciones que se le compartieron al cliente: las que tienen link público
 * activo. Un borrador sin link no aparece; revocar el link la saca del portal.
 */
export async function cotizacionesCompartidas(ctx: ContextoPortal): Promise<CotizacionPortal[]> {
  const { data, error } = await supabaseAdmin()
    .from("quotes")
    .select("numero, title, total_amount, currency, payment_status, public_token, sent_at, created_at")
    .eq("client_id", ctx.clientId)
    .not("public_token", "is", null)
    .order("numero", { ascending: false });

  if (error) throw new Error("No se pudieron leer las cotizaciones");
  return (data ?? []).map((q) => ({
    ...(q as CotizacionPortal),
    total_amount: q.total_amount === null ? null : Number(q.total_amount),
  }));
}

/** Imagen de portada de la marca para el inicio de su portal. */
export async function portadaCliente(ctx: ContextoPortal): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("clients")
    .select("portal_cover_url")
    .eq("id", ctx.clientId)
    .maybeSingle();
  return (data?.portal_cover_url as string | null | undefined) ?? null;
}

export interface AccesoPortal {
  id: string;
  name: string;
  url: string | null;
  username: string | null;
  tieneSecreto: boolean;
}

/**
 * Accesos que el owner marcó como visibles para este cliente. La contraseña
 * no viaja: se pide aparte, con un click (revelarAccesoPortal).
 */
export async function accesosPortal(ctx: ContextoPortal): Promise<AccesoPortal[]> {
  const { data, error } = await supabaseAdmin()
    .from("client_resources")
    .select("id, name, url, username, secret_encrypted")
    .eq("client_id", ctx.clientId)
    .eq("portal_visible", true)
    .order("created_at");
  if (error) throw new Error("No se pudieron leer los accesos");
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    url: (r.url as string | null) ?? null,
    username: (r.username as string | null) ?? null,
    tieneSecreto: Boolean(r.secret_encrypted),
  }));
}
