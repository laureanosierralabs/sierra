"use client";

import { useState } from "react";
import { Pencil, Workflow } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
  Textarea,
} from "@/components/landing/dialogo-form";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import {
  borrarTareaProceso,
  guardarProceso,
  guardarTareaProceso,
} from "@/app/landing-pages/acciones";
import { PLANTILLAS } from "@/lib/landing/plantillas";
import type { Paso, Proceso, TareaProceso } from "@/lib/landing/tipos";

/** Pasos a texto editable: una línea por paso, sub-items con sangría. */
function pasosATexto(pasos: Paso[]): string {
  return pasos
    .flatMap((p) => [p.texto, ...(p.hijos ?? []).map((h) => `  ${h}`)])
    .join("\n");
}

function contarPasos(pasos: Paso[]): number {
  return pasos.reduce((n, p) => n + 1 + (p.hijos?.length ?? 0), 0);
}

function ProcesoForm({ proceso }: { proceso?: Proceso }) {
  const editar = Boolean(proceso);

  return (
    <DialogoForm
      titulo={editar ? "Editar proceso" : "Nuevo proceso"}
      etiquetaAbrir="Nuevo proceso"
      action={guardarProceso}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      {proceso && <input type="hidden" name="id" value={proceso.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Nombre">
          <Input name="name" required defaultValue={proceso?.name ?? ""} />
        </Campo>

        <Campo label="Identificador">
          <Input
            name="slug"
            placeholder="wordpress, codigo…"
            defaultValue={proceso?.slug ?? ""}
          />
        </Campo>
      </div>

      <Campo label="Descripción">
        <Textarea
          name="description"
          rows={2}
          defaultValue={proceso?.description ?? ""}
        />
      </Campo>
    </DialogoForm>
  );
}

function TareaProcesoForm({
  processId,
  tarea,
}: {
  processId: string;
  tarea?: TareaProceso;
}) {
  const editar = Boolean(tarea);

  return (
    <DialogoForm
      titulo={editar ? "Editar tarea del proceso" : "Nueva tarea del proceso"}
      etiquetaAbrir="Nueva tarea"
      action={guardarTareaProceso}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      <input type="hidden" name="process_id" value={processId} />
      {tarea && <input type="hidden" name="id" value={tarea.id} />}

      <Campo label="Título">
        <Input name="title" required defaultValue={tarea?.title ?? ""} />
      </Campo>

      <Campo label="Formulario">
        <Select name="template" defaultValue={tarea?.template ?? ""}>
          <option value="">Sin formulario</option>
          {Object.values(PLANTILLAS).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </Campo>

      <Campo label="Pasos del checklist">
        <Textarea
          name="steps"
          rows={10}
          placeholder={"Un paso por línea\nCon dos espacios al inicio queda como sub-paso"}
          defaultValue={tarea ? pasosATexto(tarea.steps) : ""}
        />
      </Campo>

      <Campo label="Notas del procedimiento">
        <Textarea name="notes" rows={3} defaultValue={tarea?.notes ?? ""} />
      </Campo>
    </DialogoForm>
  );
}

export function Procesos({
  procesos,
  tareasPorProceso,
}: {
  procesos: Proceso[];
  tareasPorProceso: Record<string, TareaProceso[]>;
}) {
  const [activo, setActivo] = useState(procesos[0]?.id ?? "");
  const proceso = procesos.find((p) => p.id === activo);
  const tareas = tareasPorProceso[activo] ?? [];

  const CHIP = "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {procesos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivo(p.id)}
              className={`${CHIP} ${activo === p.id ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
            >
              {p.name}{" "}
              <span className="tnum text-text-3">
                {(tareasPorProceso[p.id] ?? []).length}
              </span>
            </button>
          ))}
        </div>
        <ProcesoForm />
      </div>

      {proceso && (
        <>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold">
                <Workflow className="size-4 text-text-3" />
                {proceso.name}
              </h2>
              {proceso.description && (
                <p className="mt-1 text-xs text-text-3">
                  {proceso.description}
                </p>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-3">
              <ProcesoForm proceso={proceso} />
              <TareaProcesoForm processId={proceso.id} />
            </span>
          </div>

          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {tareas.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-text-3">
                Este proceso todavía no tiene tareas. Agregá la primera.
              </p>
            )}

            {tareas.map((t, i) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-3 px-3 py-3 transition-colors hover:bg-surface-2"
              >
                <span className="flex min-w-0 items-start gap-3">
                  <span className="tnum mt-0.5 w-5 shrink-0 text-right text-xs text-text-3">
                    {i + 1}
                  </span>

                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{t.title}</span>
                      {t.template && (
                        <span className="rounded border border-idle/30 bg-idle-dim px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-idle">
                          formulario
                        </span>
                      )}
                      {t.steps.length > 0 && (
                        <span className="tnum text-[0.6875rem] text-text-3">
                          {contarPasos(t.steps)} pasos
                        </span>
                      )}
                    </span>

                    {t.steps.length > 0 && (
                      <p className="mt-1 truncate text-xs text-text-3">
                        {t.steps.map((p) => p.texto).join(" · ")}
                      </p>
                    )}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-3">
                  <TareaProcesoForm processId={proceso.id} tarea={t} />
                  <BorrarBoton
                    etiqueta="Quitar del proceso"
                    onConfirmar={() => borrarTareaProceso(t.id)}
                  />
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs text-text-3">
            Estas tareas se copian a cada proyecto nuevo que use este proceso.
            Editarlas no afecta proyectos ya creados.
          </p>
        </>
      )}
    </>
  );
}
