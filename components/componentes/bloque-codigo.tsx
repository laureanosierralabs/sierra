"use client";

import { useState } from "react";
import { CopiarBoton } from "@/components/componentes/copiar-boton";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

/**
 * Bloque de texto copiable (código, prompt, comando). El contenido va como
 * texto dentro de <pre>: React lo escapa, nunca se interpreta como HTML.
 */
export function BloqueCodigo({
  titulo,
  texto,
  etiquetaCopiar,
  mensajeCopiado,
  monoespaciado = true,
  ajustable = false,
  detalle,
}: {
  titulo: string;
  texto: string;
  etiquetaCopiar: string;
  mensajeCopiado: string;
  monoespaciado?: boolean;
  /** Muestra el interruptor para ajustar las líneas largas. */
  ajustable?: boolean;
  /** Dato chico junto al título (por ejemplo, el lenguaje). */
  detalle?: string;
}) {
  const [ajustar, setAjustar] = useState(false);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-card-border px-4 py-2.5">
        <h2 className="text-sm font-semibold text-title-50">{titulo}</h2>
        {detalle && <span className="text-xs text-text-tertiary">{detalle}</span>}
        <span className="ml-auto flex items-center gap-3">
          {ajustable && (
            <button
              type="button"
              aria-pressed={ajustar}
              onClick={() => setAjustar((v) => !v)}
              className="rounded text-xs text-text-tertiary transition-colors outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {ajustar ? "Sin ajuste" : "Ajustar líneas"}
            </button>
          )}
          <CopiarBoton texto={texto} etiqueta={etiquetaCopiar} mensaje={mensajeCopiado} />
        </span>
      </div>
      <pre
        tabIndex={0}
        className={cn(
          "max-h-[32rem] overflow-auto p-4 text-sm leading-6 text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset",
          monoespaciado ? "font-mono" : "font-sans",
          ajustar || !monoespaciado ? "break-words whitespace-pre-wrap" : "whitespace-pre",
        )}
      >
        {texto}
      </pre>
    </Card>
  );
}
