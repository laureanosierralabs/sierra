"use client";

import { useOptimistic, useTransition } from "react";
import { StarIcon } from "@tailgrids/icons";
import { toast } from "sonner";
import { destacarCliente } from "@/app/landing-pages/acciones";

/** Estrella para fijar un cliente arriba de la lista. Cambia al instante y vuelve atrás si falla. */
export function DestacarCliente({ id, destacado }: { id: string; destacado: boolean }) {
  const [pendiente, iniciar] = useTransition();
  const [activo, setActivo] = useOptimistic(destacado);
  const etiqueta = activo ? "Quitar de destacados" : "Destacar cliente";

  return (
    <button
      type="button"
      aria-label={etiqueta}
      aria-pressed={activo}
      title={etiqueta}
      disabled={pendiente}
      onClick={() =>
        iniciar(async () => {
          setActivo(!activo);
          try {
            await destacarCliente(id, !activo);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "No se pudo destacar el cliente");
          }
        })
      }
      className={`rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-4 ${
        activo ? "text-amber-500 [&>svg]:fill-current" : "text-text-tertiary hover:text-text-primary"
      }`}
    >
      <StarIcon />
    </button>
  );
}
