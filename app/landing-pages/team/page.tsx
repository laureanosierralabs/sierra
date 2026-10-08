import { listarProyectos, listarTareas } from "@/lib/landing/datos";
import {
  accesoActual,
  listarInvitaciones,
  listarMiembrosDetalle,
} from "@/lib/landing/auth";
import { esProyectoActivo, esTareaAbierta } from "@/lib/landing/tipos";
import { PageHeader } from "@/components/landing/ui";
import { EquipoTabla } from "@/components/landing/equipo-tabla";
import { Invitaciones, InvitarMiembro } from "@/components/landing/equipo-gestion";

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

      <EquipoTabla
        miembros={miembros}
        esOwner={esOwner}
        proyectosPor={proyectosPor}
        tareasPor={tareasPor}
      />

      {esOwner && <Invitaciones invitaciones={invitaciones} />}
    </>
  );
}
