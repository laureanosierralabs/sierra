"use client";

import { useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import { Copy1, ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { FormError } from "@/components/common/form/form-error";
import { useZodForm } from "@/components/common/form/use-zod-form";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { marcarLugarPanel } from "@/app/landing-pages/enlaces-acciones";
import { guardarWebinarPortal, marcarLugarPortal } from "@/app/portal/enlaces-acciones";
import {
  HERRAMIENTAS,
  LUGARES,
  hostDe,
  linkBase,
  linkCompartir,
  resumenEnlace,
  textoMarca,
  variableDe,
  type EstadoEnlace,
  type Herramienta,
  type Lugar,
  type MarcaLugar,
  type TipoEnlace,
} from "@/lib/lanzamientos/enlaces";
import { cn } from "@/utils/cn";

/** Panel del owner o portal del cliente: cambia solo a qué acciones se llama y el tono del texto. */
export type ModoEnlaces = { tipo: "panel" } | { tipo: "portal"; slug: string };

const PILDORA: Record<EstadoEnlace, "warning" | "gray" | "success"> = {
  "falta-destino": "warning",
  "sin-usos": "gray",
  funcionando: "success",
};

const TITULO: Record<TipoEnlace, string> = { webinar: "Webinar", grupo: "Grupo de WhatsApp" };

/** Texto según quién mira: el portal habla de "tú", el panel de "vos". */
const segun = (modo: ModoEnlaces, portal: string, panel: string) => (modo.tipo === "portal" ? portal : panel);

export interface DatosBloque {
  token: string;
  tieneDestino: boolean;
  usos: number;
  ultimoUso: string | null;
  marcas: MarcaLugar[];
}

/**
 * Un enlace del lanzamiento (webinar o grupo): estado, destino, el link para
 * pegar en el correo y dónde se puso. El destino se edita en `children`
 * (formulario del webinar, manager de grupos). El link es estable: siempre
 * manda al destino actual, así que cambiarlo no obliga a tocar los correos.
 */
export function BloqueEnlace({
  modo,
  launchId,
  tipo,
  dominio,
  ahoraIso,
  datos,
  children,
}: {
  modo: ModoEnlaces;
  launchId: string;
  tipo: TipoEnlace;
  dominio: string | null;
  /** "Ahora" del servidor: el "hace X" no cambia entre el servidor y el navegador. */
  ahoraIso: string;
  datos: DatosBloque;
  children?: React.ReactNode;
}) {
  const resumen = resumenEnlace({
    tieneDestino: datos.tieneDestino,
    usos: datos.usos,
    ultimoUso: datos.ultimoUso,
    ahoraIso,
  });

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="text-base font-semibold text-text-primary">{TITULO[tipo]}</h3>
        <Badge color={PILDORA[resumen.estado]} size="sm" className="rounded-md">
          {resumen.texto}
        </Badge>
      </div>

      {children}

      <LinkParaCompartir modo={modo} tipo={tipo} token={datos.token} dominio={dominio} />

      {resumen.estado !== "funcionando" && (
        <p className="rounded-lg bg-background-gray-secondary px-3 py-2 text-sm text-text-secondary">
          {segun(
            modo,
            "Envíate el mail de prueba y toca el botón: en segundos esto pasa a Funcionando.",
            "Enviate el mail de prueba y tocá el botón: en segundos esto pasa a Funcionando.",
          )}
        </p>
      )}

      <Lugares modo={modo} launchId={launchId} tipo={tipo} marcas={datos.marcas} />
    </div>
  );
}

/* ───────────── Link para compartir ───────────── */

async function copiar(valor: string) {
  try {
    await navigator.clipboard.writeText(valor);
    toast.success("Link copiado");
  } catch {
    toast.error("No se pudo copiar");
  }
}

function LinkParaCompartir({
  modo,
  tipo,
  token,
  dominio,
}: {
  modo: ModoEnlaces;
  tipo: TipoEnlace;
  token: string;
  dominio: string | null;
}) {
  const [herramienta, setHerramienta] = useState<Herramienta>("ghl");
  // El origen se lee en el navegador: así sirve igual en local, preview y producción.
  const origen = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const base = linkBase(tipo, token, dominio, origen || "https://…");
  const link = linkCompartir(base, herramienta);
  const variable = variableDe(herramienta);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-text-primary">Tu link para compartir</p>

      <div role="group" aria-label="Herramienta de correo" className="flex w-full rounded-lg bg-background-gray-secondary p-1 sm:w-fit">
        {HERRAMIENTAS.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-pressed={h.id === herramienta}
            onClick={() => setHerramienta(h.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:flex-none",
              h.id === herramienta
                ? "bg-primary-500 text-white"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {h.etiqueta}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-card-border px-3 py-2">
        <code className="min-w-0 flex-1 basis-60 text-xs break-all text-text-primary">{link}</code>
        <span className="flex shrink-0 items-center gap-3 text-xs font-medium">
          <button
            type="button"
            onClick={() => copiar(link)}
            aria-label={`Copiar el link de ${TITULO[tipo]}`}
            className="inline-flex items-center gap-1.5 text-primary-500 hover:underline [&>svg]:size-3.5"
          >
            <Copy1 />
            Copiar
          </button>
          <a
            href={base}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-primary-500 hover:underline [&>svg]:size-3.5"
          >
            <ExpandArrowTopRightSquare1 />
            Probar
          </a>
        </span>
      </div>

      <p className="text-xs text-text-tertiary">
        {variable
          ? `${variable} se reemplaza por el email de cada contacto al enviar el correo: así sabemos quién entró.`
          : "Sin variable no sabemos quién entró. Es el link para WhatsApp, redes o cualquier lugar sin el email del contacto."}
        {tipo === "webinar" && variable === null && " Si abren el link sin email, se lo pedimos."}
      </p>

      {!hostDe(dominio) && (
        <p className="text-xs text-badge-warning-text">
          Este lanzamiento no tiene landing conectada, así que el link usa la dirección del panel. Con una landing
          conectada, el link sale con el dominio del cliente.
        </p>
      )}

      <p className="text-xs text-text-tertiary">
        <strong className="text-text-secondary">Este link no cambia.</strong>{" "}
        {tipo === "webinar"
          ? segun(
              modo,
              "Si cambias el link de YouTube o Zoom, no tienes que editar tus correos: siempre manda al destino actual.",
              "Si cambian el link de YouTube o Zoom, no hay que editar los correos: siempre manda al destino actual.",
            )
          : segun(
              modo,
              "Si cargas o cambias grupos, no tienes que editar tus correos: siempre manda al grupo vigente.",
              "Si se cargan o cambian grupos, no hay que editar los correos: siempre manda al grupo vigente.",
            )}
      </p>
    </div>
  );
}

/* ───────────── Dónde lo pusiste ───────────── */

function Lugares({
  modo,
  launchId,
  tipo,
  marcas,
}: {
  modo: ModoEnlaces;
  launchId: string;
  tipo: TipoEnlace;
  marcas: MarcaLugar[];
}) {
  const [pendiente, start] = useTransition();
  const [vistas, aplicar] = useOptimistic(marcas, (actuales, cambio: { lugar: Lugar; marcado: boolean }) => {
    const resto = actuales.filter((m) => m.placement !== cambio.lugar);
    return cambio.marcado
      ? [...resto, { link: tipo, placement: cambio.lugar, checked_by: null, checked_at: new Date().toISOString() }]
      : resto;
  });

  function alternar(lugar: Lugar, marcado: boolean) {
    start(async () => {
      aplicar({ lugar, marcado });
      try {
        const r =
          modo.tipo === "panel"
            ? await marcarLugarPanel(launchId, tipo, lugar, marcado)
            : await marcarLugarPortal(modo.slug, launchId, tipo, lugar, marcado);
        if (r?.error) toast.error(r.error);
      } catch {
        toast.error(segun(modo, "No se pudo guardar: recarga la página e intenta de nuevo", "No se pudo guardar: recargá la página y probá de nuevo"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-text-primary">Dónde lo pusiste</p>
      <ul className="flex flex-col divide-y divide-card-border rounded-lg border border-card-border">
        {LUGARES.map((l) => {
          const marca = vistas.find((m) => m.placement === l.slug);
          return (
            <li key={l.slug}>
              <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={Boolean(marca)}
                  disabled={pendiente}
                  onChange={(e) => alternar(l.slug, e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-primary-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm text-text-primary">{l.etiqueta}</span>
                  {marca && <span className="block text-xs text-text-tertiary">{textoMarca(marca)}</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ───────────── Destino del webinar (portal) ───────────── */

/** El cliente edita desde acá a dónde manda el link del webinar (YouTube, Zoom…). */
export function DestinoWebinar({ slug, launchId, url }: { slug: string; launchId: string; url: string | null }) {
  const form = useZodForm({ action: guardarWebinarPortal, successMessage: "Link del webinar guardado" });
  return (
    <form onSubmit={form.onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="launch_id" value={launchId} />
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-input-label-text">Dónde se transmite (YouTube, Zoom…)</span>
        <input
          name="webinar_url"
          type="url"
          defaultValue={url ?? ""}
          placeholder="https://www.youtube.com/live/…"
          className="rounded-lg border border-card-border bg-input-background px-4 py-2.5 text-title-50 outline-none duration-300 placeholder:text-input-placeholder-text focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20"
        />
        <span className="text-xs text-text-tertiary">
          Puedes cambiarlo cuando quieras. Vacío = quien abra el link verá que el webinar todavía no está disponible.
        </span>
      </label>
      <FormError message={form.formError} />
      <Button type="submit" className="self-end" isDisabled={form.pending}>
        {form.pending ? "Guardando…" : "Guardar link"}
      </Button>
    </form>
  );
}
