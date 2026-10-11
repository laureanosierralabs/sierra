"use client";

import { useTransition } from "react";
import { Copy1, ExpandArrowTopRightSquare1, Link1AngularRight } from "@tailgrids/icons";
import { toast } from "sonner";
import { Button } from "@/components/tailgrids/core/button";
import { generarLinkCotizacion, revocarLinkCotizacion } from "@/app/landing-pages/acciones";

/**
 * Link público de la cotización: el cliente la ve y la descarga en PDF sin
 * cuenta. Regenerar invalida el link anterior.
 */
export function LinkCotizacion({ id, token }: { id: string; token: string | null }) {
  const [pendiente, iniciar] = useTransition();
  const ruta = token ? `/q/${token}` : null;

  const correr = (accion: () => Promise<void>, ok: string) =>
    iniciar(async () => {
      try {
        await accion();
        toast.success(ok);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar el link");
      }
    });

  async function copiar() {
    if (!ruta) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${ruta}`);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  }

  if (!ruta) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-tertiary">
          Generá un link para mandarle la cotización al cliente. Desde ahí la puede descargar en PDF.
        </p>
        <Button
          size="sm"
          appearance="outline"
          isDisabled={pendiente}
          onPress={() => correr(() => generarLinkCotizacion(id), "Link generado")}
        >
          <Link1AngularRight />
          Generar link
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <code className="min-w-0 truncate rounded-md bg-background-gray-secondary px-2 py-1 text-xs text-text-secondary">
        {ruta}
      </code>
      <span className="flex flex-wrap items-center gap-2">
        <Button size="sm" appearance="outline" onPress={copiar}>
          <Copy1 />
          Copiar link
        </Button>
        <a
          href={ruta}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary-500 hover:underline [&>svg]:size-4"
        >
          <ExpandArrowTopRightSquare1 />
          Ver / PDF
        </a>
        <Button
          size="sm"
          appearance="outline"
          isDisabled={pendiente}
          onPress={() => {
            if (window.confirm("El link actual va a dejar de funcionar. ¿Generar uno nuevo?"))
              correr(() => generarLinkCotizacion(id), "Link nuevo generado");
          }}
        >
          Regenerar
        </Button>
        <Button
          size="sm"
          appearance="outline"
          isDisabled={pendiente}
          onPress={() => {
            if (window.confirm("El cliente ya no va a poder abrir la cotización. ¿Desactivar el link?"))
              correr(() => revocarLinkCotizacion(id), "Link desactivado");
          }}
        >
          Desactivar
        </Button>
      </span>
    </div>
  );
}
