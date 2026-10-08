import { z } from "zod";
import { fechaOpcional } from "@/components/landing/esquema-comun";
import { urlOpcional } from "@/components/landing/url-esquema";

/**
 * Espejo de `guardarNotaCliente` (app/landing-pages/acciones.ts), solo para
 * feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   client_id    -> obligatorio ("Falta el cliente")
 *   title        -> obligatorio, tras trim ("Falta el título")
 *   url          -> vacío, o URL http(s) válida
 *   meeting_date -> vacío o AAAA-MM-DD
 *   body         -> libre
 */
export const notaEsquema = z.object({
  id: z.string().optional(),
  client_id: z.string().trim().min(1, "Falta el cliente"),
  title: z.string().trim().min(1, "Falta el título"),
  url: urlOpcional,
  meeting_date: fechaOpcional,
  body: z.string().optional(),
});
