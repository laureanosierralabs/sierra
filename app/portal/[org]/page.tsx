import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle1, ExpandArrowTopRightSquare1, Message1, Rocket1, UserMultiple4 } from "@tailgrids/icons";
import { EstadoPagoPill } from "@/components/landing/ui";
import { HeroPortal, MetricaPortal, SeccionPortal, TarjetaLanzamiento } from "@/components/portal/portal-ui";
import { AvisoVistaInterna } from "@/components/portal/vista-interna";
import { codigoCotizacion, fechaCorta, fechaCotizacion, formatearMonto } from "@/lib/landing/tipos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";
import { contextoPortal } from "@/lib/portal/contexto";
import { cotizacionesCompartidas, lanzamientosPortal, portadaCliente } from "@/lib/portal/datos";
import { pedidosDeCliente } from "@/lib/pedidos/datos";
import { estaCerrado } from "@/lib/pedidos/tipos";

export const dynamic = "force-dynamic";

/**
 * Inicio del portal de un cliente, como una presentación: la banda con su
 * imagen y su nombre en grande, y sus lanzamientos como afiches montados
 * sobre el borde. Abajo, pedidos y cotizaciones. Todo se lee con el
 * contexto del cliente.
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
  const registros = lanzamientos.reduce((n, l) => n + l.registros, 0);
  const activos = lanzamientos.filter((l) => l.status === "activo").length;

  return (
    <>
      {ctx.vistaInterna && <AvisoVistaInterna />}

      <HeroPortal
        imagen={portada}
        titulo={ctx.clienteNombre}
        etiqueta="Lanzamientos"
        solapa={
          lanzamientos.length === 0 ? (
            <div className="portal-entrar flex aspect-9/16 max-w-[16rem] items-center justify-center rounded-[28px] border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-white/60">
              Tus lanzamientos van a aparecer acá.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {lanzamientos.map((l, i) => (
                <TarjetaLanzamiento
                  key={l.id}
                  indice={i}
                  href={`/portal/${ctx.slug}/lanzamientos/${l.id}`}
                  nombre={l.name}
                  imagen={l.cover_url}
                  estado={LABEL_ESTADO_LANZAMIENTO[l.status]}
                  activo={l.status === "activo"}
                  fechas={l.starts_on ? `${fechaCorta(l.starts_on)}${l.ends_on ? ` → ${fechaCorta(l.ends_on)}` : ""}` : null}
                  detalle={`${l.registros.toLocaleString("es-AR")} registros`}
                />
              ))}
            </div>
          )
        }
      />

      <div className="flex flex-col gap-12 sm:gap-14">
        <SeccionPortal titulo="Resumen">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <MetricaPortal
              etiqueta="Registros"
              valor={registros.toLocaleString("es-AR")}
              detalle={lanzamientos.length === 1 ? "En tu lanzamiento" : `En ${lanzamientos.length} lanzamientos`}
              icono={<UserMultiple4 />}
            />
            <MetricaPortal
              etiqueta={activos === 1 ? "Lanzamiento activo" : "Lanzamientos activos"}
              valor={String(activos)}
              detalle={`De ${lanzamientos.length} en total`}
              icono={<Rocket1 />}
            />
            <MetricaPortal
              etiqueta={abiertos === 1 ? "Pedido abierto" : "Pedidos abiertos"}
              valor={String(abiertos)}
              detalle={abiertos === 0 ? "Todo al día" : "Lo estamos resolviendo"}
              icono={<Message1 />}
            />
            <MetricaPortal
              etiqueta="Esperan tu aprobación"
              valor={String(porAprobar)}
              detalle={porAprobar === 0 ? "Nada pendiente" : "Revisalos en Pedidos"}
              icono={<CheckCircle1 />}
              destacada={porAprobar > 0}
            />
          </div>
        </SeccionPortal>

        {porAprobar > 0 && (
          <Link
            href={`/portal/${ctx.slug}/pedidos`}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-badge-warning-text/30 bg-badge-warning-text/10 px-5 py-4 transition-colors hover:bg-badge-warning-text/15"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-badge-warning-text">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-badge-warning-text opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-badge-warning-text" />
              </span>
              {porAprobar === 1 ? "1 pedido espera tu aprobación" : `${porAprobar} pedidos esperan tu aprobación`}
            </span>
            <span className="shrink-0 text-sm font-medium text-badge-warning-text transition-transform group-hover:translate-x-0.5">Ver →</span>
          </Link>
        )}

        <SeccionPortal
          titulo="Pedidos"
          accion={
            <Link href={`/portal/${ctx.slug}/pedidos`} className="shrink-0 text-sm font-medium text-primary-300 hover:text-primary-200">
              Ver pedidos →
            </Link>
          }
        >
          <p className="text-sm text-white/70">
            {abiertos === 0
              ? "No hay pedidos abiertos. Si algo no funciona o querés un cambio, pedilo desde acá."
              : `${abiertos} ${abiertos === 1 ? "pedido abierto" : "pedidos abiertos"}.`}
          </p>
        </SeccionPortal>

        {cotizaciones.length > 0 && (
          <SeccionPortal titulo="Cotizaciones">
            <ul className="flex flex-col gap-2">
              {cotizaciones.map((q) => (
                <li key={q.numero}>
                  <Link
                    href={`/q/${q.public_token}`}
                    target="_blank"
                    className="group flex items-center justify-between gap-4 rounded-2xl bg-white/4 px-5 py-4 ring-1 ring-white/10 transition-all hover:bg-white/7 hover:ring-primary-500/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white">{q.title}</span>
                      <span className="text-xs tabular-nums text-white/50">
                        {codigoCotizacion(q.numero)} · {fechaCorta(fechaCotizacion(q))}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-white">{formatearMonto(q.total_amount, q.currency)}</span>
                      <EstadoPagoPill estado={q.payment_status} />
                      <ExpandArrowTopRightSquare1 className="size-4 text-white/40 transition-colors group-hover:text-primary-300" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SeccionPortal>
        )}
      </div>
    </>
  );
}
