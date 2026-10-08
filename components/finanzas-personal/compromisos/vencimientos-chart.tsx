"use client";

import { BarChartCard } from "@/components/common/charts/bar-chart-card";
import { CHART_COLORS } from "@/components/common/charts/chart-theme";
import { money, type FinanceData } from "@/lib/personal-finance";
import { duesByMonth } from "@/lib/personal-finance-stats";

/** Vencimientos de los próximos 6 meses (USD): lo que hay que pagar y lo que se espera cobrar. */
export function VencimientosChart({ data }: { data: FinanceData }) {
  const dues = duesByMonth(data, 6);
  const notes: string[] = [];
  if (dues.overdue.count > 0)
    notes.push(
      `${dues.overdue.count} vencido${dues.overdue.count === 1 ? "" : "s"} antes de este mes (pagos ${money(dues.overdue.pagos, "USD")}, cobros ${money(dues.overdue.cobros, "USD")}).`,
    );
  if (dues.sinFecha > 0)
    notes.push(`${dues.sinFecha} sin fecha, fuera del gráfico.`);
  if (dues.parcial)
    notes.push("Estimación parcial: los montos sin conversión a USD no se incluyen.");

  return (
    <BarChartCard
      title="Vencimientos por mes"
      description="Próximos 6 meses · equivalente en USD"
      data={dues.buckets}
      xKey="etiqueta"
      series={[
        { key: "pagos", name: "A pagar", color: CHART_COLORS.expense },
        { key: "cobros", name: "A cobrar", color: CHART_COLORS.income },
      ]}
      height={240}
      formatValue={(value) => money(value, "USD")}
      isEmpty={dues.buckets.every((b) => b.pagos === 0 && b.cobros === 0)}
      emptyMessage="No hay vencimientos con fecha en los próximos 6 meses."
      footer={notes.length > 0 ? notes.join(" ") : undefined}
    />
  );
}
