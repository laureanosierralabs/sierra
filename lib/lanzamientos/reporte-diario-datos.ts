import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import { lanzamientoDeCliente } from "@/lib/lanzamientos/datos";
import {
  reporteLanzamientoEmail,
  urlBaseApp,
  type TipoReporte,
} from "@/lib/lanzamientos/reporte-diario";
import { diaDe } from "@/lib/lanzamientos/tipos";

/**
 * Lecturas del reporte por mail. SOLO para el panel del owner y el cron: estas
 * columnas (destinatarios, último envío) no están en la lista que lee el portal.
 */
export interface AjustesReporte {
  activo: boolean;
  destinatarios: string[];
  ultimoDiario: string | null;
  finalEnviado: string | null;
  /** Borrador del análisis final (lo genera la IA o lo escribe el owner). */
  borradorFinal: string | null;
  borradorFinalAt: string | null;
}

/** Null si el lanzamiento no existe o la migración todavía no está aplicada. */
export async function ajustesDeReporte(clientId: string, id: string): Promise<AjustesReporte | null> {
  const { data, error } = await supabaseAdmin()
    .from("launches")
    .select("daily_report, report_recipients, last_daily_report_on, final_report_sent_at, final_draft, final_draft_at")
    .eq("client_id", clientId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[lanzamientos] no se pudo leer el reporte por mail:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    activo: Boolean(data.daily_report),
    destinatarios: (data.report_recipients as string[] | null) ?? [],
    ultimoDiario: (data.last_daily_report_on as string | null) ?? null,
    finalEnviado: (data.final_report_sent_at as string | null) ?? null,
    borradorFinal: (data.final_draft as string | null) ?? null,
    borradorFinalAt: (data.final_draft_at as string | null) ?? null,
  };
}

/** Hoy en AAAA-MM-DD, hora de Buenos Aires. */
export const hoyBuenosAires = () => diaDe(new Date());

/** Dirección pública de la app (sin barra final); vacío si no hay con qué armarla. */
export const urlBaseDeApp = () =>
  urlBaseApp({
    APP_URL: process.env.APP_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });

/** Arma el mail (diario o final) con los datos actuales del lanzamiento. Null si no existe. */
export async function correoDeReporte(
  clientId: string,
  id: string,
  tipo: TipoReporte,
  /** Análisis aprobado por el owner (solo el final). */
  analisis?: string | null,
) {
  const detalle = await lanzamientoDeCliente(clientId, id);
  if (!detalle) return null;

  const { data: portal } = await supabaseAdmin()
    .from("client_orgs")
    .select("slug")
    .eq("client_id", clientId)
    .maybeSingle();
  const slug = (portal?.slug as string | undefined) ?? null;
  const base = urlBaseApp({
    APP_URL: process.env.APP_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });
  const urlPanel = base && slug ? `${base}/portal/${slug}/lanzamientos/${id}` : null;

  return reporteLanzamientoEmail({
    tipo,
    nombre: detalle.lanzamiento.name,
    detalle,
    hoy: hoyBuenosAires(),
    urlPanel,
    urlReporte: urlPanel ? `${urlPanel}/reporte` : null,
    analisis,
  });
}
