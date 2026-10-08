"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import { Backdrop, OverlayWrapper } from "@/components/tailgrids/core/overlay";

/** Los formularios avisan al diálogo cuando están guardando, para bloquear el cierre. */
const BusyContext = createContext<((busy: boolean) => void) | null>(null);
export const useDialogBusy = () => useContext(BusyContext);

interface FinanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Modal de los editores de finanzas (React Aria: portal, focus trap, Escape).
 * Si el usuario tocó algún campo, cerrar pide confirmación; mientras se guarda no se puede cerrar.
 */
export function FinanceDialog({ isOpen, onClose, title, description, children }: FinanceDialogProps) {
  const [busy, setBusy] = useState(false);
  const dirty = useRef(false);

  const requestClose = useCallback(() => {
    if (busy) return;
    if (dirty.current && !window.confirm("¿Cerrar sin guardar los cambios?")) return;
    dirty.current = false;
    onClose();
  }, [busy, onClose]);

  return (
    <OverlayWrapper
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (!next) requestClose();
      }}
    >
      {/* z por encima del Sheet de ajustes (z-9999): los editores también se abren desde ahí. */}
      <Backdrop className="z-10000" isDismissable={!busy} isKeyboardDismissDisabled={busy}>
        <Dialog className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-card-border py-4 pr-14 pl-5">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div
            className="p-5"
            onInput={() => {
              dirty.current = true;
            }}
          >
            <BusyContext.Provider value={setBusy}>{children}</BusyContext.Provider>
          </div>
        </Dialog>
      </Backdrop>
    </OverlayWrapper>
  );
}
