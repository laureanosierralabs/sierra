import Link from "next/link";
import { listarClientes, listarProyectos } from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { nombreCliente } from "@/lib/landing/tipos";
import { PageHeader, Prioridad, Vencimiento, VacioTabla } from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { BorrarProyecto } from "@/components/landing/borrar";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  const [proyectos, miembros, clientes] = await Promise.all([
    listarProyectos(),
    listarMiembros(),
    listarClientes(),
  ]);

  const nombrePor = new Map(miembros.map((m) => [m.id, m.nombre]));
  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        titulo="Proyectos"
        descripcion={`${proyectos.length} ${proyectos.length === 1 ? "proyecto" : "proyectos"}`}
        accion={<ProyectoForm miembros={miembros} clientes={clientes} />}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Proyecto", "Cliente", "Estado", "Responsable", "Deadline", "Prioridad", ""].map(
                (h, i) => (
                  <th
                    key={h || i}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {proyectos.length === 0 && (
              <VacioTabla colSpan={7}>Todavía no hay proyectos.</VacioTabla>
            )}
            {proyectos.map((p) => (
              <tr
                key={p.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/landing-pages/projects/${p.id}`}
                    className="hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-2">
                  {nombreCliente(p, clientePor) ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <EstadoSelect id={p.id} valor={p.status} tipo="proyecto" />
                </td>
                <td className="px-4 py-3 text-text-2">
                  {p.responsible_user_id
                    ? (nombrePor.get(p.responsible_user_id) ?? "—")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Vencimiento fecha={p.due_date} />
                </td>
                <td className="px-4 py-3">
                  <Prioridad prioridad={p.priority} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-3">
                    <ProyectoForm
                      miembros={miembros}
                      clientes={clientes}
                      proyecto={p}
                    />
                    <BorrarProyecto id={p.id} />
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
