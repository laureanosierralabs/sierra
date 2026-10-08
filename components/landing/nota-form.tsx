"use client";

import { Pencil1 } from "@tailgrids/icons";
import { FormTextAreaField, FormTextField } from "@/components/common/form/form-fields";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { notaEsquema } from "@/components/landing/nota-esquema";
import { guardarNotaCliente } from "@/app/landing-pages/acciones";
import type { NotaCliente } from "@/lib/landing/tipos";

export function NotaForm({ clientId, nota }: { clientId: string; nota?: NotaCliente }) {
  const editar = Boolean(nota);

  return (
    <DialogoForm
      titulo={editar ? "Editar reunión" : "Nueva reunión"}
      etiquetaAbrir="Nueva reunión"
      action={guardarNotaCliente}
      schema={notaEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          <input type="hidden" name="client_id" value={clientId} />
          {nota && <input type="hidden" name="id" value={nota.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <FormTextField
              {...form.fieldProps("title")}
              label="Título"
              required
              placeholder="Kickoff, revisión de diseño…"
              defaultValue={nota?.title ?? ""}
            />
            <FormTextField
              {...form.fieldProps("meeting_date")}
              type="date"
              label="Fecha"
              defaultValue={nota?.meeting_date ?? ""}
            />
          </div>

          <FormTextField
            {...form.fieldProps("url")}
            label="Link a la grabación"
            placeholder="https://fathom.video/…"
            defaultValue={nota?.url ?? ""}
          />

          <FormTextAreaField
            {...form.fieldProps("body")}
            label="Transcripción o notas"
            rows={10}
            placeholder="Pegá acá la transcripción de Fathom o tus notas…"
            defaultValue={nota?.body ?? ""}
          />
        </>
      )}
    </DialogoForm>
  );
}
