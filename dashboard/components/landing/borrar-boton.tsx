"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

/**
 * Borrado en dos pasos: no hay undo, así que el click directo no alcanza.
 * `advertencia` explica qué más se lleva puesto cuando hay cascade.
 */
export function BorrarBoton({
  onConfirmar,
  etiqueta = "Borrar",
  advertencia,
}: {
  onConfirmar: () => Promise<void>;
  etiqueta?: string;
  advertencia?: string;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState(false);
  const [pendiente, iniciar] = useTransition();

  if (!confirmar) {
    return (
      <button
        type="button"
        aria-label={etiqueta}
        title={etiqueta}
        onClick={() => setConfirmar(true)}
        className="text-text-3 transition-colors hover:text-critical"
      >
        <Trash2 className="size-3.5" />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      {advertencia && !error && (
        <span className="text-text-3">{advertencia}</span>
      )}
      {error && <span className="text-critical">No se pudo borrar</span>}
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            try {
              await onConfirmar();
            } catch {
              setError(true);
            }
          })
        }
        className="font-medium text-critical hover:underline disabled:opacity-50"
      >
        {pendiente ? "Borrando…" : "Confirmar"}
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirmar(false);
          setError(false);
        }}
        className="text-text-3 hover:text-text"
      >
        Cancelar
      </button>
    </span>
  );
}
