"use client";

import { CampoChecklist } from "@/components/landing/campo-checklist";
import { CampoChecklistLibre } from "@/components/landing/campo-checklist-libre";
import { CampoOpciones } from "@/components/landing/campo-opciones";
import { CampoTexto } from "@/components/landing/campo-texto";
import type { Campo, ValorCampo } from "@/lib/landing/plantillas";

/** Elige el control según `campo.tipo` y le pone su etiqueta y ayuda. */
export function CampoRender({
  campo,
  valor,
  onCambio,
}: {
  campo: Campo;
  valor: ValorCampo;
  onCambio: (v: ValorCampo) => void;
}) {
  return (
    <div>
      {campo.label && (
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">{campo.label}</p>
      )}
      {campo.ayuda && (
        <p className="mb-1.5 text-xs text-text-tertiary">{campo.ayuda}</p>
      )}
      {campo.tipo === "checklist-libre" ? (
        <CampoChecklistLibre valor={valor} onCambio={onCambio} />
      ) : campo.tipo === "checklist" ? (
        <CampoChecklist campo={campo} valor={valor} onCambio={onCambio} />
      ) : campo.tipo === "opciones" ? (
        <CampoOpciones campo={campo} valor={valor} onCambio={onCambio} />
      ) : (
        <CampoTexto campo={campo} valor={valor} onCambio={onCambio} />
      )}
    </div>
  );
}
