import { BarChart2 } from "@tailgrids/icons";
import { cn } from "@/utils/cn";

/** Reemplaza al gráfico cuando no hay datos que mostrar. */
export function ChartEmpty({
  message = "Todavía no hay datos para graficar.",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-text-tertiary",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full bg-badge-neutral-background text-badge-neutral-icon-color [&>svg]:size-5"
      >
        <BarChart2 />
      </span>
      <p className="max-w-xs">{message}</p>
    </div>
  );
}
