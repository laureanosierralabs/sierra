"use client";

import { useState } from "react";
import type { Miembro } from "@/lib/landing/tipos";

const CHIP =
  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors";

/**
 * Reemplaza al <select> de un solo responsable: puede haber más de una
 * persona asignada. Cada chip es un checkbox nativo con el mismo `name`,
 * así FormData.getAll() en el servidor devuelve el set completo.
 */
export function SelectorMiembros({
  miembros,
  defaultValue = [],
  name = "assignee_ids",
}: {
  miembros: Miembro[];
  defaultValue?: string[];
  name?: string;
}) {
  const [elegidos, setElegidos] = useState<Set<string>>(new Set(defaultValue));

  function alternar(id: string) {
    setElegidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (miembros.length === 0) {
    return <p className="text-xs text-text-3">Todavía no hay miembros en el equipo.</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {miembros.map((m) => {
        const activo = elegidos.has(m.id);
        return (
          <label key={m.id} className="cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={m.id}
              defaultChecked={activo}
              onChange={() => alternar(m.id)}
              className="peer sr-only"
            />
            <span
              className={`${CHIP} ${
                activo
                  ? "border-line-strong bg-surface-2 text-text"
                  : "border-line text-text-2 hover:text-text"
              }`}
            >
              {m.nombre}
            </span>
          </label>
        );
      })}
    </div>
  );
}
