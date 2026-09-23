import { listarProyectos, listarTareas } from "@/lib/landing/datos";
import { listarMiembrosDetalle } from "@/lib/landing/auth";
import { esProyectoActivo, esTareaAbierta } from "@/lib/landing/tipos";
import { DEFINICIONES } from "@/lib/unidades";
import { PageHeader, VacioTabla } from "@/components/landing/ui";

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Nombre",
  "Email",
  "Rol",
  "Unidades",
  "Proyectos activos",
  "Tareas pendientes",
];

export default async function EquipoPage() {
  const [miembros, proyectos, tareas] = await Promise.all([
    listarMiembrosDetalle(),
    listarProyectos(),
    listarTareas(),
  ]);

  const proyectosPor = new Map<string, number>();
  for (const p of proyectos) {
    if (!p.responsible_user_id || !esProyectoActivo(p.status)) continue;
    proyectosPor.set(
      p.responsible_user_id,
      (proyectosPor.get(p.responsible_user_id) ?? 0) + 1,
    );
  }

  const tareasPor = new Map<string, number>();
  for (const t of tareas) {
    if (!t.assigned_to || !esTareaAbierta(t.status)) continue;
    tareasPor.set(t.assigned_to, (tareasPor.get(t.assigned_to) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader
        titulo="Equipo"
        descripcion="Las altas y los roles se gestionan desde Clerk"
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {COLUMNAS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {miembros.length === 0 && (
              <VacioTabla colSpan={COLUMNAS.length}>
                No hay miembros cargados.
              </VacioTabla>
            )}
            {miembros.map((m) => (
              <tr
                key={m.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-medium">{m.nombre}</td>
                <td className="px-4 py-3 text-text-2">{m.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      m.rol === "owner"
                        ? "rounded border border-idle/30 bg-idle-dim px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-idle"
                        : "text-xs text-text-2"
                    }
                  >
                    {m.rol === "owner" ? "Owner" : "Member"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-text-2">
                  {m.rol === "owner"
                    ? "Todas"
                    : m.unidades
                        .map((u) => DEFINICIONES[u].nombre)
                        .join(", ") || "—"}
                </td>
                <td className="tnum px-4 py-3 text-text-2">
                  {proyectosPor.get(m.id) ?? 0}
                </td>
                <td className="tnum px-4 py-3 text-text-2">
                  {tareasPor.get(m.id) ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
