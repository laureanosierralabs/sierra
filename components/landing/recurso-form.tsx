"use client";

import { Pencil1 } from "@tailgrids/icons";
import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { recursoEsquema } from "@/components/landing/recurso-esquema";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import type { RecursoVista } from "@/lib/landing/datos";
import { guardarRecurso, guardarRecursoCliente } from "@/app/landing-pages/acciones";
import { LABEL_TIPO_RECURSO, TIPOS_RECURSO } from "@/lib/landing/tipos";

const OPCIONES_TIPO = TIPOS_RECURSO.map((k) => ({ value: k, label: LABEL_TIPO_RECURSO[k] }));

export function RecursoForm({
  duenoId,
  tabla,
  recurso,
}: {
  duenoId: string;
  tabla: "project" | "client";
  recurso?: RecursoVista;
}) {
  const editar = Boolean(recurso);
  const esCliente = tabla === "client";

  return (
    <DialogoForm
      titulo={editar ? "Editar recurso" : "Nuevo recurso"}
      etiquetaAbrir={esCliente ? "Nuevo acceso" : "Nuevo recurso"}
      action={esCliente ? guardarRecursoCliente : guardarRecurso}
      schema={recursoEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          <input type="hidden" name={esCliente ? "client_id" : "project_id"} value={duenoId} />
          {recurso && <input type="hidden" name="id" value={recurso.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("name")}
              label="Nombre"
              required
              defaultValue={recurso?.name ?? ""}
            />
            <FormSelectField
              {...form.fieldProps("kind")}
              label="Tipo"
              options={OPCIONES_TIPO}
              defaultValue={recurso?.kind ?? "otro"}
            />
          </div>

          <FormTextField
            {...form.fieldProps("url")}
            label="URL"
            placeholder="https://…"
            defaultValue={recurso?.url ?? ""}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("username")}
              label="Usuario / email"
              defaultValue={recurso?.username ?? ""}
            />
            <FormTextField
              {...form.fieldProps("secret")}
              type="password"
              label="Contraseña"
              autoComplete="new-password"
              placeholder={recurso?.tieneSecreto ? "Guardada — dejar vacío" : "Opcional"}
            />
          </div>

          {recurso?.tieneSecreto && (
            <Checkbox name="borrar_secreto" className="text-xs text-text-tertiary">
              Borrar la contraseña guardada
            </Checkbox>
          )}

          <FormTextAreaField
            {...form.fieldProps("notes")}
            label="Notas"
            rows={2}
            defaultValue={recurso?.notes ?? ""}
          />
        </>
      )}
    </DialogoForm>
  );
}
