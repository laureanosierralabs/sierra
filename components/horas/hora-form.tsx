"use client";

import { useState } from "react";
import { ClockThree } from "@tailgrids/icons";
import { FormSelectField } from "@/components/common/form/form-fields";
import { DialogoForm, Input, Textarea } from "@/components/landing/dialogo-form";
import { SIN_OPCION } from "@/components/landing/proyecto-esquema";
import { guardarHora } from "@/app/landing-pages/horas-acciones";
import { duracionTexto, MAX_NOTAS, minutosEntre, type EntradaHora } from "@/lib/horas/tipos";

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-input-label-text">{etiqueta}</span>
      {children}
    </label>
  );
}

/** "Sin cliente" viaja como cadena vacía, igual que en el resto de los formularios. */
function guardar(fd: FormData) {
  if (fd.get("client_id") === SIN_OPCION) fd.set("client_id", "");
  return guardarHora(fd);
}

/**
 * Alta o edición de una carga. Se abre desde afuera (botón del encabezado o
 * menú de la fila). La duración se calcula a la vista mientras se escribe.
 */
export function HoraForm({
  abierto,
  onCerrar,
  entrada,
  hoy,
  clientes,
}: {
  abierto: boolean;
  onCerrar: () => void;
  entrada: EntradaHora | null;
  hoy: string;
  clientes: { id: string; name: string }[];
}) {
  return (
    <DialogoForm
      titulo={entrada ? "Editar horas" : "Cargar horas"}
      action={guardar}
      abiertoExterno={abierto}
      onCerrar={onCerrar}
    >
      {/* key: al cambiar de carga se reinician los campos. */}
      <Campos key={entrada?.id ?? "nueva"} entrada={entrada} hoy={hoy} clientes={clientes} />
    </DialogoForm>
  );
}

function Campos({
  entrada,
  hoy,
  clientes,
}: {
  entrada: EntradaHora | null;
  hoy: string;
  clientes: { id: string; name: string }[];
}) {
  const [inicio, setInicio] = useState(entrada?.start_time ?? "");
  const [fin, setFin] = useState(entrada?.end_time ?? "");
  const minutos = inicio && fin ? minutosEntre(inicio, fin) : null;

  return (
    <>
      {entrada && <input type="hidden" name="id" value={entrada.id} />}

      <Campo etiqueta="Día">
        <Input name="work_date" type="date" required defaultValue={entrada?.work_date ?? hoy} />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo etiqueta="Comienzo">
          <Input name="start_time" type="time" required value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </Campo>
        <Campo etiqueta="Finalización">
          <Input name="end_time" type="time" required value={fin} onChange={(e) => setFin(e.target.value)} />
        </Campo>
      </div>

      <div
        aria-live="polite"
        className="flex items-center gap-2 rounded-lg border border-card-border bg-background-gray-secondary px-3 py-2 text-sm [&>svg]:size-4"
      >
        <ClockThree className="text-text-tertiary" />
        {inicio && fin ? (
          minutos !== null ? (
            <span className="text-text-secondary">
              Duración: <span className="font-semibold text-text-primary tabular-nums">{duracionTexto(minutos)}</span>
            </span>
          ) : (
            <span className="text-error-500">La finalización tiene que ser posterior al comienzo</span>
          )
        ) : (
          <span className="text-text-tertiary">La duración se calcula sola</span>
        )}
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

      <FormSelectField
        name="client_id"
        label="Cliente (opcional)"
        defaultValue={entrada?.client_id ?? SIN_OPCION}
        options={[{ value: SIN_OPCION, label: "Sin cliente" }, ...clientes.map((c) => ({ value: c.id, label: c.name }))]}
      />
    </>
  );
}
