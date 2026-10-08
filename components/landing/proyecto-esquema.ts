import { z } from "zod";
import { urlOpcional } from "@/components/landing/url-esquema";
import { ESTADOS_PROYECTO, ETAPAS, PRIORIDADES, TIPOS_PAGINA } from "@/lib/landing/tipos";

/** El Select de React Aria no admite una opción de valor vacío: se usa este centinela. */
export const SIN_OPCION = "__ninguno__";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const fechaOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || FECHA.test(v), "Fecha inválida");

/** Vacío (o "ninguno" del Select), o uno de los valores permitidos. */
function unaDeOpcional(permitidos: readonly string[], mensaje: string) {
  return z
    .string()
    .trim()
    .refine((v) => v === "" || v === SIN_OPCION || permitidos.includes(v), mensaje);
}

/**
 * Espejo de las reglas de `guardarProyecto` (app/landing-pages/acciones.ts), solo
 * para feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   name         -> obligatorio, tras trim ("Falta el nombre del proyecto")
 *   status       -> uno de ESTADOS_PROYECTO ("Estado inválido")
 *   priority     -> una de PRIORIDADES ("Prioridad inválida")
 *   stage        -> vacío, o una de ETAPAS
 *   page_type    -> vacío, o uno de TIPOS_PAGINA
 *   start_date   -> vacío o AAAA-MM-DD; obligatoria solo al crear (sin `id`)
 *   due_date     -> vacío o AAAA-MM-DD; no puede ser anterior al inicio
 *   site_url, cover_url -> vacío, o URL http(s) válida
 *   client_id, kind, notes_important, assignee_ids, quote_id -> libres
 */
export const proyectoEsquema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Falta el nombre del proyecto"),
    status: z.enum(ESTADOS_PROYECTO, { error: "Estado inválido" }),
    priority: z.enum(PRIORIDADES, { error: "Prioridad inválida" }),
    stage: unaDeOpcional(ETAPAS, "Etapa inválida"),
    page_type: unaDeOpcional(TIPOS_PAGINA, "Tipo de página inválido"),
    start_date: fechaOpcional,
    due_date: fechaOpcional,
    site_url: urlOpcional,
    cover_url: urlOpcional.optional(),
  })
  .superRefine((v, ctx) => {
    const creando = !v.id?.trim();
    if (creando && v.start_date === "") {
      ctx.addIssue({ code: "custom", path: ["start_date"], message: "Falta la fecha de inicio" });
    }
    if (FECHA.test(v.start_date) && FECHA.test(v.due_date) && v.start_date > v.due_date) {
      ctx.addIssue({
        code: "custom",
        path: ["due_date"],
        message: "El inicio no puede ser posterior a la entrega",
      });
    }
  });
