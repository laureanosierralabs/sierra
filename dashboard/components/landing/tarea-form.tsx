"use client";

import { Pencil } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
  Textarea,
} from "@/components/landing/dialogo-form";
import { guardarTarea } from "@/app/landing-pages/acciones";
import {
  ESTADOS_TAREA,
  PRIORIDADES,
  LABEL_ESTADO_TAREA,
  LABEL_PRIORIDAD,
  type Miembro,
  type Proyecto,
  type Tarea,
} from "@/lib/landing/tipos";

export function TareaForm({
  miembros,
  proyectos,
  tarea,
  abiertoExterno,
  onCerrar,
  proyectoFijo,
}: {
  miembros: Miembro[];
  proyectos: Pick<Proyecto, "id" | "name">[];
  tarea?: Tarea;
  abiertoExterno?: boolean;
  onCerrar?: () => void;
  /** Precarga el proyecto al crear una tarea desde su propia pantalla. */
  proyectoFijo?: string;
}) {
  const editar = Boolean(tarea);

  return (
    <DialogoForm
      titulo={editar ? "Editar tarea" : "Nueva tarea"}
      etiquetaAbrir="Nueva tarea"
      action={guardarTarea}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
      abiertoExterno={abiertoExterno}
      onCerrar={onCerrar}
    >
      {tarea && <input type="hidden" name="id" value={tarea.id} />}

      <Campo label="Tarea">
        <Input name="title" required defaultValue={tarea?.title ?? ""} />
      </Campo>

      <Campo label="Proyecto">
        <Select
          name="project_id"
          defaultValue={tarea?.project_id ?? proyectoFijo ?? ""}
        >
          <option value="">Sin proyecto</option>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Estado">
          <Select name="status" defaultValue={tarea?.status ?? "pendiente"}>
            {ESTADOS_TAREA.map((e) => (
              <option key={e} value={e}>
                {LABEL_ESTADO_TAREA[e]}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo label="Prioridad">
          <Select name="priority" defaultValue={tarea?.priority ?? "media"}>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {LABEL_PRIORIDAD[p]}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Responsable">
          <Select name="assigned_to" defaultValue={tarea?.assigned_to ?? ""}>
            <option value="">Sin asignar</option>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo label="Deadline">
          <Input
            type="date"
            name="due_date"
            defaultValue={tarea?.due_date ?? ""}
          />
        </Campo>
      </div>

      <Campo label="Descripción">
        <Textarea
          name="description"
          rows={3}
          defaultValue={tarea?.description ?? ""}
        />
      </Campo>
    </DialogoForm>
  );
}
