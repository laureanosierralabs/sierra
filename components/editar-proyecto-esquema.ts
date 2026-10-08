import { z } from "zod";
import { FECHA } from "@/components/landing/esquema-comun";

export const ESTADOS = [
  { value: "activo", label: "Activo" },
  { value: "por-empezar", label: "Por empezar" },
  { value: "bloqueado", label: "Bloqueado" },
  { value: "pausado", label: "Pausado" },
  { value: "terminado", label: "Terminado" },
];

export const PRIORIDADES = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];

function unaDeOpcional(opciones: { value: string }[], mensaje: string) {
  return z
    .string()
    .trim()
    .refine((v) => v === "" || opciones.some((o) => o.value === v), mensaje);
}

/**
 * Espejo de las reglas de `editarProyecto` (app/contexto/acciones.ts), solo
 * para feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   slug      -> obligatorio ("Falta el proyecto"); campo oculto
 *   estado    -> vacío o uno de ESTADOS ("Estado inválido")
 *   prioridad -> vacía o una de PRIORIDADES ("Prioridad inválida")
 *   entrega   -> vacía o AAAA-MM-DD ("Fecha de entrega inválida")
 *   proximoPaso, estadoActual, bitacora, archivo -> libres
 */
export const editarProyectoEsquema = z.object({
  slug: z.string().trim().min(1, "Falta el proyecto"),
  estado: unaDeOpcional(ESTADOS, "Estado inválido"),
  prioridad: unaDeOpcional(PRIORIDADES, "Prioridad inválida"),
  entrega: z
    .string()
    .trim()
    .refine((v) => v === "" || FECHA.test(v), "Fecha de entrega inválida"),
  proximoPaso: z.string().optional(),
  estadoActual: z.string().optional(),
  bitacora: z.string().optional(),
});
