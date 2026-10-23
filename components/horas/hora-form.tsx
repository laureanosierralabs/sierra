"use client";

import { useState } from "react";
import { ClockThree } from "@tailgrids/icons";
import { DialogoForm, Input, Select, Textarea } from "@/components/landing/dialogo-form";
import { guardarHora } from "@/app/landing-pages/horas-acciones";
import { duracionTexto, MAX_NOTAS, minutosEntre, type EntradaHora } from "@/lib/horas/tipos";

function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-input-label-text">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-text-tertiary">{ayuda}</span>}
    </label>
  );
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
      action={guardarHora}
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

      <Campo etiqueta="Cliente" ayuda="Opcional: sirve para filtrar las horas de un trabajo.">
        <Select name="client_id" defaultValue={entrada?.client_id ?? ""}>
          <option value="">Sin cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Campo>
    </>
  );
}
