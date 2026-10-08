"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import { toast } from "sonner";
import { mutateFinance } from "@/app/finanzas/personal/actions";
import { FormError } from "@/components/common/form/form-error";
import { Button } from "@/components/tailgrids/core/button";
import type { Entity, FinanceRow } from "@/lib/personal-finance";
import { useDialogBusy } from "./dialogo-finanzas";

const ERROR_GENERICO = "No se pudo guardar. Podés volver a intentar.";
const ERROR_CONFIRMACION =
  "No se pudo confirmar el guardado. Volvé a intentar sin cerrar este formulario.";

/**
 * Token de idempotencia (`request_id`): se reutiliza al reintentar un envío
 * fallido y se descarta recién cuando el servidor confirma.
 */
export function useRequestToken() {
  const token = useRef<string | null>(null);
  return {
    next() {
      token.current ??= crypto.randomUUID();
      return token.current;
    },
    clear() {
      token.current = null;
    },
  };
}

/**
 * Ejecuta `mutateFinance` con los campos fijos de una operación sin formulario
 * (anular, eliminar). Lanza con el mensaje del servidor si falla.
 */
export async function runMutation(fields: Record<string, string>, requestId: string) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  fd.set("confirmed", "yes");
  fd.set("request_id", requestId);
  const result = await mutateFinance(fd);
  if (!result.ok) throw new Error(result.error ?? ERROR_GENERICO);
}

interface ActionFormProps {
  children: ReactNode;
  entity: Entity;
  operation?: "save" | "pay";
  row?: FinanceRow;
  linkedId?: string;
  submitLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  successMessage?: string;
}

/**
 * Formulario de escritura de finanzas. Conserva el contrato de FormData de
 * `mutateFinance`: campos ocultos `entity`, `operation`, `id`, `linked_id`,
 * más `confirmed=yes` y `request_id` que se agregan al enviar.
 */
export function ActionForm({
  children,
  entity,
  operation = "save",
  row,
  linkedId,
  submitLabel,
  onSuccess,
  onCancel,
  successMessage = "Guardado",
}: ActionFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const token = useRequestToken();
  const setDialogBusy = useDialogBusy();

  useEffect(() => {
    setDialogBusy?.(pending);
    return () => setDialogBusy?.(false);
  }, [pending, setDialogBusy]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fd = new FormData(event.currentTarget);
    fd.set("confirmed", "yes");
    fd.set("request_id", token.next());
    start(async () => {
      setError(null);
      try {
        const result = await mutateFinance(fd);
        if (!result.ok) {
          const message = result.error ?? ERROR_GENERICO;
          setError(message);
          toast.error(message);
          return;
        }
        token.clear();
        toast.success(successMessage);
        onSuccess?.();
      } catch (e) {
        unstable_rethrow(e);
        setError(ERROR_CONFIRMACION);
        toast.error(ERROR_CONFIRMACION);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={pending}>
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="operation" value={operation} />
      {row && <input type="hidden" name="id" value={row.id} />}
      {linkedId && <input type="hidden" name="linked_id" value={linkedId} />}
      {children}
      <FormError message={error} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button appearance="outline" isDisabled={pending} onPress={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isDisabled={pending}>
          {pending
            ? "Guardando…"
            : (submitLabel ?? (operation === "pay" ? "Registrar pago / cobro" : "Guardar"))}
        </Button>
      </div>
    </form>
  );
}
