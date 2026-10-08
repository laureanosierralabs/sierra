import Link from "next/link";
import { FileTextMultiple } from "@tailgrids/icons";
import { EstadoCotizacionPill, SeccionTitulo } from "@/components/landing/ui";
import { Card } from "@/components/tailgrids/core/card";
import {
  codigoCotizacion,
  formatearMonto,
  pendienteDeCobro,
  type Cotizacion,
} from "@/lib/landing/tipos";

/** Cotizaciones y acuerdos del proyecto. Solo se renderiza para el owner. */
export function ProyectoCotizaciones({ cotizaciones }: { cotizaciones: Cotizacion[] }) {
  return (
    <section>
      <SeccionTitulo icono={FileTextMultiple}>Cotizaciones y acuerdos</SeccionTitulo>
      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-card-border">
          {cotizaciones.map((q) => {
            const pendiente = pendienteDeCobro(q);
            return (
              <li key={q.id}>
                <Link
                  href={`/landing-pages/quotes/${q.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors outline-none hover:bg-background-gray-secondary focus-visible:bg-background-gray-secondary"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {q.title}
                    </span>
                    <span className="text-xs tabular-nums text-text-tertiary">
                      {codigoCotizacion(q.numero)}
                      {q.payment_terms && ` · ${q.payment_terms}`}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {pendiente > 0 && (
                      <span className="text-xs tabular-nums text-badge-warning-text">
                        resta {formatearMonto(pendiente, q.currency)}
                      </span>
                    )}
                    <span className="text-sm font-medium tabular-nums text-text-primary">
                      {formatearMonto(q.total_amount, q.currency)}
                    </span>
                    <EstadoCotizacionPill estado={q.commercial_status} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
