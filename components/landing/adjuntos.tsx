"use client";

import { useRef, useState, useTransition } from "react";
import {
  ExternalLink,
  FileText,
  Link2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import {
  agregarLinkTarea,
  borrarAdjunto,
  subirArchivoTarea,
  urlAdjunto,
} from "@/app/landing-pages/acciones";
import {
  esArchivo,
  tamanoLegible,
  type Adjunto,
} from "@/lib/landing/tipos";

const INPUT =
  "w-full rounded-lg border border-line bg-ground px-3 py-2 text-sm text-text outline-none transition-colors focus:border-line-strong";

function FormLink({ taskId }: { taskId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium transition-colors hover:border-line-strong"
      >
        <Link2 className="size-3.5" />
        Agregar link
      </button>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        iniciar(async () => {
          try {
            await agregarLinkTarea(fd);
            setAbierto(false);
          } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo guardar");
          }
        });
      }}
      className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3"
    >
      <input type="hidden" name="task_id" value={taskId} />

      <input
        name="url"
        required
        autoFocus
        placeholder="https://… (Drive, Fathom, Figma, Notion)"
        className={INPUT}
      />
      <input name="name" placeholder="Nombre (opcional)" className={INPUT} />

      {error && <p className="text-xs text-critical">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-lg px-3 py-1.5 text-xs text-text-2 transition-colors hover:text-text"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-lg bg-text px-3 py-1.5 text-xs font-semibold text-ground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pendiente ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function SubirArchivo({ taskId }: { taskId: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={pendiente}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium transition-colors hover:border-line-strong disabled:opacity-60"
      >
        <Upload className="size-3.5" />
        {pendiente ? "Subiendo…" : "Subir archivo"}
      </button>

      <input
        ref={ref}
        type="file"
        className="hidden"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (!archivo) return;

          const fd = new FormData();
          fd.set("task_id", taskId);
          fd.set("archivo", archivo);

          setError(null);
          iniciar(async () => {
            try {
              await subirArchivoTarea(fd);
            } catch (err) {
              setError(err instanceof Error ? err.message : "No se pudo subir");
            }
          });
          // Permite volver a elegir el mismo archivo si falló.
          e.target.value = "";
        }}
      />

      {error && <p className="w-full text-xs text-critical">{error}</p>}
    </>
  );
}

function Fila({ adjunto }: { adjunto: Adjunto }) {
  const [abriendo, setAbriendo] = useState(false);
  const archivo = esArchivo(adjunto);
  const peso = tamanoLegible(adjunto.size_bytes);

  // El bucket es privado: la URL se pide al momento y dura 5 minutos.
  async function abrir() {
    setAbriendo(true);
    try {
      const url = await urlAdjunto(adjunto.id);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else alert("No se pudo abrir el archivo.");
    } finally {
      setAbriendo(false);
    }
  }

  return (
    <li className="fila-hover group/adj flex items-center justify-between gap-3 px-3 py-2">
      <span className="flex min-w-0 items-center gap-2">
        {archivo ? (
          <FileText className="size-3.5 shrink-0 text-text-3" />
        ) : (
          <Link2 className="size-3.5 shrink-0 text-text-3" />
        )}

        {archivo ? (
          <button
            type="button"
            onClick={abrir}
            disabled={abriendo}
            className="truncate text-sm hover:underline disabled:opacity-60"
          >
            {abriendo ? "Abriendo…" : adjunto.name}
          </button>
        ) : (
          <a
            href={adjunto.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-1.5 text-sm hover:underline"
          >
            <span className="truncate">{adjunto.name}</span>
            <ExternalLink className="size-3 shrink-0 text-text-3" />
          </a>
        )}

        {peso && <span className="shrink-0 text-xs text-text-3">{peso}</span>}
      </span>

      <button
        type="button"
        aria-label="Borrar adjunto"
        onClick={() => {
          if (!confirm(`¿Borrar "${adjunto.name}"?`)) return;
          void borrarAdjunto(adjunto.id, adjunto.task_id);
        }}
        className="shrink-0 text-text-3 opacity-0 transition-opacity hover:text-critical group-hover/adj:opacity-100 focus-visible:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}

/**
 * Links y archivos de la tarea. Un link apunta a donde el material ya vive
 * (Drive, Fathom, Figma); un archivo se sube cuando no vive en ningún lado.
 */
export function Adjuntos({
  taskId,
  adjuntos,
}: {
  taskId: string;
  adjuntos: Adjunto[];
}) {
  return (
    <div className="rounded-xl border border-line bg-surface shadow-e1">
      {adjuntos.length > 0 && (
        <ul className="divide-y divide-line border-b border-line">
          {adjuntos.map((a) => (
            <Fila key={a.id} adjunto={a} />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 p-3">
        <FormLink taskId={taskId} />
        <SubirArchivo taskId={taskId} />

        {adjuntos.length === 0 && (
          <span className="flex items-center gap-1.5 text-xs text-text-3">
            <Paperclip className="size-3" />
            Sin adjuntos
          </span>
        )}
      </div>
    </div>
  );
}
