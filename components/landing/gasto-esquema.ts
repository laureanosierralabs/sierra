import { z } from "zod";
import { fechaOpcional, fechaRequerida, parsearMonto } from "@/components/landing/esquema-comun";
import { CATEGORIAS_GASTO, MONEDAS, PERIODOS_GASTO } from "@/lib/landing/tipos";

/**
 * Espejo de las reglas de `guardarGastoFijo` (app/landing-pages/acciones.ts),
 * solo para feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   name         -> obligatorio, tras trim ("Falta el nombre del gasto")
 *   amount       -> número válido (acepta coma decimal y espacios) y mayor a cero
 *   currency     -> una de MONEDAS
 *   period       -> uno de PERIODOS_GASTO
 *   category     -> una de CATEGORIAS_GASTO
 *   active_from  -> AAAA-MM-DD; la UI lo exige (el server usaría hoy si llega vacío)
 *   active_until -> vacío (sigue vigente) o AAAA-MM-DD
 *   id, notes    -> libres
 */
export const gastoEsquema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Falta el nombre del gasto"),
  amount: z.string().superRefine((v, ctx) => {
    const n = parsearMonto(v);
    if (n === undefined) {
      ctx.addIssue({ code: "custom", message: "Monto inválido" });
    } else if (n === null || n <= 0) {
      ctx.addIssue({ code: "custom", message: "El monto tiene que ser mayor a cero" });
    }
  }),
  currency: z.enum(MONEDAS, { error: "Moneda inválida" }),
  period: z.enum(PERIODOS_GASTO, { error: "Periodo inválido" }),
  category: z.enum(CATEGORIAS_GASTO, { error: "Categoría inválida" }),
  active_from: fechaRequerida,
  active_until: fechaOpcional,
  notes: z.string().optional(),
});
