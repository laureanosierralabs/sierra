"use client";

import Link from "next/link";
import { EstadoSelect } from "@/components/landing/estado-select";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { DuplicarProyecto } from "@/components/landing/duplicar-proyecto";
import { BorrarProyecto } from "@/components/landing/borrar";
import {
  Prioridad,
  TipoPaginaBadge,
  Vencimiento,
  VacioTabla,
} from "@/components/landing/ui";
import {
  nombreCliente,
  type Cliente,
  type Miembro,
  type Proyecto,
} from "@/lib/landing/tipos";

const COLUMNAS = [
  "Proyecto",
  "Cliente",
  "Tipo",
  "Estado",
  "Responsable",
  "Deadline",
  "Prioridad",
  "",
];

export function ProyectosTabla({
  proyectos,
  clientes,
  miembros,
  clientePor,
  nombreMiembro,
}: {
  proyectos: Proyecto[];
  clientes: Cliente[];
  miembros: Miembro[];
  clientePor: Map<string, string>;
  nombreMiembro: Map<string, string>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
      <table className="w-full text-sm">
        {/* Sticky: en listas largas la cabecera es la única referencia
            de qué significa cada columna. */}
        <thead className="sticky top-0 z-10">
          <tr className="vidrio border-b border-line text-left">
            {COLUMNAS.map((h, i) => (
              <th
                key={h || i}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proyectos.length === 0 && (
            <VacioTabla colSpan={COLUMNAS.length}>
              Todavía no hay proyectos.
            </VacioTabla>
          )}
          {proyectos.map((p) => (
            <tr
              key={p.id}
              className="fila-hover group/fila border-b border-line last:border-0"
            >
              <td className="px-4 py-3 font-medium">
                <Link
                  href={`/landing-pages/projects/${p.id}`}
                  className="hover:underline"
                >
                  {p.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-text-2">
                {nombreCliente(p, clientePor) ?? "—"}
              </td>
              <td className="px-4 py-3">
                {p.page_type ? (
                  <TipoPaginaBadge tipo={p.page_type} />
                ) : (
                  <span className="text-xs text-text-3">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <EstadoSelect id={p.id} valor={p.status} tipo="proyecto" />
              </td>
              <td className="px-4 py-3 text-text-2">
                {p.assignee_ids
                  .map((id) => nombreMiembro.get(id))
                  .filter((n): n is string => Boolean(n))
                  .join(", ") || "—"}
              </td>
              <td className="px-4 py-3">
                <Vencimiento fecha={p.due_date} cerrado={p.status === "entregado"} />
              </td>
              <td className="px-4 py-3">
                <Prioridad prioridad={p.priority} />
              </td>
              <td className="px-4 py-3">
                {/* Se revelan al apuntar la fila: menos ruido en reposo.
                    focus-within las mantiene accesibles por teclado. */}
                <span className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover/fila:opacity-100 focus-within:opacity-100">
                  <ProyectoForm
                    miembros={miembros}
                    clientes={clientes}
                    proyecto={p}
                  />
                  <DuplicarProyecto id={p.id} />
                  <BorrarProyecto id={p.id} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
