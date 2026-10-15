import { PageHeader } from "@/components/landing/ui";
import { BandejaPedidos } from "@/components/pedidos/bandeja-pedidos";
import { bandejaPedidos } from "@/lib/pedidos/datos";

export const dynamic = "force-dynamic";

/** Bandeja de pedidos de todos los clientes: incidencias, cambios y aprobaciones. */
export default async function Pedidos() {
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
