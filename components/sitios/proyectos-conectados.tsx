"use client";

import { useTransition } from "react";
import { Copy1, FileText, RefreshCircle1Clockwise } from "@tailgrids/icons";
import { toast } from "sonner";
import { z } from "zod";
import { FormTextField } from "@/components/common/form/form-fields";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { SeccionCard } from "@/components/landing/seccion-card";
import {
  borrarProyectoConectado,
  conectarProyecto,
  regenerarSecreto,
  variablesDeEntorno,
} from "@/app/landing-pages/sitio-acciones";
import { promptIntegracion } from "@/lib/sitios/prompt";
import type { RutaDescubierta, SitioConectado } from "@/lib/sitios/tipos";

/* Espejo de las reglas de app/landing-pages/sitio-acciones.ts. */
const conectarEsquema = z.object({
  client_id: z.string(),
  name: z.string().trim().min(1, "Falta el nombre del proyecto"),
  domain: z.string().optional(),
});

const BOTON =
  "inline-flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:underline disabled:opacity-50 [&>svg]:size-3.5";

const FECHA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function ConectarProyecto({ clientId }: { clientId: string }) {
  return (
    <DialogoForm
      titulo="Conectar proyecto"
      etiquetaAbrir="Conectar proyecto"
      action={conectarProyecto}
      schema={conectarEsquema}
    >
      {(form) => (
        <>
          <input type="hidden" name="client_id" value={clientId} />
          <FormTextField
            {...form.fieldProps("name")}
            label="Nombre del proyecto"
            required
            placeholder="Landings Aida Qui"
          />
          <FormTextField
            {...form.fieldProps("domain")}
            label="Dominio"
            placeholder="aidaqui.com"
            description="Opcional. Sirve para armar los links de las landings."
          />
          <p className="text-xs text-text-tertiary">
            Es el repo del cliente con todas sus landings: se conecta una sola vez. Después copiás las
            variables para Vercel y el prompt para integrarlo con Claude Code.
          </p>
        </>
      )}
    </DialogoForm>
  );
}

function Proyecto({ sitio, rutas }: { sitio: SitioConectado; rutas: RutaDescubierta[] }) {
  const [pendiente, iniciar] = useTransition();

  const copiar = async (texto: string, aviso: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(aviso);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const copiarVariables = () =>
    iniciar(async () => {
      const resultado = await variablesDeEntorno(sitio.id, window.location.origin);
      if ("error" in resultado) toast.error(resultado.error);
      else await copiar(resultado.variables, "Variables copiadas: pegalas en Vercel → Settings → Environment Variables");
    });

  const copiarPrompt = () =>
    iniciar(async () => {
      try {
        // El código del kit sale de los archivos publicados: el prompt nunca
        // queda viejo respecto del kit.
        const [servidor, navegador] = await Promise.all(
          ["/kit/sierra.ts", "/kit/sierra-tracking.tsx"].map(async (ruta) => {
            const res = await fetch(ruta, { cache: "no-store" });
            if (!res.ok) throw new Error(ruta);
            return res.text();
          }),
        );
        await copiar(
          promptIntegracion({
            urlPanel: window.location.origin,
            proyecto: sitio.name,
            dominio: sitio.domain,
            kitServidor: servidor,
            kitNavegador: navegador,
          }),
          "Prompt copiado: pegalo en Claude Code dentro del repo del cliente",
        );
      } catch {
        toast.error("No se pudo armar el prompt");
      }
    });

  const regenerar = () => {
    if (!window.confirm("El secreto actual deja de valer: hasta cargar el nuevo en Vercel, no llegan registros. ¿Regenerar?")) return;
    iniciar(async () => {
      const resultado = await regenerarSecreto(sitio.id);
      if (resultado?.error) toast.error(resultado.error);
      else toast.success("Secreto regenerado: copiá las variables otra vez");
    });
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{sitio.name}</p>
          <p className="text-xs text-text-tertiary">
            {sitio.domain ?? "Sin dominio"} ·{" "}
            {sitio.last_event_at
              ? `último registro ${FECHA.format(new Date(sitio.last_event_at))}`
              : "todavía no llegó ningún registro"}
          </p>
        </div>
        <span className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={copiarVariables} disabled={pendiente} className={BOTON}>
            <Copy1 />
            Variables para Vercel
          </button>
          <button type="button" onClick={copiarPrompt} disabled={pendiente} className={BOTON}>
            <FileText />
            Prompt de integración
          </button>
          <button type="button" onClick={regenerar} disabled={pendiente} className={BOTON}>
            <RefreshCircle1Clockwise />
            Regenerar secreto
          </button>
          <BorrarBoton
            etiqueta="Desconectar proyecto"
            advertencia="Se borran sus visitas y registros guardados en el panel."
            onConfirmar={() => borrarProyectoConectado(sitio.id)}
          />
        </span>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-text-secondary">
          Landings detectadas ({rutas.length})
        </p>
        {rutas.length === 0 ? (
          <p className="text-xs text-text-tertiary">
            Aparecen solas con la primera visita, una vez instalado el kit.
          </p>
        ) : (
          <ul className="max-h-48 divide-y divide-card-border overflow-y-auto rounded-lg border border-card-border">
            {rutas.map((r) => (
              <li key={r.path} className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs">
                <span className="min-w-0 truncate font-medium text-text-primary">{r.path}</span>
                <span className="shrink-0 tabular-nums text-text-tertiary">
                  {r.visitors.toLocaleString("es-AR")} visitas · {r.conversions.toLocaleString("es-AR")}{" "}
                  conversiones
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Repos del cliente conectados al panel con el Sierra Launch Kit (solo owner). */
export function ProyectosConectados({
  clientId,
  proyectos,
}: {
  clientId: string;
  proyectos: { sitio: SitioConectado; rutas: RutaDescubierta[] }[];
}) {
  return (
    <SeccionCard titulo="Proyectos conectados" cantidad={proyectos.length}>
      {proyectos.map((p) => (
        <Proyecto key={p.sitio.id} sitio={p.sitio} rutas={p.rutas} />
      ))}
      <div className="px-4 py-3">
        <ConectarProyecto clientId={clientId} />
      </div>
    </SeccionCard>
  );
}
