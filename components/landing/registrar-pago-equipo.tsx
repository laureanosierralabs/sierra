"use client";

import { FormTextAreaField, FormTextField } from "@/components/common/form/form-fields";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { pagoEquipoEsquema } from "@/components/landing/pago-equipo-esquema";
import { registrarPagoEquipo } from "@/app/landing-pages/acciones";
import { formatearMonto, type AcuerdoEquipo } from "@/lib/landing/tipos";

/** Alta de un pago al equipo. Sugiere el saldo: lo más común es pagar lo que falta. */
export function RegistrarPagoEquipo({
  acuerdo,
  resta,
}: {
  acuerdo: AcuerdoEquipo;
  resta: number;
}) {
  return (
    <DialogoForm
      titulo="Registrar pago"
      etiquetaAbrir="Registrar pago"
      action={registrarPagoEquipo}
      schema={pagoEquipoEsquema}
    >
      {(form) => (
        <>
          <input type="hidden" name="agreement_id" value={acuerdo.id} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("amount")}
              label="Monto pagado"
              required
              defaultValue={resta > 0 ? String(resta) : ""}
            />

            {/* Define en qué mes impacta en el balance: dejarlo en hoy cuando
                el pago fue antes lo manda al mes equivocado. */}
            <FormTextField
              {...form.fieldProps("paid_on")}
              type="date"
              label="Fecha del pago"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <p className="-mt-2 text-xs text-text-tertiary">
            La fecha define en qué mes resta en el balance. Si pagaste antes, cambiala.
          </p>

          <FormTextField
            {...form.fieldProps("method")}
            label="Medio de pago"
            placeholder="Transferencia, USDT, efectivo…"
          />

          <FormTextAreaField {...form.fieldProps("notes")} label="Notas" rows={2} />

          <p className="text-xs text-text-tertiary">
            {resta > 0
              ? `Quedan ${formatearMonto(resta, acuerdo.currency)} por pagar.`
              : "Este acuerdo ya está saldado."}
          </p>
        </>
      )}
    </DialogoForm>
  );
}
