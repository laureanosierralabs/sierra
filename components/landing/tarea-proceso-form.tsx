"use client";

import { Pencil1 } from "@tailgrids/icons";
import { guardarTareaProceso } from "@/app/landing-pages/acciones";
import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { tareaProcesoEsquema } from "@/components/landing/procesos-esquemas";
import { PLANTILLAS } from "@/lib/landing/plantillas";
import type { Paso, TareaProceso } from "@/lib/landing/tipos";

/** El Select de React Aria no admite una opción de valor vacío: se usa este centinela. */
const SIN_FORMULARIO = "__sin-formulario__";

const OPCIONES_FORMULARIO = [
  { value: SIN_FORMULARIO, label: "Sin formulario" },
  ...Object.values(PLANTILLAS).map((p) => ({ value: p.id, label: p.nombre })),
];

/** Mismo FormData que antes: "sin formulario" viaja como cadena vacía. */
function guardar(fd: FormData) {
  if (fd.get("template") === SIN_FORMULARIO) fd.set("template", "");
  return guardarTareaProceso(fd);
}

/** Pasos a texto editable: una línea por paso, sub-items con sangría. */
function pasosATexto(pasos: Paso[]): string {
  return pasos
    .flatMap((p) => [p.texto, ...(p.hijos ?? []).map((h) => `  ${h}`)])
    .join("\n");
}

export function TareaProcesoForm({
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
      action={guardar}
      schema={tareaProcesoEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          <input type="hidden" name="process_id" value={processId} />
          {tarea && <input type="hidden" name="id" value={tarea.id} />}

          <FormTextField
            {...form.fieldProps("title")}
            label="Título"
            required
            defaultValue={tarea?.title ?? ""}
          />

          <FormSelectField
            {...form.fieldProps("template")}
            label="Formulario"
            options={OPCIONES_FORMULARIO}
            defaultValue={tarea?.template ?? SIN_FORMULARIO}
          />

          <FormTextAreaField
            {...form.fieldProps("steps")}
            label="Pasos del checklist"
            rows={10}
            placeholder={"Un paso por línea\nCon dos espacios al inicio queda como sub-paso"}
            defaultValue={tarea ? pasosATexto(tarea.steps) : ""}
          />

          <FormTextAreaField
            {...form.fieldProps("notes")}
            label="Notas del procedimiento"
            rows={3}
            defaultValue={tarea?.notes ?? ""}
          />
        </>
      )}
    </DialogoForm>
  );
}
