"use client";

import { BarChartCard } from "@/components/common/charts/bar-chart-card";
import { CHART_COLORS } from "@/components/common/charts/chart-theme";
import type { PuntoCobrado } from "@/lib/inicio";
import { formatearMonto } from "@/lib/landing/tipos";

const formatoUsd = (valor: number) => formatearMonto(valor, "USD");

export function GraficoCobrado({ puntos }: { puntos: PuntoCobrado[] }) {
  return (
    <BarChartCard
      title="Cobrado por mes"
      description={`Últimos ${puntos.length} meses · USD, solo pagos registrados`}
      data={puntos}
      xKey="etiqueta"
      series={[{ key: "cobrado", name: "Cobrado", color: CHART_COLORS.income }]}
      formatValue={formatoUsd}
      height={220}
      isEmpty={puntos.every((p) => p.cobrado === 0)}
      emptyMessage="Todavía no hay cobros en USD en este período."
    />
  );
}
