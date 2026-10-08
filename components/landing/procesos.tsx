import { Layers2 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { ProcesoForm } from "@/components/landing/proceso-form";
import { ProcesoTareaFila } from "@/components/landing/proceso-tarea-fila";
import { TareaProcesoForm } from "@/components/landing/tarea-proceso-form";
import { Card } from "@/components/tailgrids/core/card";
import {
  TabContent,
  TabList,
  TabRoot,
  TabTrigger,
} from "@/components/tailgrids/core/tabs";
import type { Proceso, TareaProceso } from "@/lib/landing/tipos";

function ProcesoDetalle({
  proceso,
  tareas,
}: {
  proceso: Proceso;
  tareas: TareaProceso[];
}) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-title-50">
            <Layers2 className="size-4 text-text-tertiary" />
            {proceso.name}
          </h2>
          {proceso.description && (
            <p className="mt-1 text-xs text-text-tertiary">{proceso.description}</p>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-3">
          <ProcesoForm proceso={proceso} />
          <TareaProcesoForm processId={proceso.id} />
        </span>
      </div>

      <Card className="divide-y divide-card-border overflow-hidden p-0">
        {tareas.length === 0 && (
          <EmptyState variant="inline" className="px-4 py-8 text-center">
            Este proceso todavía no tiene tareas. Agregá la primera.
          </EmptyState>
        )}

        {tareas.map((t, i) => (
          <ProcesoTareaFila key={t.id} processId={proceso.id} posicion={i + 1} tarea={t} />
        ))}
      </Card>

      <p className="mt-3 text-xs text-text-tertiary">
        Estas tareas se copian a cada proyecto nuevo que use este proceso. Editarlas no
        afecta proyectos ya creados.
      </p>
    </>
  );
}

export function Procesos({
  procesos,
  tareasPorProceso,
}: {
  procesos: Proceso[];
  tareasPorProceso: Record<string, TareaProceso[]>;
}) {
  if (procesos.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay procesos"
        description="Un proceso agrupa las tareas que se copian a cada proyecto nuevo."
        action={<ProcesoForm />}
      />
    );
  }

  return (
    <TabRoot
      defaultValue={procesos[0].id}
      variant="minimal"
      className="border-0 px-0 pt-0"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <TabList>
          {procesos.map((p) => (
            <TabTrigger
              key={p.id}
              value={p.id}
              badge={String((tareasPorProceso[p.id] ?? []).length)}
            >
              {p.name}
            </TabTrigger>
          ))}
        </TabList>
        <ProcesoForm />
      </div>

      {procesos.map((p) => (
        <TabContent key={p.id} value={p.id} className="px-0 py-4">
          <ProcesoDetalle proceso={p} tareas={tareasPorProceso[p.id] ?? []} />
        </TabContent>
      ))}
    </TabRoot>
  );
}
