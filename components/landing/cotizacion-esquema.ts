import { z } from "zod";
import { fechaOpcional, montoOpcional, parsearMonto } from "@/components/landing/esquema-comun";
import { urlOpcional } from "@/components/landing/url-esquema";
import { ESTADOS_COTIZACION, MONEDAS } from "@/lib/landing/tipos";

/**
 * Espejo de las reglas de `guardarCotizacion` (app/landing-pages/acciones.ts),
 * solo para feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   title             -> obligatorio, tras trim ("Falta el título de la cotización")
 *   total_amount      -> vacío, o número >= 0 (acepta coma decimal y espacios)
 *   currency          -> una de MONEDAS
 *   commercial_status -> uno de ESTADOS_COTIZACION
 *   proposal_url      -> vacío, o URL http(s) válida
 *   sent_at           -> vacío o AAAA-MM-DD
 *   alloc_<id>        -> por cada proyecto elegido: vacío o número >= 0, y la
 *                        suma no puede superar el total
 *   client_id, payment_terms, notes, project_ids -> libres
 *
 * `looseObject` conserva las claves dinámicas `alloc_<id>`.
 */
export const cotizacionEsquema = z
  .looseObject({
    id: z.string().optional(),
    title: z.string().trim().min(1, "Falta el título de la cotización"),
    client_id: z.string().optional(),
    total_amount: montoOpcional,
    currency: z.enum(MONEDAS, { error: "Moneda inválida" }),
    commercial_status: z.enum(ESTADOS_COTIZACION, { error: "Estado comercial inválido" }),
    payment_terms: z.string().optional(),
    sent_at: fechaOpcional,
    proposal_url: urlOpcional,
    notes: z.string().optional(),
    project_ids: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .superRefine((v, ctx) => {
    const proyectos = ([] as string[]).concat(v.project_ids ?? []).filter(Boolean);

    let suma = 0;
    for (const pid of proyectos) {
      const crudo = v[`alloc_${pid}`];
      const n = parsearMonto(typeof crudo === "string" ? crudo : "");
      if (n === undefined) {
        ctx.addIssue({ code: "custom", message: "Monto asignado inválido" });
        return;
      }
      suma += n ?? 0;
    }

    const total = parsearMonto(v.total_amount);
    if (typeof total === "number" && suma > total) {
      ctx.addIssue({
        code: "custom",
        path: ["total_amount"],
        message: `Lo asignado a los proyectos (${suma}) supera el total (${total})`,
      });
    }
  });
