"use client";

import { Trash2 } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Textarea,
} from "@/components/landing/dialogo-form";
import { registrarPago, borrarPago } from "@/app/landing-pages/acciones";
import {
  formatearMonto,
  type Cotizacion,
  type PagoCotizacion,
} from "@/lib/landing/tipos";

function RegistrarPago({
  cotizacion,
  resta,
}: {
  cotizacion: Cotizacion;
  resta: number;
}) {
  return (
    <DialogoForm
      titulo="Registrar cobro"
      etiquetaAbrir="Registrar cobro"
      action={registrarPago}
    >
      <input type="hidden" name="quote_id" value={cotizacion.id} />

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Monto cobrado">
          <Input
            name="amount"
            inputMode="decimal"
            required
            // Sugiere lo que falta: lo más común es cobrar el saldo entero.
            defaultValue={resta > 0 ? String(resta) : ""}
          />
        </Campo>

        <Campo label="Fecha">
          <Input
            type="date"
            name="paid_on"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </Campo>
      </div>

      <Campo label="Medio de pago">
        <Input name="method" placeholder="Transferencia, USDT, efectivo…" />
      </Campo>

      <Campo label="Notas">
        <Textarea name="notes" rows={2} />
      </Campo>

      <p className="text-xs text-text-3">
        {resta > 0
          ? `Quedan ${formatearMonto(resta, cotizacion.currency)} por cobrar.`
          : "Esta cotización ya está cobrada por completo."}
      </p>
    </DialogoForm>
  );
}

function BorrarPago({ id, quoteId }: { id: string; quoteId: string }) {
  return (
    <button
      type="button"
      aria-label="Borrar cobro"
      onClick={() => {
        if (!confirm("¿Borrar este cobro?")) return;
        void borrarPago(id, quoteId);
      }}
      className="text-text-3 transition-colors hover:text-critical"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

/**
 * Historial de cobros. El total pagado sale de sumar estas filas, no de un
 * campo que haya que actualizar a mano en cada pago.
 */
export function Cobros({
  cotizacion,
  pagos,
  resta,
}: {
  cotizacion: Cotizacion;
  pagos: PagoCotizacion[];
  resta: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
      {pagos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8">
          <p className="text-sm text-text-3">Todavía no se cobró nada.</p>
          <RegistrarPago cotizacion={cotizacion} resta={resta} />
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
                  <span className="tnum text-sm font-medium text-ok">
                    {formatearMonto(p.amount, cotizacion.currency)}
                  </span>
                  <span className="truncate text-xs text-text-3">
                    {p.paid_on}
                    {p.method && ` · ${p.method}`}
                    {p.notes && ` · ${p.notes}`}
                  </span>
                </span>
                <span className="shrink-0 opacity-0 transition-opacity group-hover/pago:opacity-100 focus-within:opacity-100">
                  <BorrarPago id={p.id} quoteId={cotizacion.id} />
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
                    {formatearMonto(resta, cotizacion.currency)}
                  </span>{" "}
                  por cobrar
                </>
              ) : (
                <span className="text-ok">Cobrada por completo</span>
              )}
            </span>
            {resta > 0 && (
              <RegistrarPago cotizacion={cotizacion} resta={resta} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
