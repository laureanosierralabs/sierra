"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { quitarImagenPortal, subirImagenPortal } from "@/app/landing-pages/portal-entrega-acciones";
import { Button } from "@/components/tailgrids/core/button";
import { cn } from "@/utils/cn";

/**
 * Imagen del portal del cliente (portada de la marca, flyer o banner de un
 * lanzamiento): vista previa, cambiar y quitar.
 */
export function ImagenPortal({
  destino,
  id,
  url,
  titulo,
  ayuda,
  formato,
}: {
  destino: "cliente" | "flyer" | "banner";
  id: string;
  url: string | null;
  titulo: string;
  ayuda: string;
  /** Vertical para el flyer (tarjeta), horizontal para portadas y banners. */
  formato: "vertical" | "horizontal";
}) {
  const archivo = useRef<HTMLInputElement>(null);
  const [pendiente, iniciar] = useTransition();

  const subir = (f: File) =>
    iniciar(async () => {
      const fd = new FormData();
      fd.set("destino", destino);
      fd.set("id", id);
      fd.set("imagen", f);
      const r = await subirImagenPortal(fd).catch(() => ({ error: "No se pudo subir" }));
      if ("error" in r) toast.error(r.error);
      else toast.success(r.aviso);
      if (archivo.current) archivo.current.value = "";
    });

  return (
    <div className="flex gap-4">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-card-border bg-background-gray-secondary text-xs text-text-tertiary",
          formato === "vertical" ? "h-36 w-27" : "h-24 w-44",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagen del bucket público de portadas
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          "Sin imagen"
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-medium text-text-primary">{titulo}</span>
        <span className="text-xs text-text-tertiary">{ayuda}</span>
        <div className="mt-auto flex flex-wrap gap-2">
          <input
            ref={archivo}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subir(f);
            }}
          />
          <Button size="sm" appearance="outline" isDisabled={pendiente} onPress={() => archivo.current?.click()}>
            {pendiente ? "Subiendo…" : url ? "Cambiar" : "Subir imagen"}
          </Button>
          {url && (
            <Button
              size="sm"
              appearance="ghost"
              isDisabled={pendiente}
              onPress={() =>
                iniciar(async () => {
                  const r = await quitarImagenPortal(destino, id).catch(() => ({ error: "No se pudo quitar" }));
                  if ("error" in r) toast.error(r.error);
                  else toast.success(r.aviso);
                })
              }
            >
              Quitar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
