"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Envelope1, ExpandArrowTopRightSquare1, User2 } from "@tailgrids/icons";
import { toast } from "sonner";
import { ImagenPortal } from "@/components/landing/imagen-portal";
import { z } from "zod";
import { FormTextField } from "@/components/common/form/form-fields";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { SeccionCard } from "@/components/landing/seccion-card";
import { Button } from "@/components/tailgrids/core/button";
import {
  eliminarPortal,
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
 * Portal del cliente en su ficha: habilitarlo, invitar personas, quitar
 * accesos y eliminarlo. Solo lo ve el owner.
 *
 * El portal es de la MARCA. Quien la opera (Ismael con Pilar Sousa) no
 * necesita portal propio: se lo invita al de la marca, y si opera varias
 * (Santiago con Pilar y Aida) elige cuál ver al entrar.
 */
export function PortalCliente({
  clientId,
  estado,
  portada = null,
  operador = null,
  marcas = [],
}: {
  clientId: string;
  estado: EstadoPortal | null;
  portada?: string | null;
  /** Quien opera esta marca, para darle acceso con un click. */
  operador?: { nombre: string; email: string | null } | null;
  /** Marcas que opera este cliente: entra a sus portales, no necesita uno propio. */
  marcas?: { id: string; name: string }[];
}) {
  const [pendiente, iniciar] = useTransition();

  const invitarOperador = (email: string) =>
    iniciar(async () => {
      const fd = new FormData();
      fd.set("client_id", clientId);
      fd.set("email", email);
      const r = await invitarAlPortal(fd).catch(() => ({ error: "No se pudo invitar" }));
      if (r && "error" in r) toast.error(r.error);
      else toast.success(r?.aviso ?? "Listo");
    });

  if (!estado) {
    return (
      <SeccionCard titulo="Portal del cliente">
        {marcas.length > 0 && (
          <div className="border-b border-card-border bg-badge-blue-background/40 px-4 py-3 text-sm text-text-secondary">
            Opera{" "}
            {marcas.map((m, i) => (
              <span key={m.id}>
                {i > 0 && (i === marcas.length - 1 ? " y " : ", ")}
                <Link href={`/landing-pages/clients/${m.id}?vista=portal`} className="font-medium text-primary-500 hover:underline">
                  {m.name}
                </Link>
              </span>
            ))}
            : no necesita portal propio. Invitalo desde el portal de cada marca y, al entrar, elige cuál ver.
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-text-tertiary">
            Dale a este cliente un acceso propio para ver sus lanzamientos, entregas, pedidos y
            cotizaciones.
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
        <span className="flex items-center gap-3">
          <InvitarAlPortal clientId={clientId} />
          <BorrarBoton
            etiqueta="Eliminar portal"
            advertencia="Nadie más va a poder entrar a este portal y se cancelan las invitaciones pendientes. Las cuentas de las personas siguen existiendo: si tienen acceso a otros portales, los siguen viendo. Las imágenes y entregas cargadas no se borran."
            onConfirmar={() => eliminarPortal(clientId)}
          />
        </span>
      </div>

      {operador?.email &&
        !estado.miembros.some((m) => m.email?.toLowerCase() === operador.email?.toLowerCase()) &&
        !estado.invitaciones.some((i) => i.email.toLowerCase() === operador.email?.toLowerCase()) && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-badge-blue-background/40 px-4 py-3">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">{operador.nombre}</span> opera esta marca y todavía no
              tiene acceso a este portal.
            </p>
            <Button
              size="sm"
              appearance="outline"
              isDisabled={pendiente}
              onPress={() => invitarOperador(operador.email as string)}
            >
              Darle acceso
            </Button>
          </div>
        )}

      <div className="px-4 py-4">
        <ImagenPortal
          destino="cliente"
          id={clientId}
          url={portada}
          titulo="Portada del portal"
          ayuda="Es lo primero que ve el cliente al entrar. 2400 × 900 px, con lo importante al centro: en el celular se recortan los costados."
          formato="horizontal"
        />
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
