"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/common/form/form-error";
import { useZodForm } from "@/components/common/form/use-zod-form";
import { TextArea } from "@/components/tailgrids/core/text-area";
import { estilosEnlaces } from "@/components/lanzamientos/enlaces-estilos";
import { agregarGruposPanel, borrarGrupoPanel, marcarGrupoPanel } from "@/app/landing-pages/grupos-acciones";
import { agregarGruposPortal, borrarGrupoPortal, marcarGrupoPortal } from "@/app/portal/grupos-acciones";
import {
  AVISO_GRUPOS_LIBRES,
  enElTope,
  estadoGrupo,
  grupoDestino,
  gruposLibres,
  grupoVigente,
  type GrupoWhatsapp,
} from "@/lib/lanzamientos/grupos";
import { cn } from "@/utils/cn";

/** Panel del owner o portal del cliente: cambia solo a qué acciones se llama. */
export type ModoGrupos = { tipo: "panel" } | { tipo: "portal"; slug: string };

/** Texto según quién mira: el portal habla de "tú", el panel de "vos". */
const segun = (modo: ModoGrupos, portal: string, panel: string) => (modo.tipo === "portal" ? portal : panel);

const num = (n: number) => n.toLocaleString("es-AR");

/**
 * Grupos de WhatsApp de un lanzamiento: la fila de grupos por la que rota el
 * link estable (que se arma en el bloque de Enlaces). Se muestra el resumen
 * del grupo vigente y, dentro de "Gestionar grupos", la lista y el alta. Se
 * cargan por adelantado; cuando uno se llena, el link pasa solo al siguiente.
 */
