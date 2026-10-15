import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { PageHeader } from "@/components/landing/ui";
import { AccionesEstado, FormComentario } from "@/components/pedidos/pedido-formularios";
import { CabeceraPedido, HiloPedido } from "@/components/pedidos/pedido-ui";
import { Card } from "@/components/tailgrids/core/card";
import { cambiarEstadoPedido, comentarPedido } from "@/app/landing-pages/pedidos-acciones";
import { obtenerCliente } from "@/lib/landing/datos";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { clienteDePedido, pedidoDeCliente } from "@/lib/pedidos/datos";
import { transicionesEquipo } from "@/lib/pedidos/tipos";

export const dynamic = "force-dynamic";

/** Un pedido en el panel: el equipo lo mueve de estado y conversa con el cliente. */
export default async function PedidoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = await clienteDePedido(id);
  if (!clientId) notFound();

  const [detalle, cliente, portal] = await Promise.all([
    pedidoDeCliente(clientId, id),
    obtenerCliente(clientId),
    supabaseAdmin().from("client_orgs").select("slug").eq("client_id", clientId).maybeSingle(),
  ]);
  if (!detalle) notFound();
  const { pedido, comentarios } = detalle;
  const slug = portal.data?.slug as string | undefined;

  return (
    <>
      <Link
        href="/landing-pages/pedidos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Pedidos
      </Link>

      <PageHeader
        titulo={pedido.title}
        descripcion={cliente?.name}
        accion={
          <span className="flex flex-wrap items-center gap-3">
            {slug && (
              <a
                href={`/portal/${slug}/pedidos/${pedido.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline [&>svg]:size-4"
              >
                <ExpandArrowTopRightSquare1 />
                Ver en el portal
              </a>
            )}
            <Link href={`/landing-pages/clients/${clientId}`} className="text-sm font-medium text-text-secondary hover:underline">
              Ficha del cliente
            </Link>
          </span>
        }
      />

      <div className="flex flex-col gap-5">
        <CabeceraPedido pedido={pedido} />

        <AccionesEstado
          transiciones={transicionesEquipo(pedido.kind, pedido.status)}
          cambiar={cambiarEstadoPedido.bind(null, pedido.id)}
        />

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-primary">Conversación con el cliente</h2>
          <HiloPedido comentarios={comentarios} vistaDelCliente={false} />
          <FormComentario
            action={comentarPedido}
            campos={{ request_id: pedido.id }}
            placeholder={slug ? "Respondé al cliente: lo ve en su portal…" : "Este cliente no tiene portal: el comentario queda solo acá"}
          />
        </Card>
      </div>
    </>
  );
}
