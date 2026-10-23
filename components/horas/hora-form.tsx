"use client";

import { Pencil1 } from "@tailgrids/icons";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { DialogoForm, Input, Select, Textarea } from "@/components/landing/dialogo-form";
import { borrarHora, guardarHora } from "@/app/landing-pages/horas-acciones";
import { MAX_NOTAS, type EntradaHora } from "@/lib/horas/tipos";

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-input-label-text">{etiqueta}</span>
      {children}
    </label>
  );
}

/** Alta o edición de una carga de horas. Las horas trabajadas se calculan solas. */
export function HoraForm({
  entrada,
  hoy,
  clientes,
}: {
  entrada?: EntradaHora;
  hoy: string;
  clientes: { id: string; name: string }[];
}) {
  return (
    <DialogoForm
      titulo={entrada ? "Editar horas" : "Cargar horas"}
      etiquetaAbrir={entrada ? "Editar horas" : "Cargar horas"}
      action={guardarHora}
      disparador={entrada ? <Pencil1 /> : undefined}
    >
      {entrada && <input type="hidden" name="id" value={entrada.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo etiqueta="Día">
          <Input name="work_date" type="date" required defaultValue={entrada?.work_date ?? hoy} />
        </Campo>
        <Campo etiqueta="Comienzo">
          <Input name="start_time" type="time" required defaultValue={entrada?.start_time ?? ""} />
        </Campo>
        <Campo etiqueta="Finalización">
          <Input name="end_time" type="time" required defaultValue={entrada?.end_time ?? ""} />
        </Campo>
      </div>
      <Campo etiqueta="Qué trabajaste">
        <Textarea
          name="notes"
          required
          rows={3}
          maxLength={MAX_NOTAS}
          defaultValue={entrada?.notes ?? ""}
          placeholder="Ej.: Desarrollo de la landing de Shopping Fest"
        />
      </Campo>
      <Campo etiqueta="Cliente (opcional)">
        <Select name="client_id" defaultValue={entrada?.client_id ?? ""}>
          <option value="">Sin cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Campo>
    </DialogoForm>
  );
}

export function AccionesHora({
  entrada,
  hoy,
  clientes,
}: {
  entrada: EntradaHora;
  hoy: string;
  clientes: { id: string; name: string }[];
}) {
  return (
    <span className="flex items-center justify-end gap-3">
      <HoraForm entrada={entrada} hoy={hoy} clientes={clientes} />
      <BorrarBoton etiqueta="Borrar carga" onConfirmar={() => borrarHora(entrada.id)} />
    </span>
  );
}
