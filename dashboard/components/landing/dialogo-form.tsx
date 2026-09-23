"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";

const INPUT =
  "w-full rounded-lg border border-line bg-ground px-3 py-2 text-sm text-text outline-none transition-colors focus:border-line-strong";

export function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-2">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={INPUT} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={INPUT} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <textarea {...props} className={INPUT} />;
}

/**
 * Modal con formulario. `action` es una Server Action; el diálogo se cierra
 * solo cuando la transición termina sin error, para no ocultar un fallo.
 */
export function DialogoForm({
  titulo,
  etiquetaAbrir,
  action,
  children,
  disparador,
  abiertoExterno,
  onCerrar,
}: {
  titulo: string;
  etiquetaAbrir?: string;
  action: (fd: FormData) => Promise<void>;
  children: React.ReactNode;
  disparador?: React.ReactNode;
  /** Modo controlado: el diálogo se abre desde afuera y no renderiza botón. */
  abiertoExterno?: boolean;
  onCerrar?: () => void;
}) {
  const controlado = abiertoExterno !== undefined;
  const [abiertoInterno, setAbiertoInterno] = useState(false);
  const abierto = controlado ? abiertoExterno : abiertoInterno;

  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const cerrarRef = useRef<HTMLButtonElement>(null);

  const setAbierto = useCallback(
    (v: boolean) => {
      if (controlado) {
        if (!v) onCerrar?.();
      } else {
        setAbiertoInterno(v);
      }
    },
    [controlado, onCerrar],
  );

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", onKey);
    cerrarRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto, setAbierto]);

  function enviar(fd: FormData) {
    setError(null);
    iniciar(async () => {
      try {
        await action(fd);
        setAbierto(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  return (
    <>
      {!controlado && (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={
          disparador
            ? "text-text-3 transition-colors hover:text-text"
            : "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2"
        }
      >
        {disparador ?? (
          <>
            <Plus className="size-4" />
            {etiquetaAbrir}
          </>
        )}
      </button>
      )}

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[8vh]"
          onMouseDown={(e) => e.target === e.currentTarget && setAbierto(false)}
        >
          <div className="w-full max-w-lg rounded-xl border border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-base font-bold">{titulo}</h2>
              <button
                ref={cerrarRef}
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="text-text-3 transition-colors hover:text-text"
              >
                <X className="size-4" />
              </button>
            </div>

            <form action={enviar} className="flex flex-col gap-4 p-5">
              {children}

              {error && (
                <p className="rounded-lg bg-critical-dim px-3 py-2 text-sm text-critical">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded-lg px-3 py-2 text-sm text-text-2 transition-colors hover:text-text"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pendiente}
                  className="rounded-lg bg-text px-4 py-2 text-sm font-semibold text-ground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {pendiente ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
