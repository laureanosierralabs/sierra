"use client";

import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import type { ZodFormApi } from "@/components/landing/dialogo-form";
import { SelectorMiembros } from "@/components/landing/selector-miembros";
import {
  ESTADOS_TAREA,
  LABEL_ESTADO_TAREA,
  LABEL_PRIORIDAD,
  PRIORIDADES,
  type Miembro,
  type Proyecto,
  type Tarea,
} from "@/lib/landing/tipos";

/** El Select de React Aria no admite una opción de valor vacío: se usa este centinela. */
export const SIN_PROYECTO = "__sin-proyecto__";

const OPCIONES_ESTADO = ESTADOS_TAREA.map((e) => ({
  value: e,
  label: LABEL_ESTADO_TAREA[e],
}));

const OPCIONES_PRIORIDAD = PRIORIDADES.map((p) => ({
  value: p,
  label: LABEL_PRIORIDAD[p],
}));

export function TareaCampos({
  form,
  miembros,
  proyectos,
  tarea,
  proyectoFijo,
}: {
  form: ZodFormApi;
  miembros: Miembro[];
  proyectos: Pick<Proyecto, "id" | "name">[];
  tarea?: Tarea;
  proyectoFijo?: string;
}) {
  const opcionesProyecto = [
    { value: SIN_PROYECTO, label: "Sin proyecto" },
    ...proyectos.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <>
      {tarea && <input type="hidden" name="id" value={tarea.id} />}

      <FormTextField
        {...form.fieldProps("title")}
        label="Tarea"
        required
        defaultValue={tarea?.title ?? ""}
      />

      <FormSelectField
        {...form.fieldProps("project_id")}
        label="Proyecto"
        options={opcionesProyecto}
        defaultValue={tarea?.project_id ?? proyectoFijo ?? SIN_PROYECTO}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          {...form.fieldProps("status")}
          label="Estado"
          options={OPCIONES_ESTADO}
          defaultValue={tarea?.status ?? "pendiente"}
        />
        <FormSelectField
          {...form.fieldProps("priority")}
          label="Prioridad"
          options={OPCIONES_PRIORIDAD}
          defaultValue={tarea?.priority ?? "media"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-input-label-text">Responsables</span>
        <SelectorMiembros miembros={miembros} defaultValue={tarea?.assignee_ids} />
      </div>

      <FormTextField
        {...form.fieldProps("due_date")}
        type="date"
        label="Deadline"
        defaultValue={tarea?.due_date ?? ""}
      />

      <FormTextAreaField
        {...form.fieldProps("description")}
        label="Descripción"
        rows={3}
        defaultValue={tarea?.description ?? ""}
      />
    </>
  );
}
