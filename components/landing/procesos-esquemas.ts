import { z } from "zod";

/**
 * Espejo de `guardarProceso` (app/landing-pages/acciones.ts), solo para
 * feedback inmediato; el server sigue validando.
 *
 *   name -> obligatorio, tras trim ("Falta el nombre del proceso")
 *   slug -> si queda vacío se deriva del nombre (minúsculas, espacios -> "-");
 *           el resultado debe cumplir /^[a-z0-9-]+$/
 */
export const procesoEsquema = z
  .object({
    name: z.string().trim().min(1, "Falta el nombre del proceso"),
    slug: z.string().trim(),
  })
  .check((ctx) => {
    const { name, slug } = ctx.value;
    if (!name) return;
    const efectivo = slug || name.toLowerCase().replace(/\s+/g, "-");
    if (!/^[a-z0-9-]+$/.test(efectivo)) {
      ctx.issues.push({
        code: "custom",
        path: ["slug"],
        message: "El identificador solo admite minúsculas, números y guiones",
        input: ctx.value,
      });
    }
  });

/**
 * Espejo de `guardarTareaProceso`:
 *   process_id -> obligatorio ("Falta el proceso")
 *   title      -> obligatorio, tras trim ("Falta el título")
 */
export const tareaProcesoEsquema = z.object({
  process_id: z.string().trim().min(1, "Falta el proceso"),
  title: z.string().trim().min(1, "Falta el título"),
});
