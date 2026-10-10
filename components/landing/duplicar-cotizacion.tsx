"use client";

import { useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Copy1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { BOTON_ICONO } from "@/components/landing/boton-icono";
import { duplicarCotizacion } from "@/app/landing-pages/acciones";

/** Duplica la cotización con sus proyectos y abre la copia. */
export function DuplicarCotizacion({ id }: { id: string }) {
  const [pendiente, iniciar] = useTransition();

  return (
    <button
      type="button"
      disabled={pendiente}
      aria-label="Duplicar cotización"
      title="Duplicar (queda en borrador, sin cobros)"
      onClick={() =>
        iniciar(async () => {
          try {
            await duplicarCotizacion(id);
          } catch (e) {
            // La action redirige a la copia: esa "excepción" no es un error.
            unstable_rethrow(e);
            toast.error(e instanceof Error ? e.message : "No se pudo duplicar la cotización");
          }
        })
      }
      className={BOTON_ICONO}
    >
      <Copy1 />
    </button>
  );
}
