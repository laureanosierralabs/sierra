"use client";

import { TextArea } from "@/components/tailgrids/core/text-area";
import type { Campo, ValorCampo } from "@/lib/landing/plantillas";

/** Texto libre: guarda al salir del campo, y solo si cambió. */
export function CampoTexto({
  campo,
  valor,
  onCambio,
}: {
  campo: Campo;
  valor: ValorCampo;
  onCambio: (v: ValorCampo) => void;
}) {
  const actual = typeof valor === "string" ? valor : "";

  return (
    <TextArea
      aria-label={campo.label || "Texto"}
      defaultValue={actual}
      onBlur={(e) => {
        const v = e.target.value.trim();
        if (v !== actual) onCambio(v || null);
      }}
      rows={campo.filas ?? 2}
      placeholder="Escribí acá…"
      className="px-3 py-2 text-sm"
    />
  );
}
