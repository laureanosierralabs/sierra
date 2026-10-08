import Link from "next/link";
import { redirect } from "next/navigation";
import { TeamMemberForm } from "@/components/team-member-form";
import { requireTeamOwner } from "@/lib/team";
import { emptyTeamMember } from "@/lib/team-fields";

export const dynamic = "force-dynamic";

export default async function NewTeamMemberPage() {
  if (!(await requireTeamOwner())) redirect("/sin-acceso");
  return (
    <div className="w-full px-6 py-10 md:px-10">
      <Link href="/equipo" className="text-sm text-text-2 hover:text-text">← Volver al equipo</Link>
      <header className="mb-8 mt-5">
        <p className="eyebrow">Equipo</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Nueva persona</h1>
        <p className="mt-2 text-sm text-text-2">Crea un perfil con su rol y responsabilidades. No se creará una cuenta de usuario.</p>
      </header>
      <TeamMemberForm member={emptyTeamMember()} mode="create" />
    </div>
  );
}
