"use client";

import { Trash2 } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Textarea,
} from "@/components/landing/dialogo-form";
import {
  registrarPagoEquipo,
  borrarPagoEquipo,
} from "@/app/landing-pages/acciones";
import {
  formatearMonto,
  type AcuerdoEquipo,
  type PagoEquipo,
} from "@/lib/landing/tipos";

function RegistrarPago({
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
    >
      <input type="hidden" name="agreement_id" value={acuerdo.id} />

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Monto pagado">
          <Input
            name="amount"
            inputMode="decimal"
            required
            defaultValue={resta > 0 ? String(resta) : ""}
          />
        </Campo>

        {/* Define en qué mes impacta en el balance: dejarlo en hoy cuando
            el pago fue antes lo manda al mes equivocado. */}
        <Campo label="Fecha del pago">
          <Input
            type="date"
            name="paid_on"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </Campo>
      </div>

      <p className="-mt-2 text-xs text-text-3">
        La fecha define en qué mes resta en el balance. Si pagaste antes,
        cambiala.
      </p>

      <Campo label="Medio de pago">
        <Input name="method" placeholder="Transferencia, USDT, efectivo…" />
      </Campo>

      <Campo label="Notas">
        <Textarea name="notes" rows={2} />
      </Campo>

      <p className="text-xs text-text-3">
        {resta > 0
          ? `Quedan ${formatearMonto(resta, acuerdo.currency)} por pagar.`
          : "Este acuerdo ya está saldado."}
      </p>
    </DialogoForm>
  );
}

export function PagosEquipo({
  acuerdo,
  pagos,
  resta,
}: {
  acuerdo: AcuerdoEquipo;
  pagos: PagoEquipo[];
  resta: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
      {pagos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8">
          <p className="text-sm text-text-3">Todavía no se pagó nada.</p>
          <RegistrarPago acuerdo={acuerdo} resta={resta} />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {pagos.map((p) => (
              <li
                key={p.id}
                className="fila-hover group/pago flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="tnum text-sm font-medium">
                    {formatearMonto(p.amount, acuerdo.currency)}
                  </span>
                  <span className="truncate text-xs text-text-3">
                    {p.paid_on}
                    {p.method && ` · ${p.method}`}
                    {p.notes && ` · ${p.notes}`}
                  </span>
                </span>
                <span className="shrink-0 opacity-0 transition-opacity group-hover/pago:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    aria-label="Borrar pago"
                    onClick={() => {
                      if (!confirm("¿Borrar este pago?")) return;
                      void borrarPagoEquipo(p.id, acuerdo.id);
                    }}
                    className="text-text-3 transition-colors hover:text-critical"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <span className="text-xs text-text-3">
              {resta > 0 ? (
                <>
                  Quedan{" "}
                  <span className="tnum font-medium text-warn">
                    {formatearMonto(resta, acuerdo.currency)}
                  </span>{" "}
                  por pagar
                </>
              ) : (
                <span className="text-ok">Saldado</span>
              )}
            </span>
            {resta > 0 && <RegistrarPago acuerdo={acuerdo} resta={resta} />}
          </div>
        </>
      )}
    </div>
  );
}
