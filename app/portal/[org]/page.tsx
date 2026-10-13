import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { EstadoPagoPill } from "@/components/landing/ui";
import { Card } from "@/components/tailgrids/core/card";
import {
  codigoCotizacion,
  fechaCorta,
  fechaCotizacion,
  formatearMonto,
} from "@/lib/landing/tipos";
import { contextoPortal } from "@/lib/portal/contexto";
import { cotizacionesCompartidas } from "@/lib/portal/datos";

export const dynamic = "force-dynamic";

/**
 * Inicio del portal de un cliente. Fase 1: identidad y cotizaciones
 * compartidas. Lanzamientos, métricas y solicitudes llegan en las fases
 * siguientes, sobre este mismo contexto.
 */
export default async function PortalCliente({ params }: { params: Promise<{ org: string }> }) {
  const ctx = await contextoPortal((await params).org);
  // Inexistente o ajeno: el mismo 404, sin revelar cuál de los dos es.
  if (!ctx) notFound();

  const cotizaciones = await cotizacionesCompartidas(ctx);

  return (
    <>
      {ctx.vistaInterna && (
        <p className="mb-4 rounded-lg bg-badge-warning-background px-3 py-2 text-xs text-badge-warning-text">
          Vista interna: estás viendo el portal como lo ve el cliente.
        </p>
      )}

      <h1 className="mb-6 text-xl font-semibold text-text-primary">{ctx.clienteNombre}</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">Cotizaciones</h2>
        {cotizaciones.length === 0 ? (
          <EmptyState title="Todavía no hay cotizaciones compartidas" />
        ) : (
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-card-border">
              {cotizaciones.map((q) => (
                <li key={q.numero}>
                  <Link
                    href={`/q/${q.public_token}`}
                    target="_blank"
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-background-gray-secondary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {q.title}
                      </span>
                      <span className="text-xs tabular-nums text-text-tertiary">
                        {codigoCotizacion(q.numero)} · {fechaCorta(fechaCotizacion(q))}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-medium tabular-nums text-text-primary">
                        {formatearMonto(q.total_amount, q.currency)}
                      </span>
                      <EstadoPagoPill estado={q.payment_status} />
                      <ExpandArrowTopRightSquare1 className="size-4 text-text-tertiary" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </>
  );
}
