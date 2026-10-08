"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { FinanceData, FinanceRow } from "@/lib/personal-finance";
import type { EntidadPago, EntidadSimple, TipoMovimiento } from "../tipos";
import { runMutation } from "./action-form";
import { EntityDialog } from "./entity-editor";
import { PaymentDialog } from "./payment-editor";
import { TransactionDialog } from "./transaction-editor";

interface EntityOptions {
  row?: FinanceRow;
  defaults?: Record<string, string>;
  title: string;
}

interface DialogsApi {
  openMovement: (type: TipoMovimiento, row?: FinanceRow) => void;
  openPayment: (row: FinanceRow, entity: EntidadPago) => void;
  openEntity: (entity: EntidadSimple, options: EntityOptions) => void;
  cancelMovement: (row: FinanceRow) => void;
}

type Request =
  | { kind: "movement"; type: TipoMovimiento; row?: FinanceRow }
  | { kind: "payment"; row: FinanceRow; entity: EntidadPago }
  | ({ kind: "entity"; entity: EntidadSimple } & EntityOptions)
  | { kind: "cancel"; row: FinanceRow; requestId: string };

const DialogsContext = createContext<DialogsApi | null>(null);

export function useFinanceDialogs(): DialogsApi {
  const api = useContext(DialogsContext);
  if (!api) throw new Error("useFinanceDialogs debe usarse dentro de FinanceDialogsProvider");
  return api;
}

/**
 * Monta una sola vez todos los editores y confirmaciones de la pantalla. Las
 * vistas solo piden abrirlos con `useFinanceDialogs()`, sin cargar con estado.
 * Cada apertura usa una `key` nueva para que los formularios arranquen limpios.
 */
export function FinanceDialogsProvider({ data, children }: { data: FinanceData; children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [nonce, setNonce] = useState(0);

  const api = useMemo<DialogsApi>(() => {
    const open = (next: Request) => {
      setNonce((n) => n + 1);
      setRequest(next);
    };
    return {
      openMovement: (type, row) => open({ kind: "movement", type, row }),
      openPayment: (row, entity) => open({ kind: "payment", row, entity }),
      openEntity: (entity, options) => open({ kind: "entity", entity, ...options }),
      // Un id por apertura: reintentar la misma anulación lo reutiliza; otro movimiento, no.
      cancelMovement: (row) => open({ kind: "cancel", row, requestId: crypto.randomUUID() }),
    };
  }, []);

  const close = () => setRequest(null);

  return (
    <DialogsContext.Provider value={api}>
      {children}

      {request?.kind === "movement" && (
        <TransactionDialog
          key={nonce}
          data={data}
          type={request.type}
          row={request.row}
          onClose={close}
        />
      )}
      {request?.kind === "payment" && (
        <PaymentDialog key={nonce} data={data} row={request.row} entity={request.entity} onClose={close} />
      )}
      {request?.kind === "entity" && (
        <EntityDialog
          key={nonce}
          entity={request.entity}
          data={data}
          row={request.row}
          defaults={request.defaults}
          title={request.title}
          onClose={close}
        />
      )}
      <ConfirmDialog
        isOpen={request?.kind === "cancel"}
        onOpenChange={(isOpen) => {
          if (!isOpen) close();
        }}
        title="¿Anular este movimiento?"
        description="El historial se conserva. Anular un movimiento revierte su efecto en el saldo."
        confirmLabel="Anular movimiento"
        pendingLabel="Anulando…"
        successMessage="Movimiento anulado"
        onConfirm={async () => {
          if (request?.kind !== "cancel") return;
          await runMutation(
            { entity: "movement", operation: "cancel", id: request.row.id },
            request.requestId,
          );
        }}
      />
    </DialogsContext.Provider>
  );
}
