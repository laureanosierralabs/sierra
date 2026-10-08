import { z } from "zod";
import { ESTADOS_TAREA, PRIORIDADES } from "@/lib/landing/tipos";

/**
 * Espejo de las reglas de `guardarTarea` (app/landing-pages/acciones.ts), solo
 * para feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   title      -> obligatorio, tras trim ("Falta el título de la tarea")
 *   status     -> uno de ESTADOS_TAREA ("Estado inválido")
 *   priority   -> una de PRIORIDADES ("Prioridad inválido")
 *   due_date   -> vacío, o AAAA-MM-DD ("Fecha inválida")
 *   project_id, description, assignee_ids -> libres
 */
export const tareaEsquema = z.object({
  title: z.string().trim().min(1, "Falta el título de la tarea"),
  status: z.enum(ESTADOS_TAREA, { error: "Estado inválido" }),
  priority: z.enum(PRIORIDADES, { error: "Prioridad inválida" }),
  due_date: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Fecha inválida"),
});
