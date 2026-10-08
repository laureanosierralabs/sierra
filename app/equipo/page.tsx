import { redirect } from "next/navigation";
import { Plus } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { EquipoCards } from "@/components/equipo-cards";
import { EnlaceBoton } from "@/components/landing/enlace-boton";
import { getTeamMembers, getTeamProjects, requireTeamOwner, teamLoadError } from "@/lib/team";
import type { TeamMember, TeamProject } from "@/lib/team-fields";

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
    <PageContainer>
      <PageHeader
        title="Equipo"
        description="Roles, decisiones y proyectos en un solo lugar. Abre una persona para editar su perfil."
        actions={
          <EnlaceBoton
            href="/equipo/nuevo"
            icono={<Plus />}
            className="border-transparent bg-button-primary-background text-button-primary-text hover:bg-button-primary-hover-background hover:text-button-primary-text"
          >
            Nueva persona
          </EnlaceBoton>
        }
      />
      {error ? (
        <ErrorState title="No se pudo cargar el equipo" description={error} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No hay personas en el equipo"
          description="Usa «Nueva persona» para crear el primer perfil."
        />
      ) : (
        <EquipoCards members={members} projects={projects} />
      )}
    </PageContainer>
  );
}
