"use client";

import { Pencil1 } from "@tailgrids/icons";
import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import { clienteEsquema } from "@/components/landing/cliente-esquema";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { SIN_OPCION } from "@/components/landing/proyecto-esquema";
import { guardarCliente } from "@/app/landing-pages/acciones";
import {
  ESTADOS_CLIENTE,
  LABEL_ESTADO_CLIENTE,
  LABEL_ORIGEN,
  ORIGENES,
  type Cliente,
} from "@/lib/landing/tipos";

const OPCIONES_ESTADO = ESTADOS_CLIENTE.map((e) => ({ value: e, label: LABEL_ESTADO_CLIENTE[e] }));

const OPCIONES_ORIGEN = [
  { value: SIN_OPCION, label: "Sin definir" },
  ...ORIGENES.map((o) => ({ value: o, label: LABEL_ORIGEN[o] })),
];

/** Mismo FormData que antes: "sin definir" viaja como cadena vacía. */
function guardar(fd: FormData) {
  if (fd.get("source") === SIN_OPCION) fd.set("source", "");
  return guardarCliente(fd);
}

export function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const editar = Boolean(cliente);

  return (
    <DialogoForm
      titulo={editar ? "Editar cliente" : "Nuevo cliente"}
      etiquetaAbrir="Nuevo cliente"
      action={guardar}
      schema={clienteEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          {cliente && <input type="hidden" name="id" value={cliente.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("name")}
              label="Nombre"
              required
              defaultValue={cliente?.name ?? ""}
            />
            <FormTextField
              {...form.fieldProps("company")}
              label="Empresa"
              defaultValue={cliente?.company ?? ""}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("email")}
              type="email"
              label="Email"
              defaultValue={cliente?.email ?? ""}
            />
            <FormTextField
              {...form.fieldProps("phone")}
              label="WhatsApp / teléfono"
              defaultValue={cliente?.phone ?? ""}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("instagram")}
              label="Instagram"
              placeholder="@usuario"
              defaultValue={cliente?.instagram ?? ""}
            />
            <FormSelectField
              {...form.fieldProps("status")}
              label="Estado"
              options={OPCIONES_ESTADO}
              defaultValue={cliente?.status ?? "prospecto"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormSelectField
              {...form.fieldProps("source")}
              label="Origen"
              options={OPCIONES_ORIGEN}
              defaultValue={cliente?.source ?? SIN_OPCION}
            />
            <FormTextField
              {...form.fieldProps("source_detail")}
              label="Detalle del origen"
              placeholder="Instagram, Meta Ads, quién lo refirió…"
              defaultValue={cliente?.source_detail ?? ""}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("niche")}
              label="Nicho"
              placeholder="Pastelería, coaching…"
              defaultValue={cliente?.niche ?? ""}
            />
            <FormTextField
              {...form.fieldProps("website")}
              label="Sitio web"
              placeholder="https://…"
              defaultValue={cliente?.website ?? ""}
            />
          </div>

          <FormTextField
            {...form.fieldProps("drive_url")}
            label="Drive de archivos"
            placeholder="https://drive.google.com/…"
            defaultValue={cliente?.drive_url ?? ""}
          />

          <FormTextAreaField
            {...form.fieldProps("notes")}
            label="Notas"
            rows={3}
            defaultValue={cliente?.notes ?? ""}
          />
        </>
      )}
    </DialogoForm>
  );
}
