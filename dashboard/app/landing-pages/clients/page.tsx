import { listarClientes } from "@/lib/landing/datos";
import { PageHeader } from "@/components/landing/ui";
import { ClienteForm } from "@/components/landing/cliente-form";
import { ClientesTabla } from "@/components/landing/clientes-tabla";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await listarClientes();

  return (
    <>
      <PageHeader
        titulo="Clientes"
        descripcion={`${clientes.length} ${clientes.length === 1 ? "contacto" : "contactos"}`}
        accion={<ClienteForm />}
      />

      <ClientesTabla clientes={clientes} />
    </>
  );
}
