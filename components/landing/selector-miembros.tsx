"use client";

import { useState } from "react";
import type { Miembro } from "@/lib/landing/tipos";
import { cn } from "@/utils/cn";

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
    return (
      <p className="text-xs text-text-tertiary">Todavía no hay miembros en el equipo.</p>
    );
  }

  return (
    <div role="group" className="flex flex-wrap gap-1.5">
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
              className={cn(
                "inline-block rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500",
                activo
                  ? "border-primary-500 bg-background-gray-secondary text-text-primary"
                  : "border-card-border text-text-secondary hover:text-text-primary",
              )}
            >
              {m.nombre}
            </span>
          </label>
        );
      })}
    </div>
  );
}
