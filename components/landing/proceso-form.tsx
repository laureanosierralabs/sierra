"use client";

import { Pencil1 } from "@tailgrids/icons";
import { guardarProceso } from "@/app/landing-pages/acciones";
import {
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { procesoEsquema } from "@/components/landing/procesos-esquemas";
import type { Proceso } from "@/lib/landing/tipos";

export function ProcesoForm({ proceso }: { proceso?: Proceso }) {
  const editar = Boolean(proceso);

  return (
    <DialogoForm
      titulo={editar ? "Editar proceso" : "Nuevo proceso"}
      etiquetaAbrir="Nuevo proceso"
      action={guardarProceso}
      schema={procesoEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          {proceso && <input type="hidden" name="id" value={proceso.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("name")}
              label="Nombre"
              required
              defaultValue={proceso?.name ?? ""}
            />
            <FormTextField
              {...form.fieldProps("slug")}
              label="Identificador"
              placeholder="wordpress, codigo…"
              defaultValue={proceso?.slug ?? ""}
            />
          </div>

          <FormTextAreaField
            {...form.fieldProps("description")}
            label="Descripción"
            rows={2}
            defaultValue={proceso?.description ?? ""}
          />
        </>
      )}
    </DialogoForm>
  );
}
