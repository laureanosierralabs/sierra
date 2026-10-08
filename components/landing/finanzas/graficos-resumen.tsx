"use client";

import { AreaChartCard } from "@/components/common/charts/area-chart-card";
import { BarChartCard } from "@/components/common/charts/bar-chart-card";
import { CHART_COLORS } from "@/components/common/charts/chart-theme";
import { DonutChartCard } from "@/components/common/charts/donut-chart-card";
import { HorizontalBarChartCard } from "@/components/common/charts/horizontal-bar-chart-card";
import type { Porcion, PuntoMensual } from "@/components/landing/finanzas/datos-graficos";
import { formatearMonto, type Moneda } from "@/lib/landing/tipos";

function formatoDe(moneda: Moneda) {
  return (valor: number) => formatearMonto(valor, moneda);
}

export function GraficoMensual({ puntos, moneda }: { puntos: PuntoMensual[]; moneda: Moneda }) {
  return (
    <BarChartCard
      title="Ingresos, costos y gastos por mes"
      description={`Últimos 12 meses con movimientos · ${moneda}, solo lo cobrado y pagado`}
      data={puntos}
      xKey="etiqueta"
      series={[
        { key: "ingresos", name: "Ingresos", color: CHART_COLORS.income },
        { key: "costos", name: "Equipo", color: CHART_COLORS.expense },
        { key: "gastos", name: "Gastos", color: CHART_COLORS.neutral },
      ]}
      formatValue={formatoDe(moneda)}
      isEmpty={puntos.every((p) => p.ingresos === 0 && p.costos === 0 && p.gastos === 0)}
      emptyMessage={`No hay movimientos en ${moneda}. Probá con otra moneda.`}
    />
  );
}

export function GraficoResultado({ puntos, moneda }: { puntos: PuntoMensual[]; moneda: Moneda }) {
  return (
    <AreaChartCard
      title="Resultado mensual"
      description={`Caja del mes y acumulada · ${moneda}`}
      data={puntos}
      xKey="etiqueta"
      series={[
        { key: "resultado", name: "Resultado del mes", color: CHART_COLORS.net },
        { key: "acumulado", name: "Acumulado", color: CHART_COLORS.income },
      ]}
      formatValue={formatoDe(moneda)}
      isEmpty={puntos.every((p) => p.resultado === 0)}
      emptyMessage={`El resultado aparece cuando hay movimientos en ${moneda}.`}
      xTickInterval={0}
      footer="El acumulado suma toda la caja desde el primer movimiento."
    />
  );
}

export function GraficoMargenProyectos({ filas, moneda }: { filas: Porcion[]; moneda: Moneda }) {
  return (
    <HorizontalBarChartCard
      title="Margen por proyecto"
      description={`Los 8 con mayor margen · ${moneda}`}
      data={filas.map((f) => ({
        ...f,
        color: f.value < 0 ? CHART_COLORS.expense : CHART_COLORS.income,
      }))}
      valueLabel={`Margen (${moneda})`}
      formatValue={formatoDe(moneda)}
      isEmpty={filas.length === 0}
      emptyMessage={`Ningún proyecto con ingreso asignado en ${moneda}.`}
      footer="Margen = ingreso asignado − costo del equipo. Sin costo cargado, el margen no es real."
    />
  );
}

export function GraficoIngresosCliente({ filas, moneda }: { filas: Porcion[]; moneda: Moneda }) {
  const total = filas.reduce((t, f) => t + f.value, 0);
  return (
    <DonutChartCard
      title="Ingresos por cliente"
      description={`Total cotizado, sin rechazadas ni canceladas · ${moneda}`}
      data={filas}
      centerValue={formatearMonto(total, moneda)}
      centerLabel="Cotizado"
      formatValue={formatoDe(moneda)}
      isEmpty={filas.length === 0}
      emptyMessage={`Sin cotizaciones en ${moneda}.`}
    />
  );
}
