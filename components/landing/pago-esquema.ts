import { z } from "zod";
import { fechaOpcional, parsearMonto } from "@/components/landing/esquema-comun";

/**
 * Espejo de las reglas de `registrarPago` (app/landing-pages/acciones.ts), solo
 * para feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   quote_id -> obligatorio ("Falta la cotización")
 *   amount   -> número válido (acepta coma decimal y espacios) y mayor a cero
 *   paid_on  -> vacío (el server usa hoy) o AAAA-MM-DD
 *   method, notes -> libres
 *
 * Lo que depende de lo ya cobrado ("Se pasa del total") solo lo sabe el server.
 */
export const pagoEsquema = z.object({
  quote_id: z.string().trim().min(1, "Falta la cotización"),
  amount: z.string().superRefine((v, ctx) => {
    const n = parsearMonto(v);
    if (n === undefined) {
      ctx.addIssue({ code: "custom", message: "Monto inválido" });
    } else if (n === null || n <= 0) {
      ctx.addIssue({ code: "custom", message: "El monto del cobro tiene que ser mayor a cero" });
    }
  }),
  paid_on: fechaOpcional,
  method: z.string().optional(),
  notes: z.string().optional(),
});
