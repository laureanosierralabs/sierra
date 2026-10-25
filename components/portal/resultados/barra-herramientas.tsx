"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Download1, FileText, Sparkle } from "@tailgrids/icons";
import { toast } from "sonner";
import { OPCIONES_PERIODO, type PeriodoResultados } from "@/lib/lanzamientos/resultados";
import type { PaginaLanzamiento } from "@/lib/lanzamientos/tipos";
import { cn } from "@/utils/cn";

const BOTON =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-40 [&>svg]:size-4";

/** Botón que copia el prompt para IA; confirma con un check y un aviso. */
function BotonCopiarPrompt({ obtenerPrompt }: { obtenerPrompt: () => string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(obtenerPrompt());
      setCopiado(true);
      toast.success("Prompt copiado. Pégalo en ChatGPT o Claude.");
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      toast.error("No se pudo copiar. Revisa los permisos del navegador.");
    }
  }

  return (
    <button type="button" onClick={copiar} className={cn(BOTON, "bg-white text-neutral-950 hover:bg-white/85")}>
      {copiado ? <Check /> : <Sparkle />}
      <span aria-live="polite">{copiado ? "Copiado" : "Copiar prompt para IA"}</span>
    </button>
  );
}

/**
 * Lo que se elige arriba de los resultados (período y landing) y las acciones
 * de la derecha: prompt para IA, CSV y reporte. Todo lo de abajo obedece estos
 * dos filtros.
 */
export function BarraHerramientas({
  periodo,
  onPeriodo,
  paginas,
  landingId,
  onLanding,
  obtenerPrompt,
  onCsv,
  csvDeshabilitado,
  reporteHref,
}: {
  periodo: PeriodoResultados;
  onPeriodo: (p: PeriodoResultados) => void;
  paginas: Pick<PaginaLanzamiento, "id" | "name">[];
  landingId: string | null;
  onLanding: (id: string | null) => void;
  obtenerPrompt: () => string;
  onCsv: () => void;
  csvDeshabilitado: boolean;
  reporteHref: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Período" className="flex rounded-full bg-white/5 p-1 ring-1 ring-white/10">
          {OPCIONES_PERIODO.map((o) => (
            <button
              key={o.valor}
              type="button"
              aria-pressed={o.valor === periodo}
              onClick={() => onPeriodo(o.valor)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:px-4",
                o.valor === periodo ? "bg-primary-500 text-white" : "text-white/60 hover:text-white",
              )}
            >
              {o.etiqueta}
            </button>
          ))}
        </div>

        {paginas.length > 1 && (
          <select
            aria-label="Landing"
            value={landingId ?? ""}
            onChange={(e) => onLanding(e.target.value || null)}
            className="h-9 max-w-full rounded-full bg-white/5 px-4 text-sm font-medium text-white ring-1 ring-white/10 outline-none [color-scheme:dark] focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <option value="">Todas las landings</option>
            {paginas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <BotonCopiarPrompt obtenerPrompt={obtenerPrompt} />
        <button
          type="button"
          onClick={onCsv}
          disabled={csvDeshabilitado}
          className={cn(BOTON, "bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10")}
        >
          <Download1 />
          Descargar CSV
        </button>
        <Link href={reporteHref} className={cn(BOTON, "bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10")}>
          <FileText />
          Reporte PDF
        </Link>
      </div>
    </div>
  );
}
