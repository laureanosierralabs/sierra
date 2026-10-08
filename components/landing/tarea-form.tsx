"use client";

import { Pencil1 } from "@tailgrids/icons";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { SIN_PROYECTO, TareaCampos } from "@/components/landing/tarea-campos";
import { tareaEsquema } from "@/components/landing/tarea-esquema";
import { guardarTarea } from "@/app/landing-pages/acciones";
import type { Miembro, Proyecto, Tarea } from "@/lib/landing/tipos";

/** Mismo FormData que antes: "sin proyecto" viaja como cadena vacía. */
function guardar(fd: FormData) {
  if (fd.get("project_id") === SIN_PROYECTO) fd.set("project_id", "");
  return guardarTarea(fd);
}

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
      action={guardar}
      schema={tareaEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
      abiertoExterno={abiertoExterno}
      onCerrar={onCerrar}
    >
      {(form) => (
        <TareaCampos
          form={form}
          miembros={miembros}
          proyectos={proyectos}
          tarea={tarea}
          proyectoFijo={proyectoFijo}
        />
      )}
    </DialogoForm>
  );
}
