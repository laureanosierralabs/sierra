import { Suspense } from "react";
import { PageHeader } from "@/components/landing/ui";
import { FinanzasBalance } from "@/components/finanzas-balance";
import { FinanzasCotizaciones } from "@/components/finanzas-cotizaciones";
import { FinanzasEgresos } from "@/components/finanzas-egresos";

export const dynamic = "force-dynamic";

export default async function FinanzasLanding({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;

  return (
    <>
      <PageHeader
        titulo="Finanzas"
        descripcion="Ingresos, egresos y balance de Landing Pages"
      />

      {/* Todo sale de cotizaciones, acuerdos y gastos fijos: no hay un
          movimiento espejo por cada cobro, que contaría el dinero dos veces. */}
      <Suspense>
        <FinanzasBalance mes={mes} />
      </Suspense>

      <FinanzasCotizaciones />
      <FinanzasEgresos />
    </>
  );
}
