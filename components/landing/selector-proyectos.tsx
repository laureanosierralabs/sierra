"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Proyecto } from "@/lib/landing/tipos";

/**
 * Una cotización puede cubrir varios proyectos, así que esto es multiselect.
 * Se agrupa por cliente porque al cotizar se piensa por cliente, y el cliente
 * que paga no siempre es el del proyecto (una agencia intermediaria factura
 * el trabajo de su propio cliente).
 */
export function SelectorProyectos({
  proyectos,
  clientePor,
  defaultValue = [],
  name = "project_ids",
  asignado,
  moneda,
}: {
  proyectos: Pick<Proyecto, "id" | "name" | "client_id">[];
  clientePor: Map<string, string>;
  defaultValue?: string[];
  name?: string;
  /** Presente = se ofrece repartir el total entre los proyectos elegidos. */
  asignado?: Record<string, number>;
  moneda?: string;
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

  if (proyectos.length === 0) {
    return <p className="text-xs text-text-3">Todavía no hay proyectos.</p>;
  }

  const grupos = new Map<string, typeof proyectos>();
  for (const p of proyectos) {
    const cliente =
      (p.client_id ? clientePor.get(p.client_id) : null) ?? "Sin cliente";
    grupos.set(cliente, [...(grupos.get(cliente) ?? []), p]);
  }

  const ordenados = [...grupos.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "es"),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-56 overflow-y-auto rounded-lg border border-line bg-ground p-1.5">
        {ordenados.map(([cliente, lista]) => (
          <div key={cliente} className="mb-1.5 last:mb-0">
            <p className="px-1.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-text-3">
              {cliente}
            </p>
            {lista.map((p) => {
              const activo = elegidos.has(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-2"
                >
                  {/* El label cubre checkbox y nombre; el monto queda
                      afuera para que escribir no alterne la selección. */}
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      name={name}
                      value={p.id}
                      defaultChecked={activo}
                      onChange={() => alternar(p.id)}
                      className="peer sr-only"
                    />
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        activo
                          ? "border-text bg-text text-ground"
                          : "border-line-strong"
                      }`}
                    >
                      {activo && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="truncate text-sm">{p.name}</span>
                  </label>

                  {/* Cuánto del total corresponde a este proyecto. Vacío
                      queda sin asignar: no se reparte por promedio. */}
                  {asignado && activo && (
                    <input
                      type="text"
                      inputMode="decimal"
                      name={`alloc_${p.id}`}
                      defaultValue={asignado[p.id]?.toString() ?? ""}
                      placeholder={moneda ?? "—"}
                      aria-label={`Monto asignado a ${p.name}`}
                      className="tnum w-24 shrink-0 rounded border border-line bg-surface px-2 py-1 text-right text-xs outline-none focus:border-line-strong"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-text-3">
        {elegidos.size === 0
          ? "Sin proyectos vinculados"
          : `${elegidos.size} ${elegidos.size === 1 ? "proyecto" : "proyectos"}`}
      </p>
    </div>
  );
}
