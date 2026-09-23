"use client";

import { Pencil } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
  Textarea,
} from "@/components/landing/dialogo-form";
import { guardarCliente } from "@/app/landing-pages/acciones";
import {
  ESTADOS_CLIENTE,
  LABEL_ESTADO_CLIENTE,
  type Cliente,
} from "@/lib/landing/tipos";

export function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const editar = Boolean(cliente);

  return (
    <DialogoForm
      titulo={editar ? "Editar cliente" : "Nuevo cliente"}
      etiquetaAbrir="Nuevo cliente"
      action={guardarCliente}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Nombre">
          <Input name="name" required defaultValue={cliente?.name ?? ""} />
        </Campo>

        <Campo label="Empresa">
          <Input name="company" defaultValue={cliente?.company ?? ""} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Email">
          <Input type="email" name="email" defaultValue={cliente?.email ?? ""} />
        </Campo>

        <Campo label="WhatsApp / teléfono">
          <Input name="phone" defaultValue={cliente?.phone ?? ""} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Instagram">
          <Input
            name="instagram"
            placeholder="@usuario"
            defaultValue={cliente?.instagram ?? ""}
          />
        </Campo>

        <Campo label="Estado">
          <Select name="status" defaultValue={cliente?.status ?? "prospecto"}>
            {ESTADOS_CLIENTE.map((e) => (
              <option key={e} value={e}>
                {LABEL_ESTADO_CLIENTE[e]}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo label="Notas">
        <Textarea name="notes" rows={3} defaultValue={cliente?.notes ?? ""} />
      </Campo>
    </DialogoForm>
  );
}
