import type { ReactNode } from "react";
import { Folder1 } from "@tailgrids/icons";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  title?: string;
  description?: string;
  /** Texto libre; alternativa a `description` para contenido con formato. */
  children?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  /**
   * `card`: bloque autónomo con ícono. `inline`: solo texto, para usar dentro
   * de una Card o de una celda de tabla sin anidar tarjetas.
   */
  variant?: "card" | "inline";
  className?: string;
}

export function EmptyState({
  title,
  description,
  children,
  icon,
  action,
  variant = "card",
  className,
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("text-sm text-text-tertiary", className)}>
        {title && <p className="font-medium text-text-secondary">{title}</p>}
        {description && <p>{description}</p>}
        {children}
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  return (
    <Card className={cn("flex flex-col items-center gap-3 py-10 text-center", className)}>
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-full bg-badge-neutral-background text-badge-neutral-icon-color [&>svg]:size-5"
      >
        {icon ?? <Folder1 />}
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        {title && <p className="font-semibold text-text-primary">{title}</p>}
        {description && <p className="text-sm text-text-secondary">{description}</p>}
        {children && <div className="text-sm text-text-secondary">{children}</div>}
      </div>
      {action}
    </Card>
  );
}
