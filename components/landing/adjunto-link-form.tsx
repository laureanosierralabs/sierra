"use client";

import { useState } from "react";
import { Link1AngularRight } from "@tailgrids/icons";
import { agregarLinkTarea } from "@/app/landing-pages/acciones";
import { FormError } from "@/components/common/form/form-error";
import { FormTextField } from "@/components/common/form/form-fields";
import { useZodForm } from "@/components/common/form/use-zod-form";
import { linkAdjuntoEsquema } from "@/components/landing/adjunto-esquema";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";

export function AdjuntoLinkForm({ taskId }: { taskId: string }) {
  const [abierto, setAbierto] = useState(false);
  const form = useZodForm({
    schema: linkAdjuntoEsquema,
    action: agregarLinkTarea,
    successMessage: "Link agregado",
    onSuccess: () => setAbierto(false),
  });

  if (!abierto) {
    return (
      <Button appearance="outline" size="sm" onPress={() => setAbierto(true)}>
        <Link1AngularRight />
        Agregar link
      </Button>
    );
  }

  return (
    <Card className="w-full p-3">
      <form onSubmit={form.onSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="task_id" value={taskId} />

        <FormTextField
          {...form.fieldProps("url")}
          label="Link"
          required
          placeholder="https://… (Drive, Fathom, Figma, Notion)"
        />
        <FormTextField
          {...form.fieldProps("name")}
          label="Nombre"
          placeholder="Nombre (opcional)"
        />

        <FormError message={form.formError} />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            appearance="outline"
            size="sm"
            isDisabled={form.pending}
            onPress={() => {
              form.reset();
              setAbierto(false);
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" isDisabled={form.pending}>
            {form.pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
