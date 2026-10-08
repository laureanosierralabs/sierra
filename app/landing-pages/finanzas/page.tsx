import { Suspense } from "react";
import { PageHeader } from "@/components/common/page-header";
import {
  FiltroMesFinanzas,
  SelectorMoneda,
} from "@/components/landing/finanzas/finanzas-filtros";
import { FinanzasTabs } from "@/components/landing/finanzas/finanzas-tabs";
import { ResumenVista } from "@/components/landing/finanzas/resumen-vista";
import {
  CotizacionesVista,
  EgresosVista,
  GastosVista,
} from "@/components/landing/finanzas/secciones-vista";
import { leerMoneda, leerVista, monedasConDatos } from "@/components/landing/finanzas/vistas";
import { ExportarFinanzas } from "@/components/landing/exportar-finanzas";
import { cargarFinanzas } from "@/lib/landing/balance";

export const dynamic = "force-dynamic";

export default async function FinanzasLanding({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; vista?: string; moneda?: string }>;
}) {
  const { mes, vista: vistaParam, moneda: monedaParam } = await searchParams;

  // Una sola carga sin filtro: `mes` solo recorta `balance.meses` en
  // cargarFinanzas, todo lo demás es idéntico. Los gráficos necesitan la
  // serie completa y la tabla el recorte, que se hace acá.
  const datos = await cargarFinanzas();
  const completo = datos.balance;
  const balance = mes
    ? { ...completo, meses: completo.meses.filter((m) => m.mes === mes) }
    : completo;

  const vista = leerVista(vistaParam);
  const disponibles = monedasConDatos(completo, datos);
  const moneda = leerMoneda(monedaParam, disponibles);

  return (
    <>
      <PageHeader
        title="Finanzas"
        description="Ingresos, egresos y balance de Landing Pages"
        actions={
          <>
            <Suspense fallback={null}>
              {vista === "resumen" && (
                <FiltroMesFinanzas meses={completo.mesesDisponibles} actual={mes} />
              )}
              <SelectorMoneda opciones={disponibles} actual={moneda} />
            </Suspense>
            <ExportarFinanzas />
          </>
        }
      />

      <FinanzasTabs actual={vista} mes={mes} moneda={moneda} />

      {/* Todo sale de cotizaciones, acuerdos y gastos: no hay movimientos
          espejo, así que ningún importe se cuenta dos veces. */}
      {vista === "resumen" && (
        <ResumenVista datos={datos} completo={completo} balance={balance} moneda={moneda} mes={mes} />
      )}
      {vista === "cotizaciones" && <CotizacionesVista datos={datos} moneda={moneda} />}
      {vista === "egresos" && <EgresosVista datos={datos} moneda={moneda} />}
      {vista === "gastos" && <GastosVista datos={datos} moneda={moneda} />}
    </>
  );
}
