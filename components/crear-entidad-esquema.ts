import { z } from "zod";
import { FECHA } from "@/components/landing/esquema-comun";

/**
 * Espejo de las reglas de `crearProyecto` / `crearCliente`
 * (app/contexto/acciones.ts), solo para feedback inmediato.
 *
 *   nombre  -> obligatorio, tras trim ("Falta el nombre")
 *   unidad  -> obligatoria ("Falta la unidad"); viaja en un campo oculto
 *   entrega -> vacía o AAAA-MM-DD ("Fecha de entrega inválida") — solo proyecto
 *   cliente, proximoPaso, contexto -> libres
 */
const base = {
  nombre: z.string().trim().min(1, "Falta el nombre"),
  unidad: z.string().trim().min(1, "Falta la unidad"),
};

export const proyectoNuevoEsquema = z.object({
  ...base,
  cliente: z.string().optional(),
  entrega: z
    .string()
    .trim()
    .refine((v) => v === "" || FECHA.test(v), "Fecha de entrega inválida")
    .optional(),
  proximoPaso: z.string().optional(),
});

export const clienteNuevoEsquema = z.object({
  ...base,
  contexto: z.string().optional(),
});
