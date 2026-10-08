"use client";

import { useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Copy1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { BOTON_ICONO } from "@/components/landing/boton-icono";
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
          try {
            await duplicarProyecto(id);
          } catch (e) {
            // La action redirige a la copia: esa "excepción" no es un error.
            unstable_rethrow(e);
            toast.error(e instanceof Error ? e.message : "No se pudo duplicar el proyecto");
          }
        })
      }
      className={BOTON_ICONO}
    >
      <Copy1 />
    </button>
  );
}
