import { z } from "zod";
import { urlOpcional } from "@/components/landing/url-esquema";
import { TIPOS_RECURSO } from "@/lib/landing/tipos";

/**
 * Espejo de las reglas de `guardarRecurso` y `guardarRecursoCliente`
 * (app/landing-pages/acciones.ts), solo para feedback inmediato. El server
 * sigue siendo la fuente de verdad.
 *
 *   name -> obligatorio, tras trim ("Falta el nombre del recurso")
 *   kind -> uno de TIPOS_RECURSO ("Tipo inválido")
 *   url  -> vacío, o URL http(s) válida
 *   username, secret, notes -> libres
 */
export const recursoEsquema = z.object({
  name: z.string().trim().min(1, "Falta el nombre del recurso"),
  kind: z.enum(TIPOS_RECURSO, { error: "Tipo inválido" }),
  url: urlOpcional,
});
