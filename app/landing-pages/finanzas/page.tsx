import { PageHeader } from "@/components/landing/ui";
import { cargarFinanzas } from "@/lib/landing/balance";
import { BalanceMensual, Resumen } from "@/components/finanzas-balance";
import { FinanzasCotizaciones } from "@/components/finanzas-cotizaciones";
import { FinanzasEgresos } from "@/components/finanzas-egresos";
import { FinanzasGastos } from "@/components/finanzas-gastos";
import { FinanzasRentabilidad } from "@/components/finanzas-rentabilidad";
import { EvolucionMensual } from "@/components/landing/graficos-finanzas";
import { ExportarFinanzas } from "@/components/landing/exportar-finanzas";

export const dynamic = "force-dynamic";

export default async function FinanzasLanding({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;

  // Dos lecturas: una filtrada para la tabla y otra completa para el
  // gráfico, cuyo valor es justamente ver la serie entera.
  const [{ balance }, { balance: completo }] = await Promise.all([
    cargarFinanzas(mes),
    mes ? cargarFinanzas() : Promise.resolve({ balance: null }),
  ]);

  const serie = (completo ?? balance).meses
    .map((m) => ({
      mes: m.mes,
      ingresos: m.ingresos.USD,
      egresos: m.costosEquipo.USD + m.gastos.USD,
      resultado: m.resultado.USD,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  return (
    <>
      <PageHeader
        titulo="Finanzas"
        descripcion="Ingresos, egresos y rentabilidad de Landing Pages"
        accion={<ExportarFinanzas />}
      />

      {/* Todo sale de cotizaciones, acuerdos y gastos: no hay movimientos
          espejo, así que ningún importe se cuenta dos veces. */}
      <Resumen balance={balance} />

      <section className="mb-10">
        <h2 className="mb-3 font-display text-base font-bold">
          Evolución del negocio
        </h2>
        <EvolucionMensual datos={serie} />
      </section>

      <BalanceMensual balance={balance} mes={mes} />
      <FinanzasCotizaciones />
      <FinanzasEgresos />
      <FinanzasGastos />
      <FinanzasRentabilidad balance={balance} />
    </>
  );
}
