import type { ReactNode } from "react";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

type KpiTone = "primary" | "success" | "warning" | "error" | "blue" | "violet" | "orange" | "gray";

/* Clases literales: Tailwind no genera las que se arman en runtime. */
const TONE_ICON: Record<KpiTone, string> = {
  primary: "bg-badge-primary-background text-badge-primary-icon-color",
  success: "bg-badge-success-background text-badge-success-icon-color",
  warning: "bg-badge-warning-background text-badge-warning-icon-color",
  error: "bg-badge-error-background text-badge-error-icon-color",
  blue: "bg-badge-blue-background text-badge-blue-icon-color",
  violet: "bg-badge-violet-background text-badge-violet-icon-color",
  orange: "bg-badge-orange-background text-badge-orange-icon-color",
  gray: "bg-badge-neutral-background text-badge-neutral-icon-color",
};

interface KpiDelta {
  /** Texto ya formateado, por ejemplo "+12%". */
  value: string;
  positive: boolean;
}

interface KpiCardProps {
  label: string;
  value: ReactNode;
  delta?: KpiDelta;
  /** Línea chica debajo del valor (contexto, período). */
  hint?: string;
  icon?: ReactNode;
  tone?: KpiTone;
  className?: string;
}

/** Tarjeta de métrica, basada en la de "overview stats" del template. */
export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon,
  tone = "primary",
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8 items-center justify-center rounded-lg [&>svg]:size-5",
            TONE_ICON[tone],
          )}
        >
          {icon}
        </span>
      )}
      <div className="text-xl leading-7 font-semibold text-text-primary tabular-nums md:text-2xl md:leading-8">
        {value}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm leading-5 font-medium text-text-tertiary">{label}</span>
        {delta && (
          <span
            className={cn(
              "text-sm leading-5 font-medium",
              delta.positive ? "text-success-500" : "text-error-500",
            )}
          >
            {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="-mt-2 text-xs text-text-tertiary">{hint}</p>}
    </Card>
  );
}
