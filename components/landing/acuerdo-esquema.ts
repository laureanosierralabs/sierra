import { z } from "zod";
import { fechaOpcional, montoOpcional } from "@/components/landing/esquema-comun";
import { MONEDAS } from "@/lib/landing/tipos";

/**
 * Espejo de las reglas de `guardarAcuerdo` (app/landing-pages/acciones.ts),
 * solo para feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   title        -> obligatorio, tras trim ("Falta el título del acuerdo")
 *   member_name  -> obligatorio, tras trim ("Falta a quién se le paga")
 *   total_amount -> vacío, o número >= 0 (acepta coma decimal y espacios)
 *   currency     -> una de MONEDAS
 *   agreed_on    -> vacío o AAAA-MM-DD
 *   id, payment_terms, notes, project_ids -> libres
 */
export const acuerdoEsquema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Falta el título del acuerdo"),
  member_name: z.string().trim().min(1, "Falta a quién se le paga"),
  project_ids: z.union([z.string(), z.array(z.string())]).optional(),
  total_amount: montoOpcional,
  currency: z.enum(MONEDAS, { error: "Moneda inválida" }),
  agreed_on: fechaOpcional,
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});
