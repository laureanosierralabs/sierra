"use client";

import { useState, useTransition } from "react";
import { Copy1, Pencil1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { z } from "zod";
import { FormSelectField, FormTextField } from "@/components/common/form/form-fields";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { SIN_OPCION } from "@/components/landing/proyecto-esquema";
import { Button } from "@/components/tailgrids/core/button";
import {
  borrarLanzamiento,
  borrarPaginaLanzamiento,
  conectarMailerlite,
  guardarLanzamiento,
  guardarPaginaLanzamiento,
  type GrupoMailerlite,
} from "@/app/landing-pages/lanzamiento-acciones";
import type { ConexionLanzamiento } from "@/lib/lanzamientos/datos";
import {
  ESTADOS_LANZAMIENTO,
  LABEL_ESTADO_LANZAMIENTO,
  type Lanzamiento,
  type PaginaLanzamiento,
} from "@/lib/lanzamientos/tipos";

/* Espejo de las reglas de app/landing-pages/lanzamiento-acciones.ts. */
const fechaOpcional = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Fecha inválida").optional();
const linkOpcional = z
  .string()
  .trim()
  .regex(/^(https?:\/\/.+)?$/i, "Tiene que empezar con http:// o https://")
  .optional();

const lanzamientoEsquema = z
  .object({
    id: z.string().optional(),
    client_id: z.string().optional(),
    name: z.string().trim().min(1, "Falta el nombre del lanzamiento"),
    status: z.enum(ESTADOS_LANZAMIENTO, { error: "Estado inválido" }),
    starts_on: fechaOpcional,
    ends_on: fechaOpcional,
    goal_registrations: z.string().trim().regex(/^([1-9]\d*)?$/, "Un número entero mayor a cero").optional(),
  })
  .refine((v) => !v.starts_on || !v.ends_on || v.ends_on >= v.starts_on, {
    path: ["ends_on"],
    message: "El cierre no puede ser anterior al inicio",
  });

const paginaEsquema = z.object({
  id: z.string().optional(),
  launch_id: z.string(),
  name: z.string().trim().min(1, "Falta el nombre de la landing"),
  url: linkOpcional,
  thanks_url: linkOpcional,
  whatsapp_url: linkOpcional,
  checkout_url: linkOpcional,
  mailerlite_group_id: z.string().optional(),
  project_id: z.string().optional(),
});

const OPCIONES_ESTADO = ESTADOS_LANZAMIENTO.map((e) => ({
  value: e,
  label: LABEL_ESTADO_LANZAMIENTO[e],
}));

export function LanzamientoForm({
  clientId,
  lanzamiento,
}: {
  /** Para crear. Al editar, el cliente no cambia. */
  clientId?: string;
  lanzamiento?: Lanzamiento;
}) {
  return (
    <DialogoForm
      titulo={lanzamiento ? "Editar lanzamiento" : "Nuevo lanzamiento"}
      etiquetaAbrir="Nuevo lanzamiento"
      action={guardarLanzamiento}
      schema={lanzamientoEsquema}
      disparador={lanzamiento ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          {lanzamiento && <input type="hidden" name="id" value={lanzamiento.id} />}
          {clientId && <input type="hidden" name="client_id" value={clientId} />}

          <FormTextField
            {...form.fieldProps("name")}
            label="Nombre"
            required
            placeholder="Academia ADN · Octubre"
            defaultValue={lanzamiento?.name ?? ""}
          />
          <FormSelectField
            {...form.fieldProps("status")}
            label="Estado"
            options={OPCIONES_ESTADO}
            defaultValue={lanzamiento?.status ?? "preparacion"}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("starts_on")}
              type="date"
              label="Inicio"
              defaultValue={lanzamiento?.starts_on ?? ""}
            />
            <FormTextField
              {...form.fieldProps("ends_on")}
              type="date"
              label="Cierre"
              defaultValue={lanzamiento?.ends_on ?? ""}
            />
          </div>
          <FormTextField
            {...form.fieldProps("goal_registrations")}
            label="Meta de registros"
            placeholder="1000"
            description="Opcional. Con meta y fechas, el panel muestra a cuánto llega el ritmo actual."
            defaultValue={lanzamiento?.goal_registrations?.toString() ?? ""}
          />
        </>
      )}
    </DialogoForm>
  );
}

export function BorrarLanzamiento({ id }: { id: string }) {
  return (
    <BorrarBoton
      etiqueta="Borrar lanzamiento"
      advertencia="Se borran sus landings y todos los registros recibidos."
      onConfirmar={() => borrarLanzamiento(id)}
    />
  );
}

/** "Sin proyecto" viaja como cadena vacía. */
function guardarPagina(fd: FormData) {
  if (fd.get("project_id") === SIN_OPCION) fd.set("project_id", "");
  return guardarPaginaLanzamiento(fd);
}

