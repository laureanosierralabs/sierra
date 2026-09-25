"use client";

import { useRef, useState, useTransition } from "react";
import { StickyNote } from "lucide-react";
import { guardarAnotaciones } from "@/app/landing-pages/acciones";
import { SeccionTitulo } from "@/components/landing/ui";

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
      <SeccionTitulo
        icono={StickyNote}
        accion={
          <span className="text-xs text-text-3">
            {pendiente
              ? "Guardando…"
              : estado === "guardado"
                ? "Guardado"
                : estado === "error"
                  ? "No se pudo guardar"
                  : ""}
          </span>
        }
      >
        Anotaciones importantes
      </SeccionTitulo>

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
