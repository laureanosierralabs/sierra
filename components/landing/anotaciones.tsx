"use client";

import { useRef, useState, useTransition } from "react";
import { PenToSquare } from "@tailgrids/icons";
import { guardarAnotaciones } from "@/app/landing-pages/acciones";
import { SeccionTitulo } from "@/components/landing/ui";
import { TextArea } from "@/components/tailgrids/core/text-area";

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
        icono={PenToSquare}
        accion={
          <span className="text-xs text-text-tertiary" role="status">
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

      <TextArea
        aria-label="Anotaciones importantes"
        defaultValue={valor ?? ""}
        onBlur={alSalir}
        rows={4}
        placeholder="Lo que no se puede olvidar de este proyecto…"
        className="leading-relaxed"
      />
    </section>
  );
}
