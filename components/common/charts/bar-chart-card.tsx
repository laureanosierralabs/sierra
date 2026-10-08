"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/common/charts/chart-card";
import { ChartEmpty } from "@/components/common/charts/chart-empty";
import { ChartTooltipBox } from "@/components/common/charts/chart-tooltip";
import {
  AXIS_TICK,
  compactNumber,
  type ChartDatum,
  type ChartSeries,
} from "@/components/common/charts/chart-theme";
import { ChartContainer } from "@/components/tailgrids/core/chart";

interface BarChartCardProps {
  title: string;
  description?: string;
  data: ChartDatum[];
  /** Clave del eje X (por ejemplo `etiqueta`). */
  xKey: string;
  series: ChartSeries[];
  /** Apila las series en una sola barra en vez de agruparlas. */
  stacked?: boolean;
  height?: number;
  formatValue?: (value: number) => string;
  action?: ReactNode;
  footer?: ReactNode;
  /** `true` cuando no hay nada que graficar (todo en cero). */
  isEmpty?: boolean;
  emptyMessage?: string;
}

/** Barras agrupadas o apiladas con el estilo "bar chart" del template. */
export function BarChartCard({
  title,
  description,
  data,
  xKey,
  series,
  stacked = false,
  height = 270,
  formatValue = String,
  action,
  footer,
  isEmpty = false,
  emptyMessage,
}: BarChartCardProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      action={action}
      footer={footer}
      height={height}
    >
      {isEmpty ? (
        <ChartEmpty message={emptyMessage} />
      ) : (
        <ChartContainer className="h-full w-full" height="100%" width="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={AXIS_TICK} dy={10} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={48}
              tickFormatter={(value: number) => compactNumber(value)}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={<ChartTooltipBox formatValue={formatValue} />}
            />
            {series.length > 1 && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: 12 }}
                formatter={(value: string) => (
                  <span className="text-text-secondary">{value}</span>
                )}
              />
            )}
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                stackId={stacked ? "stack" : undefined}
                radius={stacked ? 0 : [4, 4, 0, 0]}
                maxBarSize={24}
              />
            ))}
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
