"use client";

import { useRef, useState, useTransition } from "react";
import { Gallery } from "@tailgrids/icons";
import { borrarPortada, subirPortada } from "@/app/landing-pages/acciones";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { Button } from "@/components/tailgrids/core/button";

/** Sube y quita la portada del proyecto. El bucket de portadas es público. */
export function PortadaProyecto({
  projectId,
  coverUrl,
}: {
  projectId: string;
  coverUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function subir(archivo: File) {
    setError(null);
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("portada", archivo);

    iniciar(async () => {
      try {
        await subirPortada(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo subir");
      }
    });
  }

  const entrada = (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) subir(f);
        e.target.value = "";
      }}
    />
  );

  if (!coverUrl) {
    return (
      <div className="border-b border-card-border px-4 py-3">
        {entrada}
        <Button
          appearance="outline"
          size="sm"
          isDisabled={pendiente}
          onPress={() => inputRef.current?.click()}
        >
          <Gallery />
          {pendiente ? "Subiendo…" : "Agregar portada"}
        </Button>
        {error && <p className="mt-1 text-xs text-input-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="group/portada relative border-b border-card-border">
      {entrada}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={coverUrl} alt="" className="h-32 w-full object-cover" />

      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/portada:opacity-100">
        <Button
          appearance="outline"
          size="xs"
          isDisabled={pendiente}
          onPress={() => inputRef.current?.click()}
          className="bg-card-background/90 backdrop-blur"
        >
          {pendiente ? "Subiendo…" : "Cambiar"}
        </Button>
        <span className="rounded-md bg-card-background/90 px-1.5 py-1 backdrop-blur">
          <BorrarBoton
            etiqueta="Quitar portada"
            onConfirmar={() => borrarPortada(projectId)}
          />
        </span>
      </div>

      {error && (
        <p className="absolute bottom-2 left-2 rounded bg-card-background/90 px-2 py-1 text-xs text-input-error backdrop-blur">
          {error}
        </p>
      )}
    </div>
  );
}
