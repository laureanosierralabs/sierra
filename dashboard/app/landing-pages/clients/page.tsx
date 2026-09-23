import Link from "next/link";
import { listarClientes } from "@/lib/landing/datos";
import { PageHeader, VacioTabla } from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { ClienteForm } from "@/components/landing/cliente-form";
import { BorrarCliente } from "@/components/landing/borrar";

export const dynamic = "force-dynamic";

const COLUMNAS = ["Nombre", "Empresa", "Estado", "WhatsApp", "Instagram", "Email", ""];

export default async function ClientesPage() {
  const clientes = await listarClientes();

  return (
    <>
      <PageHeader
        titulo="Clientes"
        descripcion={`${clientes.length} ${clientes.length === 1 ? "contacto" : "contactos"}`}
        accion={<ClienteForm />}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {COLUMNAS.map((h, i) => (
                <th
                  key={h || i}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 && (
              <VacioTabla colSpan={COLUMNAS.length}>
                Todavía no hay contactos.
              </VacioTabla>
            )}
            {clientes.map((c) => (
              <tr
                key={c.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/landing-pages/clients/${c.id}`}
                    className="hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-2">{c.company ?? "—"}</td>
                <td className="px-4 py-3">
                  <EstadoSelect id={c.id} valor={c.status} tipo="cliente" />
                </td>
                <td className="px-4 py-3 text-text-2">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 text-text-2">{c.instagram ?? "—"}</td>
                <td className="px-4 py-3 text-text-2">{c.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center justify-end gap-3">
                    <ClienteForm cliente={c} />
                    <BorrarCliente id={c.id} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
