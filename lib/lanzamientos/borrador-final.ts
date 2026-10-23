import "server-only";

import { generarAnalisis, metricasParaAnalisis, type ResultadoAnalisis } from "@/lib/lanzamientos/analisis-ia";
import { lanzamientoDeCliente } from "@/lib/lanzamientos/datos";

/** Lee el lanzamiento y le pide a la IA el borrador del análisis final. No guarda nada. */
export async function borradorDeAnalisis(clientId: string, id: string): Promise<ResultadoAnalisis> {
  const detalle = await lanzamientoDeCliente(clientId, id);
  if (!detalle) return { ok: false, error: "El lanzamiento no existe" };
  return generarAnalisis(metricasParaAnalisis(detalle));
}
