import { ErrorState } from "@/components/common/error-state";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { FinanzasPersonal } from "@/components/finanzas-personal";
import {
  loadPersonalFinance,
  requireFinanceOwner,
} from "@/lib/personal-finance-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FinanzasPersonalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    await requireFinanceOwner();
  } catch {
    redirect("/");
  }
  const params = await searchParams;
  const query = Object.fromEntries(
    Object.entries(params).filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  let data;
  try {
    data = await loadPersonalFinance();
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Finanzas" />
        <ErrorState
          title="No se pudieron cargar las finanzas"
          description="Verificar conexión y aplicar las migraciones de Finanzas Personales V1 antes de activar esta sección. No se modificaron datos existentes."
        />
      </PageContainer>
    );
  }
  return (
    <PageContainer>
      <FinanzasPersonal data={data} query={query} />
    </PageContainer>
  );
}
