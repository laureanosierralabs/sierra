"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts";
import { ChartCard } from "@/components/common/charts/chart-card";
import { ChartEmpty } from "@/components/common/charts/chart-empty";
import { ChartTooltipBox } from "@/components/common/charts/chart-tooltip";
import { AXIS_TICK, compactNumber, paletteColor } from "@/components/common/charts/chart-theme";
import { ChartContainer } from "@/components/tailgrids/core/chart";

export interface HorizontalBarDatum {
  name: string;
  value: number;
  color?: string;
}

interface HorizontalBarChartCardProps {
  title: string;
  description?: string;
  data: HorizontalBarDatum[];
  /** Nombre de la serie en el tooltip (por ejemplo "Saldo (USD)"). */
  valueLabel: string;
  formatValue?: (value: number) => string;
  /** Alto por barra en px; el alto total se calcula con la cantidad de filas. */
  rowHeight?: number;
  action?: ReactNode;
  footer?: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
}

function BarShape(props: BarShapeProps) {
  const color = (props.payload as { color?: string } | undefined)?.color;
  return <Rectangle {...props} fill={color ?? paletteColor(0)} radius={[0, 4, 4, 0]} />;
}

/** Ranking horizontal: una barra por categoría, en el orden en que llegan los datos. */
export function HorizontalBarChartCard({
  title,
  description,
  data,
  valueLabel,
  formatValue = String,
  rowHeight = 44,
  action,
  footer,
  isEmpty = false,
  emptyMessage,
}: HorizontalBarChartCardProps) {
  const rows = data.map((row, index) => ({ ...row, color: row.color ?? paletteColor(index) }));
  const height = Math.max(150, rows.length * rowHeight + 32);

  return (
    <ChartCard
      title={title}
      description={description}
      action={action}
      footer={footer}
      height={height}
    >
      {isEmpty || rows.length === 0 ? (
        <ChartEmpty message={emptyMessage} />
      ) : (
        <ChartContainer className="h-full w-full" height="100%" width="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              tickFormatter={(value: number) => compactNumber(value)}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={110}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={<ChartTooltipBox formatValue={formatValue} />}
            />
            <Bar dataKey="value" name={valueLabel} shape={BarShape} maxBarSize={20} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
