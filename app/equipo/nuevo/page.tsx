import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { TeamMemberForm } from "@/components/team-member-form";
import { getTeamProjects, requireTeamOwner, teamLoadError } from "@/lib/team";
import { emptyTeamMember } from "@/lib/team-fields";

export const dynamic = "force-dynamic";

export default async function NewTeamMemberPage() {
  if (!(await requireTeamOwner())) redirect("/sin-acceso");
  let projects;
  let error = "";
  try {
    projects = await getTeamProjects();
  } catch (cause) {
    error = teamLoadError(cause);
  }
  return (
    <div className="w-full px-6 py-10 md:px-10">
      <Link href="/equipo" className="text-sm text-text-2 hover:text-text">← Volver al equipo</Link>
      <header className="mb-8 mt-5">
        <p className="eyebrow">Equipo</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Nueva persona</h1>
        <p className="mt-2 text-sm text-text-2">Crea un perfil y vincula proyectos existentes. No se creará una cuenta de usuario.</p>
      </header>
      {error ? <Card className="p-5"><p role="alert" className="text-sm text-critical">{error}</p></Card>
        : projects && <TeamMemberForm member={emptyTeamMember()} projects={projects} mode="create" />}
    </div>
  );
}
