"use client";

import Link from "next/link";
import { EstadoSelect } from "@/components/landing/estado-select";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { DuplicarProyecto } from "@/components/landing/duplicar-proyecto";
import { BorrarProyecto } from "@/components/landing/borrar";
import { Prioridad, Vencimiento, VacioTabla } from "@/components/landing/ui";
import {
  nombreCliente,
  type Cliente,
  type Miembro,
  type Proyecto,
} from "@/lib/landing/tipos";

const COLUMNAS = [
  "Proyecto",
  "Cliente",
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
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
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
              className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
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
                <EstadoSelect id={p.id} valor={p.status} tipo="proyecto" />
              </td>
              <td className="px-4 py-3 text-text-2">
                {p.responsible_user_id
                  ? (nombreMiembro.get(p.responsible_user_id) ?? "—")
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <Vencimiento fecha={p.due_date} />
              </td>
              <td className="px-4 py-3">
                <Prioridad prioridad={p.priority} />
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center justify-end gap-3">
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
