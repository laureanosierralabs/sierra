import type { TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

type ChartTooltipProps = Partial<TooltipContentProps<ValueType, NameType>> & {
  /** Formatea cada valor (por defecto, el número tal cual). */
  formatValue?: (value: number) => string;
  /** Formatea el título (por defecto, la etiqueta del eje). */
  formatLabel?: (label: string) => string;
  /** Muestra el porcentaje sobre el total (donut). */
  showPercent?: boolean;
};

/** Cajita de tooltip común a todos los gráficos, con el estilo del template. */
export function ChartTooltipBox({
  active,
  payload,
  label,
  formatValue = String,
  formatLabel,
  showPercent,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const total = showPercent
    ? payload.reduce((n, entry) => n + Number(entry.value ?? 0), 0)
    : 0;
  const title = label !== undefined && label !== "" ? String(label) : undefined;

  return (
    <div className="rounded-xl border border-card-border bg-card-background p-3 shadow-md">
      {title && (
        <p className="mb-1.5 text-xs font-semibold text-text-primary">
          {formatLabel ? formatLabel(title) : title}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((entry, index) => {
          const value = Number(entry.value ?? 0);
          const color =
            (entry.payload as { color?: string } | undefined)?.color ?? entry.color ?? entry.fill;
          return (
            <li key={`${entry.dataKey ?? entry.name}-${index}`} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-text-secondary">{entry.name}</span>
              <span className="ml-auto pl-3 font-semibold text-text-primary tabular-nums">
                {formatValue(value)}
                {showPercent && total > 0 && (
                  <span className="ml-1.5 font-normal text-text-tertiary">
                    {Math.round((value / total) * 100)}%
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
