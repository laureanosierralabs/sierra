"use client";

import { useId, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/common/charts/chart-card";
import { ChartEmpty } from "@/components/common/charts/chart-empty";
import { ChartTooltipBox } from "@/components/common/charts/chart-tooltip";
import {
  AXIS_TICK,
  TOOLTIP_CURSOR_LINE,
  compactNumber,
  type ChartDatum,
  type ChartSeries,
} from "@/components/common/charts/chart-theme";
import { ChartContainer } from "@/components/tailgrids/core/chart";

interface AreaChartCardProps {
  title: string;
  description?: string;
  data: ChartDatum[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  formatValue?: (value: number) => string;
  /** Formatea el título del tooltip (por ejemplo, el día 3 pasa a "3 de octubre"). */
  formatLabel?: (label: string) => string;
  action?: ReactNode;
  footer?: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  /** Muestra solo algunas marcas del eje X (útil con 30 puntos). */
  xTickInterval?: number | "preserveStartEnd";
}

/** Área con degradé suave por serie, como el "sales chart" del template. */
export function AreaChartCard({
  title,
  description,
  data,
  xKey,
  series,
  height = 270,
  formatValue = String,
  formatLabel,
  action,
  footer,
  isEmpty = false,
  emptyMessage,
  xTickInterval = "preserveStartEnd",
}: AreaChartCardProps) {
  // useId devuelve ":r1:"; los dos puntos rompen la referencia url(#...) en SVG.
  const baseId = useId().replace(/:/g, "");

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
          <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`${baseId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              dy={10}
              interval={xTickInterval}
              minTickGap={16}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={48}
              tickFormatter={(value: number) => compactNumber(value)}
            />
            <Tooltip
              cursor={TOOLTIP_CURSOR_LINE}
              content={<ChartTooltipBox formatValue={formatValue} formatLabel={formatLabel} />}
            />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#${baseId}-${s.key})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: s.color,
                  stroke: "var(--color-card-background)",
                  strokeWidth: 2,
                }}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
