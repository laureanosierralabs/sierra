import type { ZodIssue } from "zod";

export type FieldErrors = Record<string, string>;

/** Clave reservada para issues sin campo (refinements a nivel de objeto). */
export const FORM_ERROR_KEY = "_form";

type FormValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>;

/**
 * Convierte `FormData` en un objeto plano para pasarlo a Zod. Las claves
 * repetidas (checkbox múltiple) quedan como array; el resto, como valor
 * simple. Todo llega como string: la coerción es responsabilidad del schema
 * (`z.coerce.number()`, `z.string().min(1, ...)`).
 */
export function formDataToObject(formData: FormData): FormValues {
  const values: FormValues = {};
  for (const key of new Set(formData.keys())) {
    // Next inyecta campos `$ACTION_*` en forms con progressive enhancement.
    if (key.startsWith("$ACTION")) continue;
    const all = formData.getAll(key);
    values[key] = all.length > 1 ? all : all[0];
  }
  return values;
}

/** Primer mensaje por campo; el `path` anidado se une con puntos (`items.0.name`). */
export function issuesToFieldErrors(issues: readonly ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : FORM_ERROR_KEY;
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}
