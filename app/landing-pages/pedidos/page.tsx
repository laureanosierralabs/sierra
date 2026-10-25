import { notFound } from "next/navigation";
import { PageHeader } from "@/components/landing/ui";
import { BandejaPedidos } from "@/components/pedidos/bandeja-pedidos";
import { bandejaPedidos } from "@/lib/pedidos/datos";
import { PEDIDOS_ACTIVOS } from "@/lib/pedidos/tipos";

export const dynamic = "force-dynamic";

/** Bandeja de pedidos de todos los clientes: incidencias, cambios y aprobaciones. */
export default async function Pedidos() {
  // Pedidos apagados: se gestionan por WhatsApp (ver PEDIDOS_ACTIVOS).
  if (!PEDIDOS_ACTIVOS) notFound();
  const pedidos = await bandejaPedidos();
  return (
    <>
      <PageHeader
        titulo="Pedidos"
        descripcion="Lo que reportan y piden los clientes desde su portal, y las aprobaciones que les mandamos."
      />
      <BandejaPedidos pedidos={pedidos} />
    </>
  );
}
