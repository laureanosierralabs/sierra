import { z } from "zod";

export const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Espejo de `fecha()` en app/landing-pages/acciones.ts: vacío o AAAA-MM-DD. */
export const fechaOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || FECHA.test(v), "Fecha inválida");

/**
 * Espejo de la conversión de `monto()` en acciones.ts: quita espacios, cambia la
 * coma por punto y exige un número finito y no negativo. `null` = vacío.
 * Devuelve `undefined` si el texto no es un monto válido.
 */
export function parsearMonto(valor: string): number | null | undefined {
  const v = valor.trim();
  if (v === "") return null;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Vacío, o un monto válido según `parsearMonto`. */
export const montoOpcional = z
  .string()
  .refine((v) => parsearMonto(v) !== undefined, "Monto inválido");
