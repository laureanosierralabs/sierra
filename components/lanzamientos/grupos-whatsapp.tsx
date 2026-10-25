"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/common/form/form-error";
import { useZodForm } from "@/components/common/form/use-zod-form";
import { Button } from "@/components/tailgrids/core/button";
import { Badge } from "@/components/tailgrids/core/badge";
import { TextArea } from "@/components/tailgrids/core/text-area";
import {
  agregarGruposPanel,
  borrarGrupoPanel,
  marcarGrupoPanel,
} from "@/app/landing-pages/grupos-acciones";
import {
  agregarGruposPortal,
  borrarGrupoPortal,
  marcarGrupoPortal,
} from "@/app/portal/grupos-acciones";
import {
  AVISO_GRUPOS_LIBRES,
  enElTope,
  estadoGrupo,
  grupoVigente,
  gruposLibres,
  type EstadoGrupo,
  type GrupoWhatsapp,
} from "@/lib/lanzamientos/grupos";

/** Panel del owner o portal del cliente: cambia solo a qué acciones se llama. */
export type ModoGrupos = { tipo: "panel" } | { tipo: "portal"; slug: string };

const ETIQUETA: Record<
  EstadoGrupo,
  { texto: string; color: "success" | "gray" | "warning" }
> = {
  vigente: { texto: "Vigente", color: "success" },
  "en-espera": { texto: "En espera", color: "gray" },
  lleno: { texto: "Lleno", color: "warning" },
};

/**
 * Grupos de WhatsApp de un lanzamiento: la fila de grupos por la que rota el
 * link estable (que se arma en el bloque de Enlaces). Se cargan por
 * adelantado; cuando uno se llena, el link pasa solo al siguiente.
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
  const [links, setLinks] = useState("");
  const [pendiente, start] = useTransition();

  const agregar = (fd: FormData) =>
    modo.tipo === "panel" ? agregarGruposPanel(fd) : agregarGruposPortal(fd);
  const form = useZodForm({
    action: agregar,
    successMessage: null,
    onSuccess: () => setLinks(""),
  });

  function cambiar(
    grupo: GrupoWhatsapp,
    accion: "lleno" | "reabrir" | "borrar",
  ) {
    start(async () => {
      try {
        const r =
          accion === "borrar"
            ? modo.tipo === "panel"
              ? await borrarGrupoPanel(launchId, grupo.id)
              : await borrarGrupoPortal(modo.slug, launchId, grupo.id)
            : modo.tipo === "panel"
              ? await marcarGrupoPanel(launchId, grupo.id, accion === "lleno")
              : await marcarGrupoPortal(
                  modo.slug,
                  launchId,
                  grupo.id,
                  accion === "lleno",
                );
        if (r?.error) toast.error(r.error);
        else
          toast.success(
            accion === "borrar"
              ? "Grupo borrado"
              : accion === "lleno"
                ? "Grupo marcado como lleno"
                : "Grupo reabierto",
          );
      } catch {
        toast.error(
          "No se pudo actualizar el grupo: recargá la página y probá de nuevo",
        );
      }
    });
  }

  const vigente = grupoVigente(grupos);
  const libres = gruposLibres(grupos);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        Los grupos se cargan por adelantado: el link para compartir manda a
        cada persona al grupo vigente, y cuando uno se llena pasa solo al
        siguiente.
      </p>

      {grupos.length > 0 && libres <= AVISO_GRUPOS_LIBRES && (
        <p
          role="status"
          className="rounded-lg border border-badge-warning-text/30 bg-badge-warning-background px-3 py-2 text-sm text-badge-warning-text"
        >
          {libres === 0
            ? "No quedan grupos libres: la gente está entrando al último grupo. Cargá uno nuevo."
            : "Queda un solo grupo libre: cargá los próximos para que nadie se quede afuera."}
        </p>
      )}

      {grupos.length > 0 && (
        <ol className="flex flex-col divide-y divide-card-border rounded-lg border border-card-border">
          {grupos.map((g, i) => {
            const estado = estadoGrupo(g, vigente);
            const avance = Math.min(Math.round((g.joins / g.cap) * 100), 100);
            return (
              <li
                key={g.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3"
              >
                <span className="w-6 text-sm font-semibold tabular-nums text-text-tertiary">
                  {i + 1}
                </span>
                <a
                  href={g.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-text-primary hover:underline"
                  title={g.url}
                >
                  {g.url.replace("https://", "")}
                </a>
                <Badge
                  color={ETIQUETA[estado].color}
                  size="sm"
                  className="rounded-md"
                >
                  {ETIQUETA[estado].texto}
                </Badge>
                <div className="flex w-36 flex-col gap-1">
                  <span className="text-xs tabular-nums text-text-secondary">
                    {g.joins.toLocaleString("es-AR")} /{" "}
                    {g.cap.toLocaleString("es-AR")} personas
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-background-gray-secondary">
                    <span
                      className="block h-full rounded-full bg-primary-500"
                      style={{ width: `${avance}%` }}
                    />
                  </span>
                </div>
                <span className="flex items-center gap-3 text-xs font-medium">
                  {enElTope(g) ? null : g.full_at ? (
                    <button
                      type="button"
                      disabled={pendiente}
                      onClick={() => cambiar(g, "reabrir")}
                      className="text-primary-500 hover:underline"
                    >
                      Reabrir
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={pendiente}
                      onClick={() => cambiar(g, "lleno")}
                      className="text-primary-500 hover:underline"
                    >
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
          })}
        </ol>
      )}

      <form onSubmit={form.onSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="launch_id" value={launchId} />
        {modo.tipo === "portal" && (
          <input type="hidden" name="slug" value={modo.slug} />
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-input-label-text">
            {grupos.length === 0 ? "Links de los grupos" : "Agregar grupos"}
          </span>
          <TextArea
            name="links"
            rows={3}
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder={
              "https://chat.whatsapp.com/…\nhttps://chat.whatsapp.com/…"
            }
            className="w-full"
          />
          <span className="text-xs text-text-tertiary">
            Uno por línea, en el orden en que se van a usar. Podés cargar varios
            por adelantado.
          </span>
        </label>
        <FormError message={form.formError} />
        <Button
          type="submit"
          className="self-end"
          isDisabled={form.pending || links.trim() === ""}
        >
          {form.pending ? "Guardando…" : "Agregar"}
        </Button>
      </form>
    </div>
  );
}
