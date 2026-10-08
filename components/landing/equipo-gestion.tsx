"use client";

import { Envelope1, Pencil1, User2 } from "@tailgrids/icons";
import { FormTextField } from "@/components/common/form/form-fields";
import { AccesoCampos } from "@/components/landing/equipo-acceso-campos";
import { accesoEsquema, invitarEsquema } from "@/components/landing/equipo-esquema";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { SeccionCard } from "@/components/landing/seccion-card";
import {
  cambiarAcceso,
  invitarMiembro,
  quitarMiembro,
  revocarInvitacion,
} from "@/app/landing-pages/equipo-acciones";
import { DEFINICIONES } from "@/lib/unidades";
import type { Invitacion, MiembroDetalle } from "@/lib/landing/auth";

export function InvitarMiembro() {
  return (
    <DialogoForm
      titulo="Invitar al equipo"
      etiquetaAbrir="Invitar"
      action={invitarMiembro}
      schema={invitarEsquema}
    >
      {(form) => (
        <>
          <FormTextField
            {...form.fieldProps("email")}
            type="email"
            label="Email"
            required
            placeholder="nombre@mail.com"
          />

          <AccesoCampos
            marcadas={["landing-pages"]}
            rol="member"
            errorUnidades={form.errors.units}
            onCambioUnidades={() => form.clearError("units")}
          />

          <p className="text-xs text-text-tertiary">
            Le llega un mail para crear su cuenta. El acceso queda configurado desde el momento en
            que entra.
          </p>
        </>
      )}
    </DialogoForm>
  );
}

export function EditarAcceso({ miembro }: { miembro: MiembroDetalle }) {
  return (
    <DialogoForm
      titulo={`Acceso de ${miembro.nombre}`}
      action={cambiarAcceso}
      schema={accesoEsquema}
      disparador={<Pencil1 />}
    >
      {(form) => (
        <>
          <input type="hidden" name="user_id" value={miembro.id} />
          <AccesoCampos
            marcadas={miembro.unidades}
            rol={miembro.rol}
            errorUnidades={form.errors.units}
            onCambioUnidades={() => form.clearError("units")}
          />
        </>
      )}
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
    <div className="mt-8">
      <SeccionCard titulo="Invitaciones pendientes" cantidad={invitaciones.length}>
        {invitaciones.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="flex min-w-0 items-center gap-3">
              <Envelope1 className="size-4 shrink-0 text-text-tertiary" />
              <span className="truncate text-sm text-text-primary">{i.email}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-text-tertiary">
                <User2 className="size-3.5" />
                {i.rol === "owner"
                  ? "Owner"
                  : i.unidades.map((u) => DEFINICIONES[u].nombre).join(", ")}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-3">
              <span className="text-xs tabular-nums text-text-tertiary">{i.creada}</span>
              <BorrarBoton
                etiqueta="Revocar invitación"
                advertencia="El link deja de funcionar."
                onConfirmar={() => revocarInvitacion(i.id)}
              />
            </span>
          </div>
        ))}
      </SeccionCard>
    </div>
  );
}
