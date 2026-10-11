"use client";

import { Download1 } from "@tailgrids/icons";

/**
 * Abre la impresión del navegador; ahí se elige "Guardar como PDF". El nombre
 * sugerido del archivo sale del <title> de la página.
 */
export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-doc-navy px-4 py-2 text-sm font-medium text-doc-paper transition-opacity hover:opacity-90 [&>svg]:size-4"
    >
      <Download1 />
      Descargar PDF
    </button>
  );
}
