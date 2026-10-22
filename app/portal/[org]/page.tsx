import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { EstadoPagoPill } from "@/components/landing/ui";
import { HeroPortal, SeccionPortal, TarjetaLanzamiento } from "@/components/portal/portal-ui";
import { Card } from "@/components/tailgrids/core/card";
import { codigoCotizacion, fechaCorta, fechaCotizacion, formatearMonto } from "@/lib/landing/tipos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";
import { contextoPortal } from "@/lib/portal/contexto";
import { cotizacionesCompartidas, lanzamientosPortal, portadaCliente } from "@/lib/portal/datos";
import { pedidosDeCliente } from "@/lib/pedidos/datos";
import { estaCerrado } from "@/lib/pedidos/tipos";

export const dynamic = "force-dynamic";

/**
 * Inicio del portal de un cliente: su portada, sus lanzamientos como
 * tarjetas, los pedidos y las cotizaciones. Todo se lee con el contexto del
 * cliente.
 */
export default async function PortalCliente({ params }: { params: Promise<{ org: string }> }) {
  const ctx = await contextoPortal((await params).org);
  // Inexistente o ajeno: el mismo 404, sin revelar cuál de los dos es.
  if (!ctx) notFound();

  const [lanzamientos, cotizaciones, pedidos, portada] = await Promise.all([
    // Si los lanzamientos fallan, el resto se sigue viendo.
    lanzamientosPortal(ctx).catch((e) => {
      console.error("[portal] no se pudieron leer los lanzamientos:", e);
      return [];
    }),
    cotizacionesCompartidas(ctx),
    pedidosDeCliente(ctx.clientId).catch((e) => {
      console.error("[portal] no se pudieron leer los pedidos:", e);
      return [];
    }),
    portadaCliente(ctx).catch(() => null),
  ]);
  const porAprobar = pedidos.filter((p) => p.kind === "aprobacion" && p.status === "abierta").length;
  const abiertos = pedidos.filter((p) => !estaCerrado(p.status)).length;

  return (
    <>
      {ctx.vistaInterna && (
        <p className="mb-4 rounded-lg bg-badge-warning-background px-3 py-2 text-xs text-badge-warning-text">
          Vista interna: estás viendo el portal como lo ve el cliente.
        </p>
      )}

      <HeroPortal imagen={portada} titulo={ctx.clienteNombre} />

      <div className="flex flex-col gap-14">
        {porAprobar > 0 && (
          <Link
            href={`/portal/${ctx.slug}/pedidos`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-badge-warning-text/40 bg-badge-warning-background px-5 py-4 transition-opacity hover:opacity-90"
          >
            <span className="text-sm font-semibold text-badge-warning-text">
              {porAprobar === 1 ? "1 pedido espera tu aprobación" : `${porAprobar} pedidos esperan tu aprobación`}
            </span>
            <span className="shrink-0 text-sm font-medium text-badge-warning-text">Ver →</span>
          </Link>
        )}

        <SeccionPortal titulo="Lanzamientos">
          {lanzamientos.length === 0 ? (
            <EmptyState title="Todavía no hay lanzamientos" />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {lanzamientos.map((l) => (
                <TarjetaLanzamiento
                  key={l.id}
                  href={`/portal/${ctx.slug}/lanzamientos/${l.id}`}
                  nombre={l.name}
                  imagen={l.cover_url}
                  estado={LABEL_ESTADO_LANZAMIENTO[l.status]}
                  fechas={l.starts_on ? `${fechaCorta(l.starts_on)}${l.ends_on ? ` → ${fechaCorta(l.ends_on)}` : ""}` : null}
                  detalle={`${l.registros.toLocaleString("es-AR")} registros`}
                />
              ))}
            </div>
          )}
        </SeccionPortal>

        <SeccionPortal
          titulo="Pedidos"
          accion={
            <Link href={`/portal/${ctx.slug}/pedidos`} className="shrink-0 text-sm font-medium text-primary-400 hover:underline">
              Ver pedidos →
            </Link>
          }
        >
          <p className="text-sm text-text-secondary">
            {abiertos === 0
              ? "No hay pedidos abiertos. Si algo no funciona o querés un cambio, pedilo desde acá."
              : `${abiertos} ${abiertos === 1 ? "pedido abierto" : "pedidos abiertos"}.`}
          </p>
        </SeccionPortal>

        {cotizaciones.length > 0 && (
          <SeccionPortal titulo="Cotizaciones">
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
                        <span className="block truncate text-sm font-medium text-text-primary">{q.title}</span>
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
          </SeccionPortal>
        )}
      </div>
    </>
  );
}
