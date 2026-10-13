"use client";

import { useTransition } from "react";
import { Envelope1, ExpandArrowTopRightSquare1, User2 } from "@tailgrids/icons";
import { toast } from "sonner";
import { z } from "zod";
import { FormTextField } from "@/components/common/form/form-fields";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { SeccionCard } from "@/components/landing/seccion-card";
import { Button } from "@/components/tailgrids/core/button";
import {
  habilitarPortal,
  invitarAlPortal,
  quitarAccesoPortal,
  revocarInvitacionPortal,
} from "@/app/landing-pages/portal-acciones";
import type { EstadoPortal } from "@/lib/portal/admin";

/** Espejo del regex de `invitarAlPortal` (app/landing-pages/portal-acciones.ts). */
const invitarEsquema = z.object({
  client_id: z.string(),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido"),
});

function InvitarAlPortal({ clientId }: { clientId: string }) {
  return (
    <DialogoForm
      titulo="Invitar al portal"
      etiquetaAbrir="Invitar"
      action={invitarAlPortal}
      schema={invitarEsquema}
    >
      {(form) => (
        <>
          <input type="hidden" name="client_id" value={clientId} />
          <FormTextField
            {...form.fieldProps("email")}
            type="email"
            label="Email"
            required
            placeholder="nombre@mail.com"
          />
          <p className="text-xs text-text-tertiary">
            Le llega un mail para crear su cuenta y entra directo al portal de este cliente. Solo
            ve lo de este cliente, nunca el panel interno. Si ya tiene cuenta de otro portal, se
            le suma este.
          </p>
        </>
      )}
    </DialogoForm>
  );
}

/**
 * Portal del cliente en su ficha: habilitarlo, invitar personas y quitar
 * accesos. Solo lo ve el owner.
 */
export function PortalCliente({ clientId, estado }: { clientId: string; estado: EstadoPortal | null }) {
  const [pendiente, iniciar] = useTransition();

  if (!estado) {
    return (
      <SeccionCard titulo="Portal del cliente">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-text-tertiary">
            Dale a este cliente un acceso propio para ver sus cotizaciones (y más adelante sus
            lanzamientos).
          </p>
          <Button
            size="sm"
            appearance="outline"
            isDisabled={pendiente}
            onPress={() =>
              iniciar(async () => {
                try {
                  const resultado = await habilitarPortal(clientId);
                  if (resultado?.error) toast.error(resultado.error);
                  else toast.success("Portal habilitado");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "No se pudo habilitar el portal");
                }
              })
            }
          >
            Habilitar portal
          </Button>
        </div>
      </SeccionCard>
    );
  }

  return (
    <SeccionCard titulo="Portal del cliente" cantidad={estado.miembros.length}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <a
          href={`/portal/${estado.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline [&>svg]:size-4"
        >
          <ExpandArrowTopRightSquare1 />
          Ver el portal como el cliente
        </a>
        <InvitarAlPortal clientId={clientId} />
      </div>

      {estado.miembros.map((m) => (
        <div key={m.userId} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="flex min-w-0 items-center gap-3">
            <User2 className="size-4 shrink-0 text-text-tertiary" />
            <span className="truncate text-sm text-text-primary">{m.nombre}</span>
            {m.email && m.email !== m.nombre && (
              <span className="truncate text-xs text-text-tertiary">{m.email}</span>
            )}
          </span>
          <BorrarBoton
            etiqueta="Quitar acceso"
            advertencia="Deja de ver el portal de este cliente."
            onConfirmar={() => quitarAccesoPortal(clientId, m.userId)}
          />
        </div>
      ))}

      {estado.invitaciones.map((i) => (
        <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="flex min-w-0 items-center gap-3">
            <Envelope1 className="size-4 shrink-0 text-text-tertiary" />
            <span className="truncate text-sm text-text-primary">{i.email}</span>
            <span className="shrink-0 text-xs text-text-tertiary">Invitación pendiente · {i.creada}</span>
          </span>
          <BorrarBoton
            etiqueta="Revocar invitación"
            advertencia="El link deja de funcionar."
            onConfirmar={() => revocarInvitacionPortal(clientId, i.id)}
          />
        </div>
      ))}

      {estado.miembros.length === 0 && estado.invitaciones.length === 0 && (
        <p className="px-4 py-3 text-sm text-text-tertiary">Todavía nadie tiene acceso.</p>
      )}
    </SeccionCard>
  );
}
