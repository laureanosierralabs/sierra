"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

/**
 * Imagen que entra de a poco: mientras baja se ve el brillo del skeleton de la
 * marca, y al terminar aparece desenfocada y se enfoca. Para portadas y fotos
 * de URLs externas (no pasan por next/image).
 */
export function ImagenProgresiva({ src, alt = "", className }: { src: string; alt?: string; className?: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [cargada, setCargada] = useState(false);

  // Si ya estaba en caché, el evento load pudo dispararse antes de hidratar.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setCargada(true);
  }, [src]);

  return (
    <>
      {!cargada && <span aria-hidden="true" className="skeleton-marca absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        onLoad={() => setCargada(true)}
        className={cn(
          className,
          "transition-[opacity,filter,scale] duration-700 ease-out motion-reduce:transition-none",
          cargada ? "opacity-100 blur-0" : "scale-[1.03] opacity-0 blur-md",
        )}
      />
    </>
  );
}