export function PaginaLanzamientoForm({
  launchId,
  pagina,
  proyectos,
}: {
  launchId: string;
  pagina?: PaginaLanzamiento;
  proyectos: { id: string; name: string }[];
}) {
  const opcionesProyecto = [
    { value: SIN_OPCION, label: "Sin proyecto" },
    ...proyectos.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <DialogoForm
      titulo={pagina ? "Editar landing" : "Agregar landing"}
      etiquetaAbrir="Agregar landing"
      action={guardarPagina}
      schema={paginaEsquema}
      disparador={pagina ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          <input type="hidden" name="launch_id" value={launchId} />
          {pagina && <input type="hidden" name="id" value={pagina.id} />}

          <FormTextField
            {...form.fieldProps("name")}
            label="Nombre"
            required
            placeholder="Registro A"
            defaultValue={pagina?.name ?? ""}
          />
          <FormTextField
            {...form.fieldProps("url")}
            label="URL de la landing"
            placeholder="https://…"
            defaultValue={pagina?.url ?? ""}
          />
          <FormTextField
            {...form.fieldProps("mailerlite_group_id")}
            label="Grupo de MailerLite (id)"
            placeholder="123456789012345678"
            description="El grupo al que esta landing suma a quien se registra. Así se sabe de qué landing vino cada persona."
            defaultValue={pagina?.mailerlite_group_id ?? ""}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("thanks_url")}
              label="Página de gracias"
              placeholder="https://…"
              defaultValue={pagina?.thanks_url ?? ""}
            />
            <FormTextField
              {...form.fieldProps("whatsapp_url")}
              label="Link al grupo de WhatsApp"
              placeholder="https://chat.whatsapp.com/…"
              defaultValue={pagina?.whatsapp_url ?? ""}
            />
          </div>
          <FormTextField
            {...form.fieldProps("checkout_url")}
            label="Checkout"
            placeholder="https://…"
            defaultValue={pagina?.checkout_url ?? ""}
          />
          <FormSelectField
            {...form.fieldProps("project_id")}
            label="Proyecto"
            options={opcionesProyecto}
            defaultValue={pagina?.project_id ?? SIN_OPCION}
          />
        </>
      )}
    </DialogoForm>
  );
}

export function BorrarPaginaLanzamiento({ id }: { id: string }) {
  return (
    <BorrarBoton
      etiqueta="Quitar landing"
      advertencia="Sus registros quedan en el lanzamiento, sin landing asignada."
      onConfirmar={() => borrarPaginaLanzamiento(id)}
    />
  );
}

const FECHA_HORA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Conexión con MailerLite: crea el webhook con la API key del cliente (que
 * se usa una vez y no se guarda) y muestra los grupos para mapear landings.
 */
export function ConexionMailerlite({
  launchId,
  conexion,
}: {
  launchId: string;
  conexion: ConexionLanzamiento;
}) {
  const [pendiente, iniciar] = useTransition();
  const [apiKey, setApiKey] = useState("");
  const [grupos, setGrupos] = useState<GrupoMailerlite[] | null>(null);

  const rutaWebhook = `/api/webhooks/mailerlite/${conexion.webhookToken}`;

  async function copiar(texto: string, aviso: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(aviso);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function conectar() {
    iniciar(async () => {
      const fd = new FormData();
      fd.set("launch_id", launchId);
      fd.set("api_key", apiKey);
      try {
        const resultado = await conectarMailerlite(fd);
        if ("error" in resultado) {
          toast.error(resultado.error);
          return;
        }
        setGrupos(resultado.grupos);
        setApiKey("");
        toast.success(conexion.conectado ? "Grupos actualizados" : "MailerLite conectado");
      } catch {
        toast.error("No se pudo conectar con MailerLite");
      }
    });
  }

  const ultimo = conexion.ultimoEnvio;

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span
          className={
            conexion.conectado
              ? "font-medium text-badge-success-text"
              : "font-medium text-badge-warning-text"
          }
        >
          {conexion.conectado ? "Conectado (con firma)" : "Sin conectar"}
        </span>
        <span className="text-text-tertiary">
          {ultimo
            ? `Último envío: ${FECHA_HORA.format(new Date(ultimo.recibido))} · ${
                ultimo.error ?? `${ultimo.guardados} registro(s) guardado(s)`
              }`
            : "Todavía no llegó ningún envío."}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="mailerlite-api-key" className="text-sm font-medium text-input-label-text">
          API key de MailerLite
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="mailerlite-api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Pegala acá"
            className="min-w-0 flex-1 basis-64 rounded-lg border border-card-border bg-input-background px-3 py-2 text-sm text-title-50 outline-none duration-300 placeholder:text-input-placeholder-text focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20"
          />
          <Button size="sm" isDisabled={pendiente || apiKey.trim() === ""} onPress={conectar}>
            {conexion.conectado ? "Ver grupos" : "Conectar"}
          </Button>
        </div>
        <p className="text-xs text-text-tertiary">
          Se usa en este momento para crear el webhook y listar los grupos, y no se guarda. Sale de
          MailerLite → Integraciones → API.
        </p>
      </div>

      {grupos && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-text-secondary">
            Grupos de la cuenta ({grupos.length}): copiá el id en la landing que corresponda.
          </p>
          {grupos.length === 0 ? (
            <p className="text-sm text-text-tertiary">La cuenta no tiene grupos.</p>
          ) : (
            <ul className="max-h-56 divide-y divide-card-border overflow-y-auto rounded-lg border border-card-border">
              {grupos.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-text-primary">{g.name}</span>
                  <button
                    type="button"
                    onClick={() => copiar(g.id, "Id del grupo copiado")}
                    className="inline-flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-text-tertiary hover:text-text-primary [&>svg]:size-3.5"
                  >
                    {g.id}
                    <Copy1 />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <details className="text-xs text-text-tertiary">
        <summary className="cursor-pointer">Conexión manual (si creás el webhook a mano)</summary>
        <div className="mt-2 flex flex-col gap-2">
          <p>
            Evento <code>subscriber.added_to_group</code>, apuntando a esta URL. Sin la conexión
            automática no hay verificación de firma: la protege solo el token de la URL.
          </p>
          <button
            type="button"
            onClick={() => copiar(`${window.location.origin}${rutaWebhook}`, "URL del webhook copiada")}
            className="inline-flex items-center gap-1.5 self-start text-primary-500 hover:underline [&>svg]:size-3.5"
          >
            <Copy1 />
            Copiar URL del webhook
          </button>
        </div>
      </details>
    </div>
  );
}
