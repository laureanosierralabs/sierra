import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, Empty } from "@/components/ui";
import { getTeamMembers, getTeamProjects, requireTeamOwner, teamLoadError } from "@/lib/team";
import { TEAM_STATUSES, isActiveProject, memberProjects, projectHref, type TeamMember, type TeamProject } from "@/lib/team-fields";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  if (!(await requireTeamOwner())) redirect("/sin-acceso");
  let members: TeamMember[] = [];
  let projects: TeamProject[] = [];
  let error = "";
  try {
    [members, projects] = await Promise.all([getTeamMembers(), getTeamProjects()]);
  } catch (cause) {
    error = teamLoadError(cause);
  }
  return (
    <div className="w-full px-6 py-10 md:px-10">
      <Link href="/" className="text-sm text-text-2 hover:text-text">← Inicio</Link>
      <header className="mb-8 mt-5">
        <p className="eyebrow">Organización</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Equipo</h1>
        <p className="mt-2 text-sm text-text-2">Roles, decisiones y proyectos en un solo lugar. Abre una persona para editar su perfil.</p>
      </header>
      {error ? <Card className="p-5"><p role="alert" className="text-sm text-critical">{error}</p></Card> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => {
            const linked = memberProjects(member, projects);
            const active = linked.filter(isActiveProject).length;
            const statusColor = member.status === "bloqueado" ? "text-critical" : member.status === "esperando-aprobacion" ? "text-warn" : "text-text-2";
            return (
              <Card key={member.id} className="min-w-0 p-5">
                <Link href={`/equipo/${member.id}`} className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4">
                  <h2 className="break-words font-display text-lg font-bold group-hover:underline">{member.name}</h2>
                  <p className="mt-1 break-words text-sm text-text-2">{member.role}</p>
                  <p className={`mt-3 text-xs font-semibold ${statusColor}`}>{member.status ? TEAM_STATUSES[member.status] : "Sin estado definido"}</p>
                  <p className="mt-4 line-clamp-3 whitespace-pre-line break-words text-sm text-text-2">{member.responsibilities || "Responsabilidades por definir."}</p>
                  {member.approval_required && <p className="mt-3 line-clamp-2 break-words text-xs text-text-3">Requiere aprobación para: {member.approval_required}</p>}
                  {member.status === "esperando-aprobacion" && <p className="mt-3 text-xs text-warn">Necesita tu aprobación.</p>}
                  <p className="mt-4 text-xs font-semibold text-text-2">{linked.length ? `${active} proyectos activos · ${linked.length} vinculados` : "Sin proyectos vinculados"}</p>
                  <span className="mt-3 inline-block text-xs font-semibold">Ver y editar →</span>
                </Link>
                {linked.length > 0 && <ul className="mt-3 space-y-1 border-t border-line pt-3">
                  {linked.map((project) => <li key={`${project.source}:${project.id}`}><Link href={projectHref(project)} className="block break-words text-xs text-text-2 hover:underline">{project.name}</Link></li>)}
                </ul>}
              </Card>
            );
          })}
          {!members.length && <Empty>No hay perfiles cargados. Revisa que se haya aplicado la migración de Equipo.</Empty>}
        </div>
      )}
    </div>
  );
}
