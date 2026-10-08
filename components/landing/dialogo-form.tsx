"use client";

import { useCallback, useState } from "react";
import { Plus } from "@tailgrids/icons";
import { FormError } from "@/components/common/form/form-error";
import { useZodForm } from "@/components/common/form/use-zod-form";
import { Button } from "@/components/tailgrids/core/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import { Input as TgInput } from "@/components/tailgrids/core/input";
import { Backdrop, OverlayWrapper } from "@/components/tailgrids/core/overlay";
import { TextArea } from "@/components/tailgrids/core/text-area";

/* Mismo aspecto que el `Input` del template, para el <select> nativo. Se usa
   nativo (y no el Select de React Aria) porque los formularios pasan <option>
   como children y algunos leen `e.target.value` en onChange. */
const SELECT_NATIVO =
  "w-full rounded-lg border border-card-border bg-input-background px-4 py-2.5 text-title-50 outline-none duration-300 focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20 disabled:cursor-not-allowed disabled:border-base-100 disabled:text-input-disabled-text";

export function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-input-label-text">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <TgInput {...props} className="w-full" />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={SELECT_NATIVO} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <TextArea {...props} className="w-full" />;
}

/**
 * Modal con formulario. `action` es una Server Action; el diálogo se cierra
 * solo cuando la transición termina sin error, para no ocultar un fallo.
 * Los errores se muestran en el diálogo (Alert) y como toast.
 */
export function DialogoForm({
  titulo,
  etiquetaAbrir,
  action,
  children,
  disparador,
  abiertoExterno,
  onCerrar,
}: {
  titulo: string;
  etiquetaAbrir?: string;
  action: (fd: FormData) => Promise<void>;
  children: React.ReactNode;
  disparador?: React.ReactNode;
  /** Modo controlado: el diálogo se abre desde afuera y no renderiza botón. */
  abiertoExterno?: boolean;
  onCerrar?: () => void;
}) {
  const controlado = abiertoExterno !== undefined;
  const [abiertoInterno, setAbiertoInterno] = useState(false);
  const abierto = controlado ? abiertoExterno : abiertoInterno;

  const cerrar = useCallback(() => {
    if (controlado) onCerrar?.();
    else setAbiertoInterno(false);
  }, [controlado, onCerrar]);

  const form = useZodForm({ action, onSuccess: cerrar });

  function cambiarApertura(v: boolean) {
    if (v) {
      form.reset();
      if (!controlado) setAbiertoInterno(true);
    } else {
      if (form.pending) return;
      form.reset();
      cerrar();
    }
  }

  return (
    <>
      {!controlado &&
        (disparador ? (
          <button
            type="button"
            onClick={() => cambiarApertura(true)}
            aria-label={etiquetaAbrir ?? titulo}
            className="rounded text-text-tertiary transition-colors outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {disparador}
          </button>
        ) : (
          <Button appearance="outline" onPress={() => cambiarApertura(true)}>
            <Plus />
            {etiquetaAbrir}
          </Button>
        ))}

      <OverlayWrapper isOpen={abierto} onOpenChange={cambiarApertura}>
        {/* z por encima del Sheet (z-9999): también se abre desde el panel lateral. */}
        <Backdrop
          className="z-10000"
          isDismissable={!form.pending}
          isKeyboardDismissDisabled={form.pending}
        >
          <Dialog className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto p-0">
            <DialogHeader className="border-b border-card-border py-4 pr-14 pl-5">
              <DialogTitle>{titulo}</DialogTitle>
            </DialogHeader>

            <form onSubmit={form.onSubmit} className="flex flex-col gap-4 p-5">
              {children}

              <FormError message={form.formError} />

              <DialogFooter className="pt-1">
                <DialogClose appearance="outline" isDisabled={form.pending}>
                  Cancelar
                </DialogClose>
                <Button type="submit" isDisabled={form.pending}>
                  {form.pending ? "Guardando…" : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Dialog>
        </Backdrop>
      </OverlayWrapper>
    </>
  );
}
