"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Upload1 } from "@tailgrids/icons";
import {
  borrarDocumento,
  subirDocumento,
  urlDocumento,
} from "@/app/landing-pages/acciones";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { Button } from "@/components/tailgrids/core/button";

function MensajeError({ children }: { children: React.ReactNode }) {
  return (
    <span role="alert" className="text-xs text-input-error">
      {children}
    </span>
  );
}

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
        <Button
          appearance="outline"
          size="xs"
          className="gap-1 px-2"
          isDisabled={pendiente}
          onPress={() => inputRef.current?.click()}
        >
          <Upload1 />
          {pendiente ? "Subiendo…" : "Subir PDF"}
        </Button>
        {error && <MensajeError>{error}</MensajeError>}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <Button appearance="outline" size="xs" className="gap-1 px-2" onPress={abrir}>
        <FileText />
        Ver PDF
      </Button>
      <BorrarBoton etiqueta="Quitar PDF" onConfirmar={() => borrarDocumento(quoteId)} />
      {error && <MensajeError>{error}</MensajeError>}
    </span>
  );
}
