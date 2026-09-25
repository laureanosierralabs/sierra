"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, X } from "lucide-react";

/**
 * Panel que entra desde la derecha. Cerrarlo vuelve atrás en el historial,
 * porque se abre sobre una ruta interceptada.
 */
export function PanelLateral({
  titulo,
  verCompletoEn,
  acciones,
  children,
}: {
  titulo: string;
  verCompletoEn: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKey);
    cerrarRef.current?.focus();

    // El fondo no debe scrollear mientras el panel está abierto.
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onMouseDown={(e) => e.target === e.currentTarget && router.back()}
    >
      <aside className="panel-lateral flex h-full w-full flex-col border-l border-line bg-ground shadow-2xl sm:w-[58%] sm:min-w-125">
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <h1 className="min-w-0 font-display text-lg font-bold">{titulo}</h1>

          <span className="flex shrink-0 items-center gap-3">
            {acciones}
            <a
              href={verCompletoEn}
              aria-label="Abrir en pantalla completa"
              title="Abrir en pantalla completa"
              className="text-text-3 transition-colors hover:text-text"
            >
              <Maximize2 className="size-3.5" />
            </a>
            <button
              ref={cerrarRef}
              type="button"
              onClick={() => router.back()}
              aria-label="Cerrar"
              className="text-text-3 transition-colors hover:text-text"
            >
              <X className="size-4" />
            </button>
          </span>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}
