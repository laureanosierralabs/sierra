"use client";

import { borrarTareaProceso } from "@/app/landing-pages/acciones";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { TareaProcesoForm } from "@/components/landing/tarea-proceso-form";
import { Badge } from "@/components/tailgrids/core/badge";
import type { Paso, TareaProceso } from "@/lib/landing/tipos";

function contarPasos(pasos: Paso[]): number {
  return pasos.reduce((n, p) => n + 1 + (p.hijos?.length ?? 0), 0);
}

export function ProcesoTareaFila({
  processId,
  posicion,
  tarea,
}: {
  processId: string;
  posicion: number;
  tarea: TareaProceso;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-background-gray-secondary">
      <span className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 w-5 shrink-0 text-right text-xs text-text-tertiary tabular-nums">
          {posicion}
        </span>

        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{tarea.title}</span>
            {tarea.template && <Badge color="blue">Formulario</Badge>}
            {tarea.steps.length > 0 && (
              <span className="text-xs text-text-tertiary tabular-nums">
                {contarPasos(tarea.steps)} pasos
              </span>
            )}
          </span>

          {tarea.steps.length > 0 && (
            <p className="mt-1 truncate text-xs text-text-tertiary">
              {tarea.steps.map((p) => p.texto).join(" · ")}
            </p>
          )}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <TareaProcesoForm processId={processId} tarea={tarea} />
        <BorrarBoton
          etiqueta="Quitar del proceso"
          onConfirmar={() => borrarTareaProceso(tarea.id)}
        />
      </span>
    </div>
  );
}
