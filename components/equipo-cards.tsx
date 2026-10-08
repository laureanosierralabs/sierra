import Link from "next/link";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import {
  TEAM_STATUSES,
  isActiveProject,
  memberProjects,
  projectHref,
  type TeamMember,
  type TeamProject,
} from "@/lib/team-fields";

type Tono = NonNullable<React.ComponentProps<typeof Badge>["color"]>;

const TONO_ESTADO: Record<keyof typeof TEAM_STATUSES, Tono> = {
  disponible: "gray",
  trabajando: "success",
  bloqueado: "error",
  "esperando-aprobacion": "warning",
};

export function EquipoCards({
  members,
  projects,
}: {
  members: TeamMember[];
  projects: TeamProject[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((member) => {
        const linked = memberProjects(member, projects);
        const active = linked.filter(isActiveProject).length;
        return (
          <Card key={member.id} className="min-w-0">
            <Link
              href={`/equipo/${member.id}`}
              className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold break-words text-title-50 group-hover:underline">
                    {member.name}
                  </h2>
                  <p className="mt-1 text-sm break-words text-text-secondary">{member.role}</p>
                </div>
                {member.status ? (
                  <Badge color={TONO_ESTADO[member.status]}>{TEAM_STATUSES[member.status]}</Badge>
                ) : (
                  <span className="text-xs text-text-tertiary">Sin estado definido</span>
                )}
              </div>
              <p className="mt-4 line-clamp-3 text-sm break-words whitespace-pre-line text-text-secondary">
                {member.responsibilities || "Responsabilidades por definir."}
              </p>
              {member.approval_required && (
                <p className="mt-3 line-clamp-2 text-xs break-words text-text-tertiary">
                  Requiere aprobación para: {member.approval_required}
                </p>
              )}
              {member.status === "esperando-aprobacion" && (
                <p className="mt-3 text-xs font-medium text-badge-warning-text">
                  Necesita tu aprobación.
                </p>
              )}
              <p className="mt-4 text-xs font-medium text-text-secondary">
                {linked.length
                  ? `${active} proyectos activos · ${linked.length} vinculados`
                  : "Sin proyectos vinculados"}
              </p>
              <span className="mt-3 inline-block text-xs font-medium text-primary-500">
                Ver y editar →
              </span>
            </Link>
            {linked.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-card-border pt-3">
                {linked.map((project) => (
                  <li key={`${project.source}:${project.id}`}>
                    <Link
                      href={projectHref(project)}
                      className="block text-xs break-words text-text-secondary hover:underline"
                    >
                      {project.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
