import { listarProyectos, listarTareas } from "@/lib/landing/datos";
import {
  accesoActual,
  listarInvitaciones,
  listarMiembrosDetalle,
} from "@/lib/landing/auth";
import { esProyectoActivo, esTareaAbierta } from "@/lib/landing/tipos";
import { DEFINICIONES } from "@/lib/unidades";
import { PageHeader, VacioTabla } from "@/components/landing/ui";
import { Tabla, TablaHead } from "@/components/landing/tabla";
import {
  EditarAcceso,
  Invitaciones,
  InvitarMiembro,
  QuitarMiembro,
} from "@/components/landing/equipo-gestion";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const { esOwner } = await accesoActual();

  const [miembros, proyectos, tareas, invitaciones] = await Promise.all([
    listarMiembrosDetalle(),
    listarProyectos(),
    listarTareas(),
    // Solo el owner gestiona invitaciones: no las leemos para un member.
    esOwner ? listarInvitaciones() : Promise.resolve([]),
  ]);

  const proyectosPor = new Map<string, number>();
  for (const p of proyectos) {
    if (!esProyectoActivo(p.status)) continue;
    for (const userId of p.assignee_ids) {
      proyectosPor.set(userId, (proyectosPor.get(userId) ?? 0) + 1);
    }
  }

  const tareasPor = new Map<string, number>();
  for (const t of tareas) {
    if (!esTareaAbierta(t.status)) continue;
    for (const userId of t.assignee_ids) {
      tareasPor.set(userId, (tareasPor.get(userId) ?? 0) + 1);
    }
  }

  const columnas = [
    "Nombre",
    "Email",
    "Rol",
    "Unidades",
    "Proyectos activos",
    "Tareas pendientes",
    ...(esOwner ? [""] : []),
  ];

  return (
    <>
      <PageHeader
        titulo="Equipo"
        descripcion={
          esOwner
            ? `${miembros.length} ${miembros.length === 1 ? "persona" : "personas"}`
            : "Quién forma parte del sistema"
        }
        accion={esOwner ? <InvitarMiembro /> : undefined}
      />

      <Tabla filas={miembros.length}>
        <table className="w-full min-w-200 text-sm">
          <TablaHead columnas={columnas} />
          <tbody>
            {miembros.length === 0 && (
              <VacioTabla colSpan={columnas.length}>
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
                    {m.rol === "owner" ? "Owner" : "Builder"}
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
                {esOwner && (
                  <td className="px-4 py-3">
                    <span className="flex items-center justify-end gap-3">
                      <EditarAcceso miembro={m} />
                      <QuitarMiembro id={m.id} />
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Tabla>

      {esOwner && <Invitaciones invitaciones={invitaciones} />}
    </>
  );
}
