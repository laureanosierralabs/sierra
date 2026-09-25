"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import { guardarAjuste } from "@/app/landing-pages/acciones";

const CLAVE = "quote_template_url";

/** Link a la plantilla editable de cotizaciones. Es uno solo para todas. */
export function PlantillaCotizacion({ url }: { url: string | null }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function guardar() {
    setError(null);
    iniciar(async () => {
      try {
        await guardarAjuste(CLAVE, valor);
        setEditando(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  if (editando) {
    return (
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && guardar()}
            placeholder="https://figma.com/…"
            autoFocus
            className="min-w-0 flex-1 rounded-lg border border-line bg-ground px-3 py-2 text-sm outline-none transition-colors focus:border-line-strong"
          />
          <button
            type="button"
            disabled={pendiente}
            onClick={guardar}
            className="rounded-lg bg-text px-3 py-2 text-sm font-semibold text-ground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pendiente ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setValor(url ?? "");
              setEditando(false);
            }}
            className="px-2 text-sm text-text-2 hover:text-text"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-critical">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-0 items-center gap-2 text-sm font-medium hover:underline"
        >
          <span className="truncate">Plantilla editable de cotización</span>
          <ExternalLink className="size-3.5 shrink-0 text-text-3" />
        </a>
      ) : (
        <span className="text-sm text-text-3">
          Sin plantilla editable cargada
        </span>
      )}

      <button
        type="button"
        aria-label="Editar link de la plantilla"
        onClick={() => setEditando(true)}
        className="shrink-0 text-text-3 transition-colors hover:text-text"
      >
        <Pencil className="size-3.5" />
      </button>
    </div>
  );
}
