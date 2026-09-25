"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Upload } from "lucide-react";
import {
  borrarDocumento,
  subirDocumento,
  urlDocumento,
} from "@/app/landing-pages/acciones";
import { BorrarBoton } from "@/components/landing/borrar-boton";

/** Sube, abre y borra el PDF de la propuesta. El bucket es privado. */
export function DocumentoCotizacion({
  quoteId,
  tieneDocumento,
}: {
  quoteId: string;
  tieneDocumento: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function subir(archivo: File) {
    setError(null);
    const fd = new FormData();
    fd.set("quote_id", quoteId);
    fd.set("documento", archivo);

    iniciar(async () => {
      try {
        await subirDocumento(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo subir");
      }
    });
  }

  async function abrir() {
    setError(null);
    try {
      const url = await urlDocumento(quoteId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("No se pudo abrir");
    }
  }

  if (!tieneDocumento) {
    return (
      <span className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) subir(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={pendiente}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-text-2 transition-colors hover:border-line-strong hover:text-text disabled:opacity-50"
        >
          <Upload className="size-3" />
          {pendiente ? "Subiendo…" : "Subir PDF"}
        </button>
        {error && <span className="text-xs text-critical">{error}</span>}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-text-2 transition-colors hover:border-line-strong hover:text-text"
      >
        <FileText className="size-3" />
        Ver PDF
      </button>
      <BorrarBoton
        etiqueta="Quitar PDF"
        onConfirmar={() => borrarDocumento(quoteId)}
      />
      {error && <span className="text-xs text-critical">{error}</span>}
    </span>
  );
}
