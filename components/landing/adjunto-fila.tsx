"use client";

import { useState } from "react";
import { ExpandArrowTopRightSquare1, FileText, Link1AngularRight } from "@tailgrids/icons";
import { toast } from "sonner";
import { borrarAdjunto, urlAdjunto } from "@/app/landing-pages/acciones";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { esArchivo, tamanoLegible, type Adjunto } from "@/lib/landing/tipos";

export function AdjuntoFila({ adjunto }: { adjunto: Adjunto }) {
  const [abriendo, setAbriendo] = useState(false);
  const archivo = esArchivo(adjunto);
  const peso = tamanoLegible(adjunto.size_bytes);

  // El bucket es privado: la URL se pide al momento y dura 5 minutos.
  async function abrir() {
    setAbriendo(true);
    try {
      const url = await urlAdjunto(adjunto.id);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("No se pudo abrir el archivo.");
    } finally {
      setAbriendo(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-background-gray-secondary">
      <span className="flex min-w-0 items-center gap-2">
        {archivo ? (
          <FileText className="size-4 shrink-0 text-text-tertiary" />
        ) : (
          <Link1AngularRight className="size-4 shrink-0 text-text-tertiary" />
        )}

        {archivo ? (
          <button
            type="button"
            onClick={abrir}
            disabled={abriendo}
            className="truncate text-sm text-text-primary hover:underline disabled:opacity-60"
          >
            {abriendo ? "Abriendo…" : adjunto.name}
          </button>
        ) : (
          <a
            href={adjunto.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-1.5 text-sm text-text-primary hover:underline"
          >
            <span className="truncate">{adjunto.name}</span>
            <ExpandArrowTopRightSquare1 className="size-3.5 shrink-0 text-text-tertiary" />
          </a>
        )}

        {peso && <span className="shrink-0 text-xs text-text-tertiary">{peso}</span>}
      </span>

      <BorrarBoton
        etiqueta="Borrar adjunto"
        onConfirmar={() => borrarAdjunto(adjunto.id, adjunto.task_id)}
      />
    </li>
  );
}
