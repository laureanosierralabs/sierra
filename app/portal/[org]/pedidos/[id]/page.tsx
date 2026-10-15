import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@tailgrids/icons";
import { DecidirAprobacion, FormComentario } from "@/components/pedidos/pedido-formularios";
import { CabeceraPedido, HiloPedido } from "@/components/pedidos/pedido-ui";
import { Card } from "@/components/tailgrids/core/card";
import { comentarPedidoPortal, decidirAprobacion } from "@/app/portal/pedidos-acciones";
import { contextoPortal } from "@/lib/portal/contexto";
import { pedidoDeCliente } from "@/lib/pedidos/datos";
import { decisionesCliente } from "@/lib/pedidos/tipos";

export const dynamic = "force-dynamic";

/** Un pedido en el portal: qué es, en qué estado está y la conversación. */
export default async function PedidoPortal({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  const ctx = await contextoPortal(org);
  if (!ctx) notFound();

  const detalle = await pedidoDeCliente(ctx.clientId, id);
  if (!detalle) notFound();
  const { pedido, comentarios } = detalle;
  const puedeDecidir = !ctx.vistaInterna && decisionesCliente(pedido.kind, pedido.status).length > 0;

  return (
    <>
      <Link
        href={`/portal/${ctx.slug}/pedidos`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Pedidos
      </Link>

      <h1 className="mb-4 text-xl font-semibold text-text-primary">{pedido.title}</h1>

      <div className="flex flex-col gap-5">
        <CabeceraPedido pedido={pedido} />

        {puedeDecidir && (
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              Mirá el link y decinos si lo aprobás o qué cambiarías.
            </p>
            <DecidirAprobacion action={decidirAprobacion} slug={ctx.slug} requestId={pedido.id} />
          </Card>
        )}

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-primary">Conversación</h2>
          <HiloPedido comentarios={comentarios} vistaDelCliente />
          {!ctx.vistaInterna && (
            <FormComentario action={comentarPedidoPortal} campos={{ slug: ctx.slug, request_id: pedido.id }} />
          )}
        </Card>
      </div>
    </>
  );
}
