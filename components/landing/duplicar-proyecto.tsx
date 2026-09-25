"use client";

import { useTransition } from "react";
import { Copy } from "lucide-react";
import { duplicarProyecto } from "@/app/landing-pages/acciones";

/** Duplica el proyecto con su checklist y abre la copia. */
export function DuplicarProyecto({ id }: { id: string }) {
  const [pendiente, iniciar] = useTransition();

  return (
    <button
      type="button"
      disabled={pendiente}
      aria-label="Duplicar proyecto"
      title="Duplicar con sus tareas y recursos"
      onClick={() =>
        iniciar(async () => {
          await duplicarProyecto(id);
        })
      }
      className="text-text-3 transition-colors hover:text-text disabled:opacity-50"
    >
      <Copy className="size-3.5" />
    </button>
  );
}
