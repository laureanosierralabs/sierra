"use client";

import { EmptyState } from "@/components/common/empty-state";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { RegistrarPagoEquipo } from "@/components/landing/registrar-pago-equipo";
import { Card } from "@/components/tailgrids/core/card";
import { borrarPagoEquipo } from "@/app/landing-pages/acciones";
import { formatearMonto, type AcuerdoEquipo, type PagoEquipo } from "@/lib/landing/tipos";

/** Historial de pagos al equipo. Lo pagado sale de sumar estas filas. */
export function PagosEquipo({
  acuerdo,
  pagos,
  resta,
}: {
  acuerdo: AcuerdoEquipo;
  pagos: PagoEquipo[];
  resta: number;
}) {
  if (pagos.length === 0) {
    return (
      <EmptyState
        title="Todavía no se pagó nada"
        action={<RegistrarPagoEquipo acuerdo={acuerdo} resta={resta} />}
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
              <span className="text-sm font-medium text-text-primary tabular-nums">
                {formatearMonto(p.amount, acuerdo.currency)}
              </span>
              <span className="truncate text-xs text-text-tertiary">
                {p.paid_on}
                {p.method && ` · ${p.method}`}
                {p.notes && ` · ${p.notes}`}
              </span>
            </span>
            <span className="shrink-0">
              <BorrarBoton
                etiqueta="Borrar pago"
                onConfirmar={() => borrarPagoEquipo(p.id, acuerdo.id)}
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
                {formatearMonto(resta, acuerdo.currency)}
              </span>{" "}
              por pagar
            </>
          ) : (
            <span className="text-badge-success-text">Saldado</span>
          )}
        </span>
        {resta > 0 && <RegistrarPagoEquipo acuerdo={acuerdo} resta={resta} />}
      </div>
    </Card>
  );
}
