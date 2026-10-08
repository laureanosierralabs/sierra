import { z } from "zod";

/**
 * Espejo de `agregarLinkTarea` (app/landing-pages/acciones.ts), solo para
 * feedback inmediato; el server sigue validando.
 *
 *   task_id -> obligatorio ("Falta la tarea")
 *   url     -> obligatoria, URL válida con protocolo http o https
 *   name    -> opcional (sin nombre el server usa el dominio)
 */
export const linkAdjuntoEsquema = z.object({
  task_id: z.string().trim().min(1, "Falta la tarea"),
  url: z
    .string()
    .trim()
    .min(1, "Falta el link")
    .superRefine((valor, ctx) => {
      let parsed: URL;
      try {
        parsed = new URL(valor);
      } catch {
        ctx.addIssue({ code: "custom", message: "La URL no es válida" });
        return;
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        ctx.addIssue({ code: "custom", message: "La URL debe empezar con http:// o https://" });
      }
    }),
});
