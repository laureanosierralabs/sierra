import Link from "next/link";
import {
  listarClientes,
  listarProyectos,
  listarTareas,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { esProyectoActivo, nombreCliente } from "@/lib/landing/tipos";
import {
  EstadoProyectoPill,
  PageHeader,
  Vencimiento,
  VacioTabla,
} from "@/components/landing/ui";
import { Calendario } from "@/components/landing/calendario";

export const dynamic = "force-dynamic";

const COLUMNAS = ["Proyecto", "Cliente", "Estado", "Responsable", "Entrega"];
const MAX_EN_INICIO = 8;

export default async function LandingPagesInicio() {
  const [proyectos, tareas, miembros, clientes] = await Promise.all([
    listarProyectos(),
    listarTareas(),
    listarMiembros(),
    listarClientes(),
  ]);

  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));
  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));

  // Sin fecha van al final: no compiten con lo que sí tiene deadline.
  const activos = proyectos
    .filter((p) => esProyectoActivo(p.status))
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
    .slice(0, MAX_EN_INICIO);

  return (
    <>
      <PageHeader titulo="Inicio" />

      <section className="mb-8">
        <Calendario tareas={tareas} proyectos={proyectos} miembros={miembros} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold">Proyectos activos</h2>
          <Link
            href="/landing-pages/projects"
            className="text-xs text-text-3 transition-colors hover:text-text"
          >
            Ver todos →
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {COLUMNAS.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-text-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activos.length === 0 && (
                <VacioTabla colSpan={COLUMNAS.length}>
                  No hay proyectos activos.
                </VacioTabla>
              )}
              {activos.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-2.5 font-medium">
                    <Link
                      href={`/landing-pages/projects/${p.id}`}
                      className="hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-text-2">
                    {nombreCliente(p, clientePor) ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <EstadoProyectoPill estado={p.status} />
                  </td>
                  <td className="px-4 py-2.5 text-text-2">
                    {p.responsible_user_id
                      ? (nombreMiembro.get(p.responsible_user_id) ?? "—")
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Vencimiento fecha={p.due_date} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
