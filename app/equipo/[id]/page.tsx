import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/ui";
import { TeamMemberForm } from "@/components/team-member-form";
import { getTeamMember, getTeamProjects, requireTeamOwner, teamLoadError } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireTeamOwner())) redirect("/sin-acceso");
  const { id } = await params;
  let member;
  let projects;
  let error = "";
  try {
    [member, projects] = await Promise.all([getTeamMember(id), getTeamProjects()]);
  } catch (cause) {
    error = teamLoadError(cause);
  }
  if (!error && !member) notFound();
  return (
    <div className="w-full px-6 py-10 md:px-10">
      <Link href="/equipo" className="text-sm text-text-2 hover:text-text">← Volver al equipo</Link>
      <header className="mb-8 mt-5">
        <p className="eyebrow">Equipo</p>
        <h1 className="mt-2 break-words text-3xl font-extrabold tracking-tight">{member?.name ?? "Perfil de persona"}</h1>
        <p className="mt-2 text-sm text-text-2">Edita el perfil y vincula proyectos existentes.</p>
      </header>
      {error ? <Card className="p-5"><p role="alert" className="text-sm text-critical">{error}</p></Card>
        : member && projects && <TeamMemberForm key={member.id} member={member} projects={projects} />}
    </div>
  );
}
