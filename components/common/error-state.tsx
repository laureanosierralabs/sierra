"use client";

import type { ReactNode } from "react";
import { InfoTriangle, RefreshCircle1Clockwise } from "@tailgrids/icons";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Identificador del error del servidor (`error.digest`), para cruzar con logs. */
  digest?: string;
  /** Reintento; en un error boundary pasar `unstable_retry`. Sin esto no hay botón. */
  onRetry?: () => void;
  /** Acción extra (por ejemplo, volver al inicio). */
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Algo salió mal",
  description = "No pudimos cargar esta sección. Probá de nuevo; si sigue fallando, avisá.",
  digest,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert">
    <Card className={cn("flex flex-col items-center gap-3 py-10 text-center", className)}>
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-full bg-badge-error-background text-badge-error-icon-color [&>svg]:size-5"
      >
        <InfoTriangle />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
        {digest && <p className="text-xs text-text-tertiary">Código: {digest}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button size="sm" onPress={onRetry}>
            <RefreshCircle1Clockwise />
            Reintentar
          </Button>
        )}
        {action}
      </div>
    </Card>
    </div>
  );
}
