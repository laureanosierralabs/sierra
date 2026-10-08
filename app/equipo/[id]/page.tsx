import { notFound, redirect } from "next/navigation";
import { ErrorState } from "@/components/common/error-state";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { TeamMemberForm } from "@/components/team-member-form";
import { getTeamMember, requireTeamOwner, teamLoadError } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireTeamOwner())) redirect("/sin-acceso");
  const { id } = await params;
  let member;
  let error = "";
  try {
    member = await getTeamMember(id);
  } catch (cause) {
    error = teamLoadError(cause);
  }
  if (!error && !member) notFound();
  return (
    <PageContainer>
      <PageHeader
        title={member?.name ?? "Perfil de persona"}
        description="Edita el rol, las responsabilidades y las decisiones de esta persona."
      />
      {error ? (
        <ErrorState title="No se pudo cargar el perfil" description={error} />
      ) : (
        member && <TeamMemberForm key={member.id} member={member} />
      )}
    </PageContainer>
  );
}
