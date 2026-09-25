"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { borrarPortada, subirPortada } from "@/app/landing-pages/acciones";
import { BorrarBoton } from "@/components/landing/borrar-boton";

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
      <div className="border-b border-line px-4 py-3">
        {entrada}
        <button
          type="button"
          disabled={pendiente}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-xs text-text-2 transition-colors hover:border-line-strong hover:text-text disabled:opacity-50"
        >
          <ImagePlus className="size-3.5" />
          {pendiente ? "Subiendo…" : "Agregar portada"}
        </button>
        {error && <p className="mt-1 text-xs text-critical">{error}</p>}
      </div>
    );
  }

  return (
    <div className="group/portada relative border-b border-line">
      {entrada}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={coverUrl} alt="" className="h-32 w-full object-cover" />

      <div className="absolute right-2 top-2 flex items-center gap-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/portada:opacity-100">
        <button
          type="button"
          disabled={pendiente}
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-ground/90 px-2 py-1 text-xs text-text-2 backdrop-blur transition-colors hover:text-text disabled:opacity-50"
        >
          {pendiente ? "Subiendo…" : "Cambiar"}
        </button>
        <span className="rounded-md bg-ground/90 px-1.5 py-1 backdrop-blur">
          <BorrarBoton
            etiqueta="Quitar portada"
            onConfirmar={() => borrarPortada(projectId)}
          />
        </span>
      </div>

      {error && (
        <p className="absolute bottom-2 left-2 rounded bg-ground/90 px-2 py-1 text-xs text-critical backdrop-blur">
          {error}
        </p>
      )}
    </div>
  );
}
