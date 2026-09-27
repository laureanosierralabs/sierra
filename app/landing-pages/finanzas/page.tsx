import { PageHeader } from "@/components/landing/ui";
import { cargarFinanzas } from "@/lib/landing/balance";
import { BalanceMensual, Resumen } from "@/components/finanzas-balance";
import { FinanzasCotizaciones } from "@/components/finanzas-cotizaciones";
import { FinanzasEgresos } from "@/components/finanzas-egresos";
import { FinanzasGastos } from "@/components/finanzas-gastos";
import { ExportarFinanzas } from "@/components/landing/exportar-finanzas";

export const dynamic = "force-dynamic";

export default async function FinanzasLanding({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const { balance } = await cargarFinanzas(mes);

  return (
    <>
      <PageHeader
        titulo="Finanzas"
        descripcion="Ingresos, egresos y balance de Landing Pages"
        accion={<ExportarFinanzas />}
      />

      {/* Todo sale de cotizaciones, acuerdos y gastos: no hay movimientos
          espejo, así que ningún importe se cuenta dos veces. */}
      <Resumen balance={balance} />
      <BalanceMensual balance={balance} mes={mes} />
      <FinanzasCotizaciones />
      <FinanzasEgresos />
      <FinanzasGastos />
    </>
  );
}
