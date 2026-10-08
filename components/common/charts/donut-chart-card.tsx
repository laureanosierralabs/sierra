"use client";

import type { ReactNode } from "react";
import { Label, Pie, PieChart, Sector, Tooltip, type PieSectorShapeProps } from "recharts";
import { ChartCard } from "@/components/common/charts/chart-card";
import { ChartEmpty } from "@/components/common/charts/chart-empty";
import { ChartTooltipBox } from "@/components/common/charts/chart-tooltip";
import { paletteColor } from "@/components/common/charts/chart-theme";
import { ChartContainer } from "@/components/tailgrids/core/chart";

export interface DonutSlice {
  name: string;
  value: number;
  /** Variable CSS de color; si falta se toma de la paleta por posición. */
  color?: string;
}

interface DonutChartCardProps {
  title: string;
  description?: string;
  data: DonutSlice[];
  /** Texto grande al centro (por ejemplo el total ya formateado). */
  centerValue: string;
  centerLabel: string;
  height?: number;
  formatValue?: (value: number) => string;
  action?: ReactNode;
  footer?: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
}

function SliceShape(props: PieSectorShapeProps) {
  const color = (props.payload as { color?: string } | undefined)?.color;
  return <Sector {...props} fill={color ?? paletteColor(0)} />;
}

/** Dona con total al centro y leyenda manual (nombre y porcentaje). */
export function DonutChartCard({
  title,
  description,
  data,
  centerValue,
  centerLabel,
  height = 300,
  formatValue = String,
  action,
  footer,
  isEmpty = false,
  emptyMessage,
}: DonutChartCardProps) {
  const slices = data.map((slice, index) => ({
    ...slice,
    color: slice.color ?? paletteColor(index),
  }));
  const total = slices.reduce((n, slice) => n + slice.value, 0);

  return (
    <ChartCard
      title={title}
      description={description}
      action={action}
      footer={footer}
      height={height}
    >
      {isEmpty || slices.length === 0 ? (
        <ChartEmpty message={emptyMessage} />
      ) : (
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">
            <ChartContainer className="h-full w-full" height="100%" width="100%">
              <PieChart>
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={<ChartTooltipBox formatValue={formatValue} showPercent />}
                />
                <Pie
                  data={slices}
                  cx="50%"
                  cy="50%"
                  innerRadius="72%"
                  outerRadius="92%"
                  paddingAngle={slices.length > 1 ? 2 : 0}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  shape={SliceShape}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            <tspan
                              x={viewBox.cx}
                              dy="-0.3em"
                              className="fill-text-primary text-[20px] font-semibold tracking-[-0.2px]"
                            >
                              {centerValue}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              dy="1.4em"
                              className="fill-text-tertiary text-sm font-normal tracking-[-0.15px]"
                            >
                              {centerLabel}
                            </tspan>
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>

          <ul className="mt-3 grid max-h-24 grid-cols-1 gap-x-5 gap-y-1.5 overflow-y-auto sm:grid-cols-2">
            {slices.map((slice) => (
              <li key={slice.name} className="flex items-center gap-1.5 text-xs">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-xs"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate font-medium text-text-secondary">{slice.name}</span>
                <span className="ml-auto pl-2 text-text-tertiary tabular-nums">
                  {total > 0 ? `${Math.round((slice.value / total) * 100)}%` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
