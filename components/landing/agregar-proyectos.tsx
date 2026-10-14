"use client";

import { useState } from "react";
import { DialogoForm, Input } from "@/components/landing/dialogo-form";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import { moverProyectosACliente } from "@/app/landing-pages/acciones";

export type ProyectoParaMover = { id: string; name: string; cliente: string | null };

/**
 * Elige varios proyectos de otros clientes y los cuelga de este (la marca).
 * Los que no coinciden con la búsqueda se ocultan pero siguen en el form:
 * así una búsqueda nueva no pierde lo ya marcado.
 */
export function AgregarProyectos({
  clientId,
  proyectos,
}: {
  clientId: string;
  proyectos: ProyectoParaMover[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const q = busqueda.trim().toLowerCase();
  const coincide = (p: ProyectoParaMover) =>
    !q || p.name.toLowerCase().includes(q) || (p.cliente ?? "").toLowerCase().includes(q);

  if (proyectos.length === 0) return null;

  return (
    <DialogoForm titulo="Agregar proyectos" etiquetaAbrir="Agregar proyectos" action={moverProyectosACliente}>
      <input type="hidden" name="client_id" value={clientId} />
      <Input
        type="search"
        placeholder="Buscar por proyecto o cliente actual"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        aria-label="Buscar proyectos"
      />
      <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
        {proyectos.map((p) => (
          <li key={p.id} className={coincide(p) ? undefined : "hidden"}>
            <Checkbox name="project_ids" value={p.id} className="w-full rounded-md px-2 py-1.5 hover:bg-base-50">
              <span className="min-w-0 truncate text-sm text-text-primary">{p.name}</span>
              <span className="ml-auto shrink-0 text-xs text-text-tertiary">{p.cliente ?? "sin cliente"}</span>
            </Checkbox>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-tertiary">
        Pasan a este cliente con sus tareas, recursos y cotizaciones. Quien esté asignado a
        ellos va a poder ver los accesos de este cliente.
      </p>
    </DialogoForm>
  );
}
