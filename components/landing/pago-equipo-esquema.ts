import { z } from "zod";
import { fechaRequerida, parsearMonto } from "@/components/landing/esquema-comun";

/**
 * Espejo de las reglas de `registrarPagoEquipo` (app/landing-pages/acciones.ts),
 * solo para feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   agreement_id -> obligatorio ("Falta el acuerdo")
 *   amount       -> número válido (acepta coma decimal y espacios) y mayor a cero
 *   paid_on      -> AAAA-MM-DD; la UI lo exige (el server usaría hoy si llega vacío)
 *   method, notes -> libres
 *
 * Lo que depende de lo ya pagado ("Se pasa del total") solo lo sabe el server.
 */
export const pagoEquipoEsquema = z.object({
  agreement_id: z.string().trim().min(1, "Falta el acuerdo"),
  amount: z.string().superRefine((v, ctx) => {
    const n = parsearMonto(v);
    if (n === undefined) {
      ctx.addIssue({ code: "custom", message: "Monto inválido" });
    } else if (n === null || n <= 0) {
      ctx.addIssue({ code: "custom", message: "El monto del pago tiene que ser mayor a cero" });
    }
  }),
  paid_on: fechaRequerida,
  method: z.string().optional(),
  notes: z.string().optional(),
});
