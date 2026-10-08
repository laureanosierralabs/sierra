"use client";

import { EmptyState } from "@/components/common/empty-state";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { RegistrarPago } from "@/components/landing/registrar-pago";
import { Card } from "@/components/tailgrids/core/card";
import { borrarPago } from "@/app/landing-pages/acciones";
import { formatearMonto, type Cotizacion, type PagoCotizacion } from "@/lib/landing/tipos";

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
  if (pagos.length === 0) {
    return (
      <EmptyState
        title="Todavía no se cobró nada"
        action={<RegistrarPago cotizacion={cotizacion} resta={resta} />}
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <ul className="divide-y divide-card-border">
        {pagos.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-background-gray-secondary"
          >
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-medium text-badge-success-text tabular-nums">
                {formatearMonto(p.amount, cotizacion.currency)}
              </span>
              <span className="truncate text-xs text-text-tertiary">
                {p.paid_on}
                {p.method && ` · ${p.method}`}
                {p.notes && ` · ${p.notes}`}
              </span>
            </span>
            <span className="shrink-0">
              <BorrarBoton
                etiqueta="Borrar cobro"
                onConfirmar={() => borrarPago(p.id, cotizacion.id)}
              />
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-card-border px-4 py-3">
        <span className="text-xs text-text-tertiary">
          {resta > 0 ? (
            <>
              Quedan{" "}
              <span className="font-medium text-badge-warning-text tabular-nums">
                {formatearMonto(resta, cotizacion.currency)}
              </span>{" "}
              por cobrar
            </>
          ) : (
            <span className="text-badge-success-text">Cobrada por completo</span>
          )}
        </span>
        {resta > 0 && <RegistrarPago cotizacion={cotizacion} resta={resta} />}
      </div>
    </Card>
  );
}
