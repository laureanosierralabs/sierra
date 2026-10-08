"use client";

import { Checkbox } from "@/components/tailgrids/core/checkbox";
import { cn } from "@/utils/cn";
import type { Campo, ValorCampo } from "@/lib/landing/plantillas";

export function CampoOpciones({
  campo,
  valor,
  onCambio,
}: {
  campo: Campo;
  valor: ValorCampo;
  onCambio: (v: ValorCampo) => void;
}) {
  const marcadas = Array.isArray(valor) ? valor : valor ? [valor] : [];

  function alternar(opcion: string) {
    if (!campo.multiple) {
      // Una sola opción: volver a tocarla la desmarca.
      onCambio(marcadas[0] === opcion ? null : opcion);
      return;
    }
    onCambio(
      marcadas.includes(opcion)
        ? marcadas.filter((v) => v !== opcion)
        : [...marcadas, opcion],
    );
  }

  return (
    <div
      role={campo.multiple ? "group" : "radiogroup"}
      aria-label={campo.label}
      className="flex flex-col gap-1.5"
    >
      {campo.opciones?.map((o) => {
        const activa = marcadas.includes(o);
        const etiqueta = (
          <span className={cn("text-sm", activa ? "text-text-primary" : "text-text-secondary")}>
            {o}
          </span>
        );

        // Los grupos de una sola opción conservan el radio nativo: el Checkbox
        // del template no expresa "una u otra".
        return campo.multiple ? (
          <Checkbox key={o} isSelected={activa} onChange={() => alternar(o)}>
            {etiqueta}
          </Checkbox>
        ) : (
          <label key={o} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name={campo.id}
              checked={activa}
              onChange={() => alternar(o)}
              className="size-4 accent-primary-500"
            />
            {etiqueta}
          </label>
        );
      })}
    </div>
  );
}
