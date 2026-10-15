import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@tailgrids/icons";
import { NuevoPedido } from "@/components/pedidos/pedido-formularios";
import { ListaPedidos } from "@/components/pedidos/pedido-ui";
import { Card } from "@/components/tailgrids/core/card";
import { crearPedidoPortal } from "@/app/portal/pedidos-acciones";
import { contextoPortal } from "@/lib/portal/contexto";
import { lanzamientosPortal } from "@/lib/portal/datos";
import { pedidosDeCliente } from "@/lib/pedidos/datos";
import { estaCerrado } from "@/lib/pedidos/tipos";

export const dynamic = "force-dynamic";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-text-secondary">{titulo}</h2>
      <Card className="overflow-hidden p-0">{children}</Card>
    </section>
  );
}

/**
 * Pedidos del cliente: lo que espera su aprobación primero, después lo que
 * está en curso y al final el historial.
 */
export default async function PedidosPortal({ params }: { params: Promise<{ org: string }> }) {
  const ctx = await contextoPortal((await params).org);
  if (!ctx) notFound();

  const [pedidos, lanzamientos] = await Promise.all([
    pedidosDeCliente(ctx.clientId),
    lanzamientosPortal(ctx).catch(() => []),
  ]);
  const href = (id: string) => `/portal/${ctx.slug}/pedidos/${id}`;
  const porAprobar = pedidos.filter((p) => p.kind === "aprobacion" && p.status === "abierta");
  const abiertos = pedidos.filter((p) => !estaCerrado(p.status) && !porAprobar.includes(p));
  const cerrados = pedidos.filter((p) => estaCerrado(p.status));

  return (
    <>
      <Link
        href={`/portal/${ctx.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        {ctx.clienteNombre}
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Pedidos</h1>
          <p className="text-sm text-text-tertiary">
            Reportá un problema o pedí un cambio. Cada pedido tiene su estado y su conversación.
          </p>
        </div>
        {!ctx.vistaInterna && (
          <NuevoPedido
            action={crearPedidoPortal}
            slug={ctx.slug}
            lanzamientos={lanzamientos.map((l) => ({ id: l.id, name: l.name }))}
          />
        )}
      </div>

      {porAprobar.length > 0 && (
        <Seccion titulo={`Esperan tu aprobación (${porAprobar.length})`}>
          <ListaPedidos pedidos={porAprobar} href={href} vacio="" />
        </Seccion>
      )}
      <Seccion titulo="En curso">
        <ListaPedidos pedidos={abiertos} href={href} vacio="No hay pedidos abiertos." />
      </Seccion>
      {cerrados.length > 0 && (
        <Seccion titulo="Historial">
          <ListaPedidos pedidos={cerrados} href={href} vacio="" />
        </Seccion>
      )}
    </>
  );
}
