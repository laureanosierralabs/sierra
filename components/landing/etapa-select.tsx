"use client";

import { useTransition } from "react";
import { cambiarEtapaProyecto } from "@/app/landing-pages/acciones";
import { ETAPAS, LABEL_ETAPA, type Etapa } from "@/lib/landing/tipos";

export function EtapaSelect({
  id,
  valor,
}: {
  id: string;
  valor: Etapa | null;
}) {
  const [pendiente, iniciar] = useTransition();

  return (
    <select
      value={valor ?? ""}
      disabled={pendiente}
      aria-label="Cambiar etapa"
      onChange={(e) => {
        const nueva = e.target.value;
        iniciar(async () => {
          await cambiarEtapaProyecto(id, nueva);
        });
      }}
      className="cursor-pointer rounded-md border border-line bg-surface-2 px-2 py-1 text-xs text-text outline-none transition-colors hover:border-line-strong disabled:opacity-50"
    >
      <option value="">Sin etapa</option>
      {ETAPAS.map((e) => (
        <option key={e} value={e}>
          {LABEL_ETAPA[e]}
        </option>
      ))}
    </select>
  );
}
