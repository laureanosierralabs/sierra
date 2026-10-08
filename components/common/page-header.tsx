import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Slot a la derecha del título (botones, formularios de alta). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Encabezado de página: título, descripción y acciones. Las migas de pan ya
 * viven en el header del shell, no se duplican acá.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl leading-8 font-semibold tracking-[-0.2px] text-title-50">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm leading-5 text-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
