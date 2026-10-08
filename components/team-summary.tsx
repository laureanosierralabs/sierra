import Link from "next/link";
import { UserMultiple1 } from "@tailgrids/icons";
import { Card } from "@/components/tailgrids/core/card";
import { getTeamMembers, getTeamProjects, requireTeamOwner } from "@/lib/team";
import { teamMetrics } from "@/lib/team-fields";

export async function TeamSummary() {
  if (!(await requireTeamOwner())) return null;
  let metrics;
  try {
    const members = await getTeamMembers();
    // Empty profiles do not need a catalog query just to show the people count.
    const projects = members.some((m) => m.project_ids.length || m.context_project_slugs.length)
      ? await getTeamProjects() : [];
    metrics = teamMetrics(members, projects);
  } catch {
    // An unapplied migration must not take down the existing dashboard.
  }
  return (
    <Card className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-title-50">
          <UserMultiple1 aria-hidden="true" className="size-4 text-text-tertiary" />
          Equipo
        </h2>
        {metrics ? (
          <p className="mt-1 text-xs text-text-secondary">
            {metrics.people} personas
            {metrics.activeProjects !== null && ` · ${metrics.activeProjects} proyectos activos`}
            {metrics.blocked !== null && ` · ${metrics.blocked} bloqueadas`}
            {metrics.awaitingApproval !== null && ` · ${metrics.awaitingApproval} esperando aprobación`}
          </p>
        ) : (
          <p className="mt-1 text-xs text-text-tertiary">Información del equipo no disponible.</p>
        )}
      </div>
      <Link
        href="/equipo"
        className="shrink-0 rounded-lg border border-card-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors outline-none hover:bg-background-gray-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        Ver equipo →
      </Link>
    </Card>
  );
}
