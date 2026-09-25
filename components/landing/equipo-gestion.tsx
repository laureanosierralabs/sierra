"use client";

import { useState } from "react";
import { Mail, Pencil, UserPlus } from "lucide-react";
import { DialogoForm, Campo, Input, Select } from "@/components/landing/dialogo-form";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import {
  cambiarAcceso,
  invitarMiembro,
  quitarMiembro,
  revocarInvitacion,
} from "@/app/landing-pages/equipo-acciones";
import { DEFINICIONES, UNIDADES, type Unidad } from "@/lib/unidades";
import type { Invitacion, MiembroDetalle, Rol } from "@/lib/landing/auth";

/** Checkboxes de unidades. Se ocultan si el rol elegido es owner: ve todo. */
function Unidades({
  nombre,
  marcadas,
  rol,
}: {
  nombre: string;
  marcadas: Unidad[];
  rol: Rol;
}) {
  const [actual, setActual] = useState<Rol>(rol);

  return (
    <>
      <Campo label="Rol">
        <Select
          name="role"
          defaultValue={rol}
          onChange={(e) => setActual(e.target.value as Rol)}
        >
          <option value="member">Builder</option>
          <option value="owner">Owner</option>
        </Select>
      </Campo>

      {actual === "owner" ? (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-text-2">
          Un owner ve todas las unidades y puede gestionar el equipo.
        </p>
      ) : (
        <Campo label="Unidades a las que accede">
          <div className="flex flex-col gap-1.5">
            {UNIDADES.map((u) => (
              <label
                key={u}
                className="flex cursor-pointer items-center gap-2 text-sm text-text-2 transition-colors hover:text-text"
              >
                <input
                  type="checkbox"
                  name={nombre}
                  value={u}
                  defaultChecked={marcadas.includes(u)}
                  className="size-3.5 accent-idle"
                />
                {DEFINICIONES[u].nombre}
              </label>
            ))}
          </div>
        </Campo>
      )}
    </>
  );
}

export function InvitarMiembro() {
  return (
    <DialogoForm
      titulo="Invitar al equipo"
      etiquetaAbrir="Invitar"
      action={invitarMiembro}
    >
      <Campo label="Email">
        <Input type="email" name="email" required placeholder="nombre@mail.com" />
      </Campo>

      <Unidades nombre="units" marcadas={["landing-pages"]} rol="member" />

      <p className="text-xs text-text-3">
        Le llega un mail para crear su cuenta. El acceso queda configurado desde
        el momento en que entra.
      </p>
    </DialogoForm>
  );
}

export function EditarAcceso({ miembro }: { miembro: MiembroDetalle }) {
  return (
    <DialogoForm
      titulo={`Acceso de ${miembro.nombre}`}
      action={cambiarAcceso}
      disparador={<Pencil className="size-3.5" />}
    >
      <input type="hidden" name="user_id" value={miembro.id} />
      <Unidades nombre="units" marcadas={miembro.unidades} rol={miembro.rol} />
    </DialogoForm>
  );
}

export function QuitarMiembro({ id }: { id: string }) {
  return (
    <BorrarBoton
      etiqueta="Quitar del equipo"
      advertencia="Elimina su cuenta."
      onConfirmar={() => quitarMiembro(id)}
    />
  );
}

export function Invitaciones({ invitaciones }: { invitaciones: Invitacion[] }) {
  if (invitaciones.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold">
        <Mail className="size-4 text-text-3" />
        Invitaciones pendientes
        <span className="tnum text-xs font-normal text-text-3">
          {invitaciones.length}
        </span>
      </h2>

      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {invitaciones.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <span className="flex min-w-0 items-center gap-3">
              <UserPlus className="size-3.5 shrink-0 text-text-3" />
              <span className="truncate text-sm">{i.email}</span>
              <span className="shrink-0 text-xs text-text-3">
                {i.rol === "owner"
                  ? "Owner"
                  : i.unidades.map((u) => DEFINICIONES[u].nombre).join(", ")}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-3">
              <span className="tnum text-xs text-text-3">{i.creada}</span>
              <BorrarBoton
                etiqueta="Revocar invitación"
                advertencia="El link deja de funcionar."
                onConfirmar={() => revocarInvitacion(i.id)}
              />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
