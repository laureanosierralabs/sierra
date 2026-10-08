"use client";

import { FormTextAreaField, FormTextField } from "@/components/common/form/form-fields";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { pagoEsquema } from "@/components/landing/pago-esquema";
import { registrarPago } from "@/app/landing-pages/acciones";
import { formatearMonto, type Cotizacion } from "@/lib/landing/tipos";

/** Alta de un cobro. Sugiere el saldo: lo más común es cobrar lo que falta. */
export function RegistrarPago({ cotizacion, resta }: { cotizacion: Cotizacion; resta: number }) {
  return (
    <DialogoForm
      titulo="Registrar cobro"
      etiquetaAbrir="Registrar cobro"
      action={registrarPago}
      schema={pagoEsquema}
    >
      {(form) => (
        <>
          <input type="hidden" name="quote_id" value={cotizacion.id} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("amount")}
              label="Monto cobrado"
              required
              defaultValue={resta > 0 ? String(resta) : ""}
            />

            {/* Define en qué mes impacta en el balance: si el cobro fue en
                agosto, dejarlo en hoy lo manda al mes equivocado. */}
            <FormTextField
              {...form.fieldProps("paid_on")}
              type="date"
              label="Fecha del cobro"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <p className="-mt-2 text-xs text-text-tertiary">
            La fecha define en qué mes suma en el balance. Si la plata entró antes, cambiala.
          </p>

          <FormTextField
            {...form.fieldProps("method")}
            label="Medio de pago"
            placeholder="Transferencia, USDT, efectivo…"
          />

          <FormTextAreaField {...form.fieldProps("notes")} label="Notas" rows={2} />

          <p className="text-xs text-text-tertiary">
            {resta > 0
              ? `Quedan ${formatearMonto(resta, cotizacion.currency)} por cobrar.`
              : "Esta cotización ya está cobrada por completo."}
          </p>
        </>
      )}
    </DialogoForm>
  );
}
