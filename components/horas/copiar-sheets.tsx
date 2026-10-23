"use client";

import { Copy1 } from "@tailgrids/icons";
import { toast } from "sonner";

/**
 * Copia las filas filtradas separadas por tabulaciones: en Google Sheets se
 * pegan parado en la primera celda libre de la columna "Dia" y cada dato cae
 * en su columna.
 */
export function CopiarParaSheets({ texto, filas }: { texto: string; filas: number }) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(`${filas} ${filas === 1 ? "fila copiada" : "filas copiadas"}: pegalas en la planilla`);
    } catch {
      toast.error("No se pudo copiar");
    }
  }
  return (
    <button
      type="button"
      onClick={copiar}
      disabled={filas === 0}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline disabled:opacity-50 [&>svg]:size-4"
    >
      <Copy1 />
      Copiar para Google Sheets
    </button>
  );
}
