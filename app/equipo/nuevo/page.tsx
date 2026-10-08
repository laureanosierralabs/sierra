import { redirect } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { TeamMemberForm } from "@/components/team-member-form";
import { requireTeamOwner } from "@/lib/team";
import { emptyTeamMember } from "@/lib/team-fields";

export const dynamic = "force-dynamic";

export default async function NewTeamMemberPage() {
  if (!(await requireTeamOwner())) redirect("/sin-acceso");
  return (
    <PageContainer>
      <PageHeader
        title="Nueva persona"
        description="Crea un perfil con su rol y responsabilidades. No se creará una cuenta de usuario."
      />
      <TeamMemberForm member={emptyTeamMember()} mode="create" />
    </PageContainer>
  );
}
