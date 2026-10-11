import { z } from "zod";
import { fechaOpcional, montoOpcional, parsearMonto } from "@/components/landing/esquema-comun";
import { urlOpcional } from "@/components/landing/url-esquema";
import { ESTADOS_COTIZACION, MONEDAS, parsearDescuento } from "@/lib/landing/tipos";

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
 *   items             -> JSON del editor de ítems; con ítems, el total y lo
 *                        asignado los calcula el server
 *   discount          -> con ítems: vacío, monto o porcentaje ("10%") que no
 *                        supere la suma de los ítems
 *   client_id, service, payment_terms, notes, project_ids -> libres
 *
 * `looseObject` conserva las claves dinámicas `alloc_<id>`.
 */
export const cotizacionEsquema = z
  .looseObject({
    id: z.string().optional(),
    title: z.string().trim().min(1, "Falta el título de la cotización"),
    client_id: z.string().optional(),
    service: z.string().optional(),
    items: z.string().optional(),
    discount: z.string().optional(),
    // Ausente cuando hay ítems: el form no muestra el campo.
    total_amount: montoOpcional.optional(),
    currency: z.enum(MONEDAS, { error: "Moneda inválida" }),
    commercial_status: z.enum(ESTADOS_COTIZACION, { error: "Estado comercial inválido" }),
    payment_terms: z.string().optional(),
    sent_at: fechaOpcional,
    proposal_url: urlOpcional,
    notes: z.string().optional(),
    project_ids: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .superRefine((v, ctx) => {
    // Con ítems, el total y lo asignado salen de los ítems y los valida el
    // server: comparar contra el monto manual daría un error falso.
    if (typeof v.items === "string" && v.items !== "[]" && v.items !== "") {
      let items: { title?: string; amount?: string; url?: string }[] = [];
      try {
        items = JSON.parse(v.items);
      } catch {
        return;
      }
      if (items.some((i) => !String(i.title ?? "").trim())) {
        ctx.addIssue({ code: "custom", path: ["items"], message: "Hay un ítem sin título" });
        return;
      }
      if (items.some((i) => i.url && !/^https?:\/\//i.test(i.url.trim()))) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: "El link de un ítem debe empezar con http:// o https://",
        });
        return;
      }
      // Ítems sin montos dejarían la cotización en 0 al guardar. Pasa al
      // convertir proyectos viejos sin monto asignado.
      const montos = items.map((i) => parsearMonto(String(i.amount ?? "")));
      if (montos.includes(undefined)) {
        ctx.addIssue({ code: "custom", path: ["items"], message: "Hay un ítem con monto inválido" });
        return;
      }
      const suma = montos.reduce<number>((t, n) => t + (n ?? 0), 0);
      if (suma <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: "Los ítems suman 0: cargá los montos o quitá los ítems",
        });
        return;
      }
      if (parsearDescuento(v.discount ?? "", suma) === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["items"],
          message: "Descuento inválido: un monto o porcentaje que no supere el subtotal",
        });
      }
      return;
    }

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

    const total = parsearMonto(v.total_amount ?? "");
    if (typeof total === "number" && suma > total) {
      ctx.addIssue({
        code: "custom",
        path: ["total_amount"],
        message: `Lo asignado a los proyectos (${suma}) supera el total (${total})`,
      });
    }
  });
