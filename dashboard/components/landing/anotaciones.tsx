"use client";

import { useRef, useState, useTransition } from "react";
import { guardarAnotaciones } from "@/app/landing-pages/acciones";

/** Textarea que persiste al salir del foco. Alcanza para V1. */
export function Anotaciones({
  projectId,
  valor,
}: {
  projectId: string;
  valor: string | null;
}) {
  const guardado = useRef(valor ?? "");
  const [estado, setEstado] = useState<"limpio" | "guardado" | "error">("limpio");
  const [pendiente, iniciar] = useTransition();

  function alSalir(e: React.FocusEvent<HTMLTextAreaElement>) {
    const actual = e.target.value;
    if (actual === guardado.current) return;

    iniciar(async () => {
      try {
        await guardarAnotaciones(projectId, actual);
        guardado.current = actual;
        setEstado("guardado");
      } catch {
        setEstado("error");
      }
    });
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold">Anotaciones importantes</h2>
        <span className="text-xs text-text-3">
          {pendiente
            ? "Guardando…"
            : estado === "guardado"
              ? "Guardado"
              : estado === "error"
                ? "No se pudo guardar"
                : ""}
        </span>
      </div>

      <textarea
        defaultValue={valor ?? ""}
        onBlur={alSalir}
        rows={4}
        placeholder="Lo que no se puede olvidar de este proyecto…"
        className="w-full rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-text outline-none transition-colors focus:border-line-strong"
      />
    </section>
  );
}
