import type { ReactNode } from "react";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

interface ChartCardProps {
  title: string;
  description?: string;
  /** Slot a la derecha del título (selector de período, badge). */
  action?: ReactNode;
  /** Nota al pie, por ejemplo la advertencia de estimación parcial. */
  footer?: ReactNode;
  /** Altura del cuerpo en px; los gráficos necesitan una altura explícita. */
  height?: number;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Carcasa común de los gráficos: encabezado con borde, cuerpo con altura fija y pie opcional. */
export function ChartCard({
  title,
  description,
  action,
  footer,
  height = 270,
  className,
  bodyClassName,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("p-0", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border px-6 py-4">
        <div className="min-w-0">
          <h3 className="text-base font-medium text-text-primary">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn("p-6", bodyClassName)}>
        <div className="w-full" style={{ height }}>
          {children}
        </div>
        {footer && <div className="mt-3 text-xs text-text-tertiary">{footer}</div>}
      </div>
    </Card>
  );
}
