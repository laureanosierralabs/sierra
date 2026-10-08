"use client";

import { FormTextAreaField, FormTextField } from "@/components/common/form/form-fields";
import {
  clienteNuevoEsquema,
  proyectoNuevoEsquema,
} from "@/components/crear-entidad-esquema";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { crearProyecto, crearCliente } from "@/app/contexto/acciones";

type Tipo = "proyecto" | "cliente";

export function CrearEntidad({
  unidad,
  tipo,
}: {
  unidad: string;
  tipo: Tipo;
}) {
  const esProyecto = tipo === "proyecto";
  const titulo = esProyecto ? "Nuevo proyecto" : "Nuevo cliente";

  return (
    <DialogoForm
      titulo={titulo}
      etiquetaAbrir={titulo}
      action={esProyecto ? crearProyecto : crearCliente}
      schema={esProyecto ? proyectoNuevoEsquema : clienteNuevoEsquema}
    >
      {(form) => (
        <>
          <input type="hidden" name="unidad" value={unidad} />

          <FormTextField
            {...form.fieldProps("nombre")}
            label="Nombre"
            required
            placeholder={esProyecto ? "Landing nueva" : "Nombre del cliente"}
          />

          {esProyecto ? (
            <>
              <FormTextField {...form.fieldProps("cliente")} label="Cliente (opcional)" />
              <FormTextField {...form.fieldProps("entrega")} type="date" label="Entrega (opcional)" />
              <FormTextField {...form.fieldProps("proximoPaso")} label="Próximo paso (opcional)" />
            </>
          ) : (
            <FormTextAreaField {...form.fieldProps("contexto")} label="Contexto (opcional)" rows={3} />
          )}
        </>
      )}
    </DialogoForm>
  );
}
