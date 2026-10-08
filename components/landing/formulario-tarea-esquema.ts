import { z } from "zod";
import type { Campo, ValorCampo } from "@/lib/landing/plantillas";

/**
 * Espejo de las reglas de `guardarCampoTarea` (app/landing-pages/acciones.ts),
 * solo para feedback inmediato; el server sigue validando.
 *
 *   - el valor es texto, lista de textos o null
 *   - en campos "opciones" y "checklist", cada valor debe estar entre las
 *     opciones declaradas (los sub-items del checklist anidado también valen)
 *     -> "Opción inválida"
 */
function opcionesPermitidas(campo: Campo): string[] {
  if (campo.tipo !== "opciones" && campo.tipo !== "checklist") return [];
  return campo.items
    ? campo.items.flatMap((i) => [i.texto, ...(i.hijos ?? [])])
    : (campo.opciones ?? []);
}

/** Devuelve el mensaje de error, o null si el valor es válido. */
export function errorDeValorCampo(campo: Campo, valor: ValorCampo): string | null {
  const permitidas = opcionesPermitidas(campo);

  const esquema = z
    .union([z.string(), z.array(z.string()), z.null()])
    .refine((v) => {
      if (permitidas.length === 0) return true;
      const valores = Array.isArray(v) ? v : v ? [v] : [];
      return valores.every((x) => permitidas.includes(x));
    }, "Opción inválida");

  const resultado = esquema.safeParse(valor);
  return resultado.success ? null : (resultado.error.issues[0]?.message ?? "Valor inválido");
}