export function GruposWhatsapp({
  modo,
  launchId,
  grupos,
}: {
  modo: ModoGrupos;
  launchId: string;
  grupos: GrupoWhatsapp[];
}) {
  const e = estilosEnlaces(modo.tipo === "portal");
  const idPanel = useId();
  const [abierto, setAbierto] = useState(false);
  const [llenosAbiertos, setLlenosAbiertos] = useState(false);
  const [links, setLinks] = useState("");
  const [pendiente, start] = useTransition();

  const agregar = (fd: FormData) => (modo.tipo === "panel" ? agregarGruposPanel(fd) : agregarGruposPortal(fd));
  const form = useZodForm({
    action: agregar,
    successMessage: null,
    onSuccess: () => setLinks(""),
  });

  function cambiar(grupo: GrupoWhatsapp, accion: "lleno" | "reabrir" | "borrar") {
    start(async () => {
      try {
        const r =
          accion === "borrar"
            ? modo.tipo === "panel"
              ? await borrarGrupoPanel(launchId, grupo.id)
              : await borrarGrupoPortal(modo.slug, launchId, grupo.id)
            : modo.tipo === "panel"
              ? await marcarGrupoPanel(launchId, grupo.id, accion === "lleno")
              : await marcarGrupoPortal(modo.slug, launchId, grupo.id, accion === "lleno");
        if (r?.error) toast.error(r.error);
        else
          toast.success(
            accion === "borrar" ? "Grupo borrado" : accion === "lleno" ? "Grupo marcado como lleno" : "Grupo reabierto",
          );
      } catch {
        toast.error(
          segun(
            modo,
            "No se pudo actualizar el grupo: recarga la página e intenta de nuevo",
            "No se pudo actualizar el grupo: recargá la página y probá de nuevo",
          ),
        );
      }
    });
  }

  const vigente = grupoVigente(grupos);
  const libres = gruposLibres(grupos);
  // Si todos están llenos, el link sigue mandando al último: ese es el que se muestra.
  const actual = vigente ?? grupoDestino(grupos);
  const numeroActual = actual ? grupos.findIndex((g) => g.id === actual.id) + 1 : 0;
  const avance = actual ? Math.min(Math.round((actual.joins / actual.cap) * 100), 100) : 0;
  const llenos = grupos.filter((g) => estadoGrupo(g, vigente) === "lleno");
  const activos = grupos.filter((g) => estadoGrupo(g, vigente) !== "lleno");

  const fila = (g: GrupoWhatsapp) => {
    const i = grupos.findIndex((x) => x.id === g.id);
    const estado = estadoGrupo(g, vigente);
    const pct = Math.min(Math.round((g.joins / g.cap) * 100), 100);
    return (
      <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5">
        <span className={cn("w-5 text-sm font-semibold tabular-nums", e.suave)}>{i + 1}</span>
        <a
          href={g.url}
          target="_blank"
          rel="noreferrer"
          className={cn("min-w-0 flex-1 basis-40 truncate text-sm hover:underline", e.texto)}
          title={g.url}
        >
          {g.url.replace("https://", "")}
        </a>
        <span className={cn("text-xs font-medium", e.suave)}>
          {estado === "vigente" ? "Vigente" : estado === "lleno" ? "Lleno" : "En espera"}
        </span>
        <div className="flex w-32 flex-col gap-1">
          <span className={cn("text-xs tabular-nums", e.suave)}>
            {num(g.joins)} / {num(g.cap)}
          </span>
          <span className={cn("h-1.5 overflow-hidden rounded-full", e.barraFondo)}>
            <span className="block h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
          </span>
        </div>
        <span className="flex items-center gap-3 text-xs font-medium">
          {enElTope(g) ? null : g.full_at ? (
            <button type="button" disabled={pendiente} onClick={() => cambiar(g, "reabrir")} className={e.enlace}>
              Reabrir
            </button>
          ) : (
            <button type="button" disabled={pendiente} onClick={() => cambiar(g, "lleno")} className={e.enlace}>
              Marcar lleno
            </button>
          )}
          {g.joins === 0 && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() => cambiar(g, "borrar")}
              className="text-error-500 hover:underline"
            >
              Borrar
            </button>
          )}
        </span>
      </li>
    );
  };

  const formAlta = (
    <form onSubmit={form.onSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="launch_id" value={launchId} />
      {modo.tipo === "portal" && <input type="hidden" name="slug" value={modo.slug} />}
      <label className="flex flex-col gap-1.5">
        <span className={cn("text-sm font-medium", e.titulo)}>
          {grupos.length === 0 ? "Links de los grupos" : "Agregar grupos"}
        </span>
        <TextArea
          name="links"
          rows={3}
          value={links}
          onChange={(ev) => setLinks(ev.target.value)}
          placeholder={"https://chat.whatsapp.com/…\nhttps://chat.whatsapp.com/…"}
          className="w-full"
        />
        <span className={cn("text-xs", e.pista)}>
          {segun(
            modo,
            "Uno por línea, en el orden en que se van a usar. Puedes cargar varios por adelantado.",
            "Uno por línea, en el orden en que se van a usar. Podés cargar varios por adelantado.",
          )}
        </span>
      </label>
      <FormError message={form.formError} />
      <button
        type="submit"
        disabled={form.pending || links.trim() === ""}
        className={cn(
          "self-end rounded-lg px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50",
          e.botonPrimario,
        )}
      >
        {form.pending ? "Guardando…" : "Agregar"}
      </button>
    </form>
  );

  // Sin grupos todavía, el alta se muestra directo: no hay nada más que hacer en este paso.
  if (!actual) return formAlta;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className={cn("text-sm", e.texto)}>
          <span aria-hidden className={e.estadoTexto.ok}>
            ✓{" "}
          </span>
          <span className="font-semibold">{grupos.length === 1 ? "1 grupo" : `${grupos.length} grupos`}</span>
          <span className={cn("tabular-nums", e.suave)}>
            {" "}
            · {vigente ? "vigente" : "todos llenos, último"}: grupo {numeroActual} ({num(actual.joins)} / {num(actual.cap)})
          </span>
        </p>
        <span
          role="progressbar"
          aria-label="Ocupación del grupo vigente"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={avance}
          className={cn("h-2 overflow-hidden rounded-full", e.barraFondo)}
        >
          <span className="block h-full rounded-full bg-primary-500" style={{ width: `${avance}%` }} />
        </span>
      </div>

      {libres <= AVISO_GRUPOS_LIBRES && (
        <p role="status" className={cn("px-3 py-2 text-sm", e.aviso)}>
          {libres === 0
            ? segun(
                modo,
                "No quedan grupos libres: la gente está entrando al último grupo. Carga uno nuevo.",
                "No quedan grupos libres: la gente está entrando al último grupo. Cargá uno nuevo.",
              )
            : segun(
                modo,
                "Queda un solo grupo libre: carga los próximos para que nadie se quede afuera.",
                "Queda un solo grupo libre: cargá los próximos para que nadie se quede afuera.",
              )}
        </p>
      )}

      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((v) => !v)}
        className={cn("inline-flex items-center gap-1.5 self-start text-sm font-medium", e.enlace)}
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={cn("size-3.5 transition-transform", abierto && "rotate-90")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3.5L10.5 8 6 12.5" />
        </svg>
        Gestionar grupos ({grupos.length})
      </button>

      {abierto && (
        <div id={idPanel} className="flex flex-col gap-4">
          <p className={cn("text-xs", e.pista)}>
            Los grupos se cargan por adelantado: el link manda a cada persona al grupo vigente, y cuando uno se llena pasa
            solo al siguiente.
          </p>

          {llenos.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                aria-expanded={llenosAbiertos}
                onClick={() => setLlenosAbiertos((v) => !v)}
                className={cn("self-start text-xs font-medium", e.enlace)}
              >
                {llenos.length === 1 ? "1 grupo lleno" : `${llenos.length} grupos llenos`}{" "}
                {llenosAbiertos ? "(ocultar)" : "(ver)"}
              </button>
              {llenosAbiertos && (
                <ol className={cn("flex flex-col divide-y", e.caja, e.separador)}>{llenos.map(fila)}</ol>
              )}
            </div>
          )}

          {activos.length > 0 && <ol className={cn("flex flex-col divide-y", e.caja, e.separador)}>{activos.map(fila)}</ol>}

          {formAlta}
        </div>
      )}
    </div>
  );
}
