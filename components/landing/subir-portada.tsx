"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Pencil } from "lucide-react";
import { subirPortada } from "@/app/landing-pages/acciones";

/**
 * Subida de portada para la card. Versión compacta de PortadaProyecto: acá
 * no hay espacio para el botón de borrar, que vive en el detalle.
 */
export function SubirPortada({
  projectId,
  tienePortada,
}: {
  projectId: string;
  tienePortada: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);
  const [pendiente, iniciar] = useTransition();

  function subir(archivo: File) {
    setError(false);
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("portada", archivo);

    iniciar(async () => {
      try {
        await subirPortada(fd);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <>
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
      <button
        type="button"
        disabled={pendiente}
        aria-label={tienePortada ? "Cambiar portada" : "Subir portada"}
        title={
          error
            ? "No se pudo subir"
            : tienePortada
              ? "Cambiar portada"
              : "Subir portada"
        }
        onClick={(e) => {
          // La card navega al proyecto: este click no debe propagarse.
          e.preventDefault();
          e.stopPropagation();
          inputRef.current?.click();
        }}
        className={`rounded-md bg-ground/90 p-1.5 backdrop-blur transition-colors disabled:opacity-50 ${
          error ? "text-critical" : "text-text-2 hover:text-text"
        }`}
      >
        {tienePortada ? (
          <Pencil className="size-3.5" />
        ) : (
          <ImagePlus className="size-3.5" />
        )}
      </button>
    </>
  );
}
