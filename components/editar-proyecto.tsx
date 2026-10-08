"use client";

import { useState } from "react";
import { Pencil1 } from "@tailgrids/icons";
import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import {
  ESTADOS,
  PRIORIDADES,
  editarProyectoEsquema,
} from "@/components/editar-proyecto-esquema";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { Button } from "@/components/tailgrids/core/button";
import { editarProyecto } from "@/app/contexto/acciones";
import type { Proyecto } from "@/lib/types";

export function EditarProyecto({ p }: { p: Proyecto }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button appearance="outline" onPress={() => setAbierto(true)}>
        <Pencil1 />
        Editar
      </Button>

      <DialogoForm
        titulo={`Editar ${p.nombre}`}
        action={editarProyecto}
        schema={editarProyectoEsquema}
        abiertoExterno={abierto}
        onCerrar={() => setAbierto(false)}
      >
        {(form) => (
          <>
            <p className="text-xs text-text-tertiary">
              Tu bitácora, decisiones y notas no se tocan. Acá solo cambiás el estado operativo.
            </p>

            <input type="hidden" name="archivo" value={p.archivo} />
            <input type="hidden" name="slug" value={p.slug} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelectField
                {...form.fieldProps("estado")}
                label="Estado"
                options={ESTADOS}
                defaultValue={p.estado}
              />
              <FormSelectField
                {...form.fieldProps("prioridad")}
                label="Prioridad"
                options={PRIORIDADES}
                defaultValue={p.prioridad}
              />
            </div>

            <FormTextField
              {...form.fieldProps("entrega")}
              type="date"
              label="Entrega"
              defaultValue={p.entrega ?? ""}
            />

            <FormTextField
              {...form.fieldProps("proximoPaso")}
              label="Próximo paso (reemplaza el actual)"
              placeholder="Qué sigue"
              defaultValue={p.proximoPaso ?? ""}
            />

            <FormTextAreaField
              {...form.fieldProps("estadoActual")}
              label="Estado actual (reemplaza el actual)"
              placeholder="Dónde está el proyecto hoy"
              rows={3}
              defaultValue={p.estadoActual ?? ""}
            />

            <FormTextField
              {...form.fieldProps("bitacora")}
              label="Agregar a la bitácora (se suma arriba, con fecha)"
              placeholder="Qué pasó hoy — se antepone, no pisa lo anterior"
            />
          </>
        )}
      </DialogoForm>
    </>
  );
}
