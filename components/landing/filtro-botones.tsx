"use client";

import { Button } from "@/components/tailgrids/core/button";

export interface OpcionFiltro<T extends string> {
  valor: T;
  etiqueta: string;
  cantidad: number;
}

/** Grupo de opciones excluyentes con su contador: la opción activa va rellena. */
export function FiltroBotones<T extends string>({
  opciones,
  valor,
  onChange,
  etiqueta,
}: {
  opciones: OpcionFiltro<T>[];
  valor: T;
  onChange: (valor: T) => void;
  /** Nombre accesible del grupo. */
  etiqueta: string;
}) {
  return (
    <div role="group" aria-label={etiqueta} className="flex flex-wrap items-center gap-1.5">
      {opciones.map((o) => (
        <Button
          key={o.valor}
          size="xs"
          appearance={o.valor === valor ? "fill" : "outline"}
          aria-pressed={o.valor === valor}
          onPress={() => onChange(o.valor)}
        >
          {o.etiqueta}
          <span className="tabular-nums opacity-70">{o.cantidad}</span>
        </Button>
      ))}
    </div>
  );
}
