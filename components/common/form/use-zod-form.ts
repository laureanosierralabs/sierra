"use client";

import { useCallback, useState, useTransition, type FormEvent } from "react";
import { unstable_rethrow } from "next/navigation";
import { toast } from "sonner";
import type { ZodType } from "zod";
import {
  FORM_ERROR_KEY,
  formDataToObject,
  issuesToFieldErrors,
  type FieldErrors,
} from "./form-utils";

interface UseZodFormOptions {
  /**
   * Validación del lado cliente, solo para dar feedback inmediato. La
   * validación de verdad sigue en la server action: nunca se omite allá.
   */
  schema?: ZodType;
  /** La server action existente. Puede lanzar `Error`: el mensaje se muestra. */
  action: (formData: FormData) => Promise<unknown>;
  /** Toast de éxito. `null` lo desactiva (por ejemplo si la action redirige). */
  successMessage?: string | null;
  /** Mensaje cuando lo lanzado no es un `Error` con texto. */
  fallbackError?: string;
  onSuccess?: () => void;
}

/**
 * Valida (opcional) y envía un formulario a una server action existente.
 *
 * - `form.onSubmit`: para `<form onSubmit>`. Conserva lo tipeado si hay error.
 * - `form.submit`: para `<form action={form.submit}>`. React resetea los
 *   campos no controlados al terminar la action, también cuando falla.
 */
export function useZodForm({
  schema,
  action,
  successMessage = "Guardado",
  fallbackError = "No se pudo guardar",
  onSuccess,
}: UseZodFormOptions) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setErrors({});
    setFormError(null);
  }, []);

  const submit = useCallback(
    (formData: FormData) => {
      setFormError(null);

      if (schema) {
        const result = schema.safeParse(formDataToObject(formData));
        if (!result.success) {
          const { [FORM_ERROR_KEY]: general, ...fields } = issuesToFieldErrors(result.error.issues);
          setErrors(fields);
          if (general) setFormError(general);
          return;
        }
      }
      setErrors({});

      startTransition(async () => {
        try {
          await action(formData);
          if (successMessage) toast.success(successMessage);
          onSuccess?.();
        } catch (e) {
          unstable_rethrow(e);
          const message = e instanceof Error && e.message ? e.message : fallbackError;
          setFormError(message);
          toast.error(message);
        }
      });
    },
    [schema, action, successMessage, fallbackError, onSuccess],
  );

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit(new FormData(event.currentTarget));
    },
    [submit],
  );

  /** Props comunes de los campos `Form*`: nombre, error y limpieza al editar. */
  const fieldProps = useCallback(
    (name: string) => ({
      name,
      error: errors[name],
      onChange: () => clearError(name),
    }),
    [errors, clearError],
  );

  return { submit, onSubmit, errors, formError, pending, clearError, reset, fieldProps };
}
