import { z } from "zod";
import { parsearUnidades } from "@/lib/unidades";

/** Espejo del regex de `invitarMiembro` en app/landing-pages/equipo-acciones.ts. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const unidades = z.union([z.string(), z.array(z.string())]).optional();

/**
 * Misma regla en `invitarMiembro` y `cambiarAcceso`: salvo que el rol sea
 * owner, hace falta al menos una unidad válida (`parsearUnidades` descarta
 * las desconocidas). Un owner ve todo, por eso no manda unidades.
 */
function exigirUnidades(mensaje: string) {
  return (v: { role?: string; units?: string | string[] }, ctx: z.RefinementCtx) => {
    const rol = v.role ?? "member";
    const elegidas = parsearUnidades(([] as string[]).concat(v.units ?? []));
    if (rol !== "owner" && elegidas.length === 0) {
      ctx.addIssue({ code: "custom", path: ["units"], message: mensaje });
    }
  };
}

/**
 * Espejo de las reglas de `invitarMiembro` (equipo-acciones.ts), solo para
 * feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   email -> tras trim, formato nombre@dominio.ext ("Email inválido")
 *   role  -> "owner" o cualquier otro valor (el server lo trata como member)
 *   units -> si el rol no es owner, al menos una unidad válida
 */
export const invitarEsquema = z
  .object({
    email: z.string().trim().regex(EMAIL, "Email inválido"),
    role: z.string().optional(),
    units: unidades,
  })
  .superRefine(exigirUnidades("Elegí al menos una unidad para el miembro"));

/**
 * Espejo de las reglas de `cambiarAcceso` (equipo-acciones.ts).
 *
 *   user_id -> obligatorio ("Falta el usuario")
 *   units   -> si el rol no es owner, al menos una unidad válida
 *
 * "No podés quitarte a vos mismo el rol de owner" depende de la sesión: solo
 * lo sabe el server.
 */
export const accesoEsquema = z
  .object({
    user_id: z.string().min(1, "Falta el usuario"),
    role: z.string().optional(),
    units: unidades,
  })
  .superRefine(exigirUnidades("Elegí al menos una unidad"));
