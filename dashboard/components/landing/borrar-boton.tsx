"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

/**
 * Borrado con confirmación en modal. No hay undo, así que el click directo no
 * alcanza; `advertencia` explica qué más se lleva puesto cuando hay cascade.
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
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", onKey);
    // El foco arranca en Cancelar: Enter por reflejo no borra nada.
    cancelarRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        aria-label={etiqueta}
        title={etiqueta}
        onClick={() => {
          setError(null);
          setAbierto(true);
        }}
        className="text-text-3 transition-colors hover:text-critical"
      >
        <Trash2 className="size-3.5" />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={etiqueta}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[20vh]"
          onMouseDown={(e) => e.target === e.currentTarget && setAbierto(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-critical-dim text-critical">
                <AlertTriangle className="size-4" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-sm font-bold">{etiqueta}</h2>
                <p className="mt-1 text-sm text-text-2">
                  {advertencia
                    ? `${advertencia} Esta acción no se puede deshacer.`
                    : "Esta acción no se puede deshacer."}
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-critical-dim px-3 py-2 text-sm text-critical">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelarRef}
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-lg px-3 py-2 text-sm text-text-2 transition-colors hover:text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  iniciar(async () => {
                    try {
                      await onConfirmar();
                      setAbierto(false);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "No se pudo borrar",
                      );
                    }
                  })
                }
                className="rounded-lg bg-critical px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pendiente ? "Borrando…" : "Borrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
