import { listarProyectos, listarTareas } from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { PageHeader, Prioridad, Vencimiento, VacioTabla } from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { TareaForm } from "@/components/landing/tarea-form";
import { BorrarTarea } from "@/components/landing/borrar";

export const dynamic = "force-dynamic";

export default async function TareasPage() {
  const [tareas, proyectos, miembros] = await Promise.all([
    listarTareas(),
    listarProyectos(),
    listarMiembros(),
  ]);

  const nombrePor = new Map(miembros.map((m) => [m.id, m.nombre]));
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));

  return (
    <>
      <PageHeader
        titulo="Tareas"
        descripcion={`${tareas.length} ${tareas.length === 1 ? "tarea" : "tareas"}`}
        accion={<TareaForm miembros={miembros} proyectos={proyectos} />}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Tarea", "Proyecto", "Responsable", "Estado", "Prioridad", "Deadline", ""].map(
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
            {tareas.length === 0 && (
              <VacioTabla colSpan={7}>Todavía no hay tareas.</VacioTabla>
            )}
            {tareas.map((t) => (
              <tr
                key={t.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-medium">{t.title}</td>
                <td className="px-4 py-3 text-text-2">
                  {t.project_id ? (proyectoPor.get(t.project_id) ?? "—") : "—"}
                </td>
                <td className="px-4 py-3 text-text-2">
                  {t.assigned_to ? (nombrePor.get(t.assigned_to) ?? "—") : "—"}
                </td>
                <td className="px-4 py-3">
                  <EstadoSelect id={t.id} valor={t.status} tipo="tarea" />
                </td>
                <td className="px-4 py-3">
                  <Prioridad prioridad={t.priority} />
                </td>
                <td className="px-4 py-3">
                  <Vencimiento fecha={t.due_date} />
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center justify-end gap-3">
                    <TareaForm
                      miembros={miembros}
                      proyectos={proyectos}
                      tarea={t}
                    />
                    <BorrarTarea id={t.id} />
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
