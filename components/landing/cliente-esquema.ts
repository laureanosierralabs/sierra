import { z } from "zod";
import { SIN_OPCION } from "@/components/landing/proyecto-esquema";
import { urlOpcional } from "@/components/landing/url-esquema";
import { ESTADOS_CLIENTE, ORIGENES } from "@/lib/landing/tipos";

/**
 * Espejo de las reglas de `guardarCliente` (app/landing-pages/acciones.ts), solo
 * para feedback inmediato. El server sigue siendo la fuente de verdad.
 *
 *   name     -> obligatorio, tras trim ("Falta el nombre del cliente")
 *   status   -> uno de ESTADOS_CLIENTE ("Estado inválido")
 *   source   -> vacío (o "ninguno" del Select), o uno de ORIGENES
 *   website, drive_url -> vacío, o URL http(s) válida
 *   email    -> el server no lo valida; se conserva el chequeo laxo que antes
 *               hacía el navegador con type="email"
 *   resto    -> libre
 */
export const clienteEsquema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Falta el nombre del cliente"),
  company: z.string().optional(),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+$/.test(v), "Email inválido")
    .optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  status: z.enum(ESTADOS_CLIENTE, { error: "Estado inválido" }),
  source: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || v === SIN_OPCION || (ORIGENES as readonly string[]).includes(v),
      "Origen inválido",
    ),
  source_detail: z.string().optional(),
  niche: z.string().optional(),
  website: urlOpcional,
  drive_url: urlOpcional,
  notes: z.string().optional(),
});
