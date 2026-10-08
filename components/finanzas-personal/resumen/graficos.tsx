"use client";

import { AreaChartCard } from "@/components/common/charts/area-chart-card";
import { BarChartCard } from "@/components/common/charts/bar-chart-card";
import { CHART_COLORS } from "@/components/common/charts/chart-theme";
import { DonutChartCard } from "@/components/common/charts/donut-chart-card";
import { money } from "@/lib/personal-finance";
import {
  monthLongLabel,
  type CategorySlice,
  type MonthlyPoint,
} from "@/lib/personal-finance-stats";

const formatUsd = (value: number) => money(value, "USD");
const PARCIAL = "Estimación parcial: los movimientos sin conversión histórica a USD no se incluyen.";

export function GraficoIngresosGastos({ points }: { points: MonthlyPoint[] }) {
  return (
    <BarChartCard
      title="Ingresos vs. gastos"
      description="Últimos 12 meses · USD históricos de lo efectivamente cobrado y pagado"
      data={points}
      xKey="etiqueta"
      series={[
        { key: "ingresos", name: "Ingresos", color: CHART_COLORS.income },
        { key: "gastos", name: "Gastos", color: CHART_COLORS.expense },
      ]}
      formatValue={formatUsd}
      isEmpty={points.every((p) => p.ingresos === 0 && p.gastos === 0)}
      emptyMessage="Todavía no hay ingresos ni gastos registrados. Usá «+ Ingreso» o «+ Gasto»."
      footer={points.some((p) => p.parcial) ? PARCIAL : undefined}
    />
  );
}

export function GraficoNeto({ points }: { points: MonthlyPoint[] }) {
  return (
    <AreaChartCard
      title="Resultado neto mensual"
      description="Ingresos menos gastos de cada mes, en USD"
      data={points}
      xKey="etiqueta"
      series={[{ key: "neto", name: "Neto", color: CHART_COLORS.net }]}
      formatValue={formatUsd}
      isEmpty={points.every((p) => p.neto === 0)}
      emptyMessage="El resultado neto aparece cuando hay movimientos registrados."
      xTickInterval={0}
      footer={points.some((p) => p.parcial) ? PARCIAL : undefined}
    />
  );
}

interface GraficoCategoriasProps {
  month: string;
  items: CategorySlice[];
  total: number;
  parcial: boolean;
}

export function GraficoCategorias({ month, items, total, parcial }: GraficoCategoriasProps) {
  return (
    <DonutChartCard
      title="Gastos por categoría"
      description={`${monthLongLabel(month)} · USD históricos de los gastos pagados`}
      data={items}
      centerValue={money(total, "USD")}
      centerLabel="Gastos"
      formatValue={formatUsd}
      isEmpty={items.length === 0}
      emptyMessage="Sin gastos pagados en este mes. Las categorías aparecen al registrar el primer gasto."
      footer={
        parcial
          ? "Distribución parcial: los gastos sin conversión histórica no entran en los porcentajes."
          : undefined
      }
    />
  );
}
