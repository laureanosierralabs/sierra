import type { ReactNode } from "react";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

interface SeccionCardProps {
  title: string;
  description?: string;
  /** Slot a la derecha del título (link o botón). */
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Tarjeta de lista con el mismo encabezado que las de gráficos (borde inferior, título, acción). */
export function SeccionCard({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: SeccionCardProps) {
  return (
    <Card className={cn("p-0", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border px-6 py-4">
        <div className="min-w-0">
          <h3 className="text-base font-medium text-text-primary">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn("p-6", bodyClassName)}>{children}</div>
    </Card>
  );
}
