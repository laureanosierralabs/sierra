"use client";

import { useState } from "react";
import { Check, Copy1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

/**
 * Copia un texto al portapapeles y avisa con un toast. Dos formas: chip con
 * texto (acciones rápidas de la tarjeta) o botón de ícono (bloques de código).
 */
export function CopiarBoton({
  texto,
  etiqueta,
  mensaje,
  soloIcono = false,
  className,
}: {
  texto: string;
  /** Nombre visible y accesible del botón ("Copiar código"). */
  etiqueta: string;
  /** Toast al copiar. */
  mensaje: string;
  soloIcono?: boolean;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1200);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  const icono = copiado ? <Check className="size-3.5 text-success-500" /> : <Copy1 className="size-3.5" />;

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-text-secondary transition-colors outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500",
        !soloIcono && "border border-card-border bg-card-background px-2 py-1 hover:border-primary-500",
        className,
      )}
    >
      {icono}
      {!soloIcono && etiqueta}
    </button>
  );
}
