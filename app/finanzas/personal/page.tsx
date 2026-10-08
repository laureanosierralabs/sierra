import { PersonalFinance } from "@/components/personal-finance";
import {
  loadPersonalFinance,
  requireFinanceOwner,
} from "@/lib/personal-finance-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FinanzasPersonal({
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
      <div className="px-6 py-10">
        <h1 className="text-2xl font-bold">Finanzas personales V1</h1>
        <p className="mt-4 text-sm text-text-3">
          No se pudieron cargar las finanzas. Verificar conexión y aplicar las
          migraciones de Finanzas Personales V1 antes de activar esta sección.
          No se modificaron datos existentes.
        </p>
      </div>
    );
  }
  return <PersonalFinance data={data} query={query} />;
}
