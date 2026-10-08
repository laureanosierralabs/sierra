"use client";

import { useState } from "react";
import { defaultPaymentAmount, isIncoming } from "@/lib/personal-finance-stats";
import { today, type FinanceData, type FinanceRow } from "@/lib/personal-finance";
import type { EntidadPago } from "../tipos";
import { ActionForm } from "./action-form";
import { FinanceDialog } from "./dialogo-finanzas";
import { CampoSelect, CampoTexto, Nota } from "./campos";
import { accountOptions } from "./transaction-editor";

interface PaymentDialogProps {
  data: FinanceData;
  row: FinanceRow;
  entity: EntidadPago;
  onClose: () => void;
}

/** Registra un pago o cobro contra una obligación o un cronograma (una sola transacción). */
export function PaymentDialog({ data, row, entity, onClose }: PaymentDialogProps) {
  const [date, setDate] = useState(today());
  const incoming = isIncoming(row);
  const amount = defaultPaymentAmount(row, entity, data);
  const currency = String(row.currency);

  return (
    <FinanceDialog
      isOpen
      onClose={onClose}
      title={incoming ? `Registrar cobro · ${row.name}` : `Registrar pago · ${row.name}`}
      description="El movimiento se registra una sola vez y actualiza el saldo pendiente."
    >
      <ActionForm
        entity={entity}
        operation="pay"
        linkedId={row.id}
        submitLabel="Registrar pago / cobro"
        onSuccess={onClose}
        onCancel={onClose}
      >
        <input type="hidden" name="moneda" value={currency} />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            name="monto"
            label={`Monto (${currency})`}
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={String(amount ?? "")}
          />
          <CampoSelect
            name="account_id"
            label="Cuenta"
            options={accountOptions(data, currency, row.account_id)}
            defaultValue={String(row.account_id ?? "")}
            placeholder="Seleccionar cuenta"
            required
          />
          <CampoTexto
            name="fecha"
            label="Fecha efectiva"
            type="date"
            required
            value={date}
            onChange={setDate}
          />
          {currency === "ARS" && (
            <CampoTexto
              key={date}
              name="exchange_rate"
              label="Cotización ARS por USD"
              type="number"
              step="0.0001"
              min="0.0001"
              required={date !== today() || !data.rate?.rate}
              placeholder={
                date === today() && data.rate?.rate
                  ? `Actual: ${data.rate.rate}`
                  : "Cotización de esa fecha"
              }
              description={
                date !== today()
                  ? "Obligatoria para pagos de otra fecha."
                  : data.rate?.rate
                    ? "Vacío: se usa la referencia actual."
                    : "No hay referencia actual; ingresá una manual."
              }
            />
          )}
        </div>
        <Nota>
          Se registra un único movimiento y se actualiza el saldo pendiente dentro de la misma
          transacción.
        </Nota>
      </ActionForm>
    </FinanceDialog>
  );
}
