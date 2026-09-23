"use client";

import { useState } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
  Textarea,
} from "@/components/landing/dialogo-form";
import { borrarRecurso, guardarRecurso } from "@/app/landing-pages/acciones";
import {
  TIPOS_RECURSO,
  LABEL_TIPO_RECURSO,
  type Recurso,
  type TipoRecurso,
} from "@/lib/landing/tipos";

function RecursoForm({
  projectId,
  recurso,
}: {
  projectId: string;
  recurso?: Recurso;
}) {
  const editar = Boolean(recurso);

  return (
    <DialogoForm
      titulo={editar ? "Editar recurso" : "Nuevo recurso"}
      etiquetaAbrir="Nuevo recurso"
      action={guardarRecurso}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      <input type="hidden" name="project_id" value={projectId} />
      {recurso && <input type="hidden" name="id" value={recurso.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Nombre">
          <Input name="name" required defaultValue={recurso?.name ?? ""} />
        </Campo>

        <Campo label="Tipo">
          <Select name="kind" defaultValue={recurso?.kind ?? "otro"}>
            {TIPOS_RECURSO.map((k) => (
              <option key={k} value={k}>
                {LABEL_TIPO_RECURSO[k]}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo label="URL">
        <Input
          name="url"
          placeholder="https://…"
          defaultValue={recurso?.url ?? ""}
        />
      </Campo>

      <Campo label="Notas">
        <Textarea name="notes" rows={2} defaultValue={recurso?.notes ?? ""} />
      </Campo>
    </DialogoForm>
  );
}

export function Recursos({
  projectId,
  recursos,
}: {
  projectId: string;
  recursos: Recurso[];
}) {
  const [filtro, setFiltro] = useState<TipoRecurso | "todos">("todos");

  const presentes = TIPOS_RECURSO.filter((k) =>
    recursos.some((r) => r.kind === k),
  );
  const visibles =
    filtro === "todos" ? recursos : recursos.filter((r) => r.kind === filtro);

  const CHIP = "rounded-md px-2 py-1 text-xs transition-colors";

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold">Recursos del proyecto</h2>
        <RecursoForm projectId={projectId} />
      </div>

      {presentes.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`${CHIP} ${filtro === "todos" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
          >
            Todo
          </button>
          {presentes.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFiltro(k)}
              className={`${CHIP} ${filtro === k ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
            >
              {LABEL_TIPO_RECURSO[k]}
            </button>
          ))}
        </div>
      )}

      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {visibles.length === 0 && (
          <p className="px-4 py-6 text-sm text-text-3">
            Sin recursos cargados.
          </p>
        )}
        {visibles.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <span className="flex min-w-0 items-center gap-2">
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  <span className="truncate">{r.name}</span>
                  <ExternalLink className="size-3 shrink-0 text-text-3" />
                </a>
              ) : (
                <span className="truncate text-sm font-medium">{r.name}</span>
              )}
              <span className="shrink-0 text-[0.6875rem] text-text-3">
                {LABEL_TIPO_RECURSO[r.kind]}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-3">
              {r.notes && (
                <span className="hidden max-w-55 truncate text-xs text-text-3 md:block">
                  {r.notes}
                </span>
              )}
              <RecursoForm projectId={projectId} recurso={r} />
              <BorrarBoton
                etiqueta="Borrar recurso"
                onConfirmar={() => borrarRecurso(r.id, projectId)}
              />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
