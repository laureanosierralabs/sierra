"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { InfoTriangle } from "@tailgrids/icons";
import { toast } from "sonner";
import { Button } from "@/components/tailgrids/core/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import { Backdrop, OverlayWrapper } from "@/components/tailgrids/core/overlay";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  /** `danger` para borrados; `primary` para confirmaciones neutras. */
  tone?: "danger" | "primary";
  /** Si lanza, el mensaje se muestra en el diálogo y en un toast; si no, el diálogo se cierra. */
  onConfirm: () => Promise<unknown> | void;
  /** Toast al terminar bien. */
  successMessage?: string;
  fallbackError?: string;
}

/**
 * Confirmación modal (React Aria: portal, focus trap, Escape). El foco arranca
 * en Cancelar, así que un Enter por reflejo no ejecuta nada destructivo.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  pendingLabel,
  cancelLabel = "Cancelar",
  tone = "danger",
  onConfirm,
  successMessage,
  fallbackError = "No se pudo completar la acción",
}: ConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (pending) return;
    // Controlled opens never emit `true`, so clear on close to avoid a stale error on reopen.
    if (!next) setError(null);
    onOpenChange(next);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await onConfirm();
        if (successMessage) toast.success(successMessage);
        onOpenChange(false);
      } catch (e) {
        unstable_rethrow(e);
        const message = e instanceof Error && e.message ? e.message : fallbackError;
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <OverlayWrapper isOpen={isOpen} onOpenChange={handleOpenChange}>
      {/* z por encima del Sheet (z-9999): se abre también desde el panel lateral. */}
      <Backdrop className="z-10000" isDismissable={!pending}>
        <Dialog
          role="alertdialog"
          showCloseButton={false}
          className="max-w-md p-0"
        >
          <DialogHeader className="flex-row items-start gap-3 p-5 pb-0">
            {tone === "danger" && (
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-badge-error-background text-badge-error-icon-color [&>svg]:size-5"
              >
                <InfoTriangle />
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1.5">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-text-secondary">{description}</DialogDescription>
              )}
            </div>
          </DialogHeader>

          {error && (
            <DialogBody className="pb-0">
              <p role="alert" className="text-sm text-input-error">
                {error}
              </p>
            </DialogBody>
          )}

          <DialogFooter className="px-5 pt-5 pb-5">
            <DialogClose appearance="outline" isDisabled={pending} autoFocus>
              {cancelLabel}
            </DialogClose>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              isDisabled={pending}
              onPress={handleConfirm}
            >
              {pending ? (pendingLabel ?? `${confirmLabel}…`) : confirmLabel}
            </Button>
          </DialogFooter>
        </Dialog>
      </Backdrop>
    </OverlayWrapper>
  );
}
