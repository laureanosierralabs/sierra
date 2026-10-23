"use client";

import { useTransition } from "react";
import { Copy1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { resumenParaCopiar } from "@/app/landing-pages/lanzamiento-acciones";

/**
 * Copia el resumen de métricas del lanzamiento, calculado en el momento del
 * clic (no el de cuando se abrió la página), listo para pegarle al operador.
 */
export function CopiarResumen({ launchId }: { launchId: string }) {
  const [pending, start] = useTransition();

  function copiar() {
    start(async () => {
      const r = await resumenParaCopiar(launchId);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      try {
        await navigator.clipboard.writeText(r.texto);
        toast.success("Resumen copiado");
      } catch {
        toast.error("No se pudo copiar: probá de nuevo");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={copiar}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline disabled:opacity-60 [&>svg]:size-4"
    >
      <Copy1 />
      {pending ? "Calculando…" : "Copiar resumen"}
    </button>
  );
}
