"use client";

import { useState } from "react";
import Link from "next/link";
import {
  esTareaAbierta,
  type Miembro,
  type Proyecto,
  type Tarea,
} from "@/lib/landing/tipos";
import { Prioridad, Vencimiento, VacioTabla } from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { TareaForm } from "@/components/landing/tarea-form";
import { BorrarTarea } from "@/components/landing/borrar";

const CHIP =
  "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150";
const CHIP_ACTIVO = "bg-surface text-text shadow-e1";
const CHIP_INACTIVO = "text-text-2 hover:bg-surface/60 hover:text-text";

/** Las completadas quedan ocultas por defecto: son ruido una vez cerrado el proyecto. */
export function TareasTabla({
  tareas,
  proyectos,
  miembros,
}: {
  tareas: Tarea[];
  proyectos: Proyecto[];
  miembros: Miembro[];
}) {
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false);

  const nombrePor = new Map(miembros.map((m) => [m.id, m.nombre]));
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));

  const abiertas = tareas.filter((t) => esTareaAbierta(t.status));
  const completadas = tareas.filter((t) => !esTareaAbierta(t.status));
  const visibles = mostrarCompletadas ? tareas : abiertas;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-0.5">
          <button
            type="button"
            onClick={() => setMostrarCompletadas(false)}
            className={`${CHIP} ${!mostrarCompletadas ? CHIP_ACTIVO : CHIP_INACTIVO}`}
          >
            Abiertas <span className="tnum text-text-3">{abiertas.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setMostrarCompletadas(true)}
            className={`${CHIP} ${mostrarCompletadas ? CHIP_ACTIVO : CHIP_INACTIVO}`}
          >
            Todas <span className="tnum text-text-3">{tareas.length}</span>
          </button>
        </div>
        {!mostrarCompletadas && completadas.length > 0 && (
          <span className="text-xs text-text-3">
            {completadas.length} completadas ocultas
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="vidrio border-b border-line text-left">
              {["Tarea", "Proyecto", "Responsable", "Estado", "Prioridad", "Deadline", ""].map(
                (h, i) => (
                  <th
                    key={h || i}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <VacioTabla colSpan={7}>
                {mostrarCompletadas
                  ? "Todavía no hay tareas."
                  : "No hay tareas abiertas."}
              </VacioTabla>
            )}
            {visibles.map((t) => (
              <tr
                key={t.id}
                className="fila-hover group/fila border-b border-line last:border-0"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/landing-pages/tasks/${t.id}`}
                    className="hover:underline"
                  >
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-2">
                  {t.project_id ? (proyectoPor.get(t.project_id) ?? "—") : "—"}
                </td>
                <td className="px-4 py-3 text-text-2">
                  {t.assignee_ids
                    .map((id) => nombrePor.get(id))
                    .filter((n): n is string => Boolean(n))
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <EstadoSelect id={t.id} valor={t.status} tipo="tarea" />
                </td>
                <td className="px-4 py-3">
                  <Prioridad prioridad={t.priority} />
                </td>
                <td className="px-4 py-3">
                  <Vencimiento fecha={t.due_date} cerrado={t.status === "completada"} />
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover/fila:opacity-100 focus-within:opacity-100">
                    <TareaForm
                      miembros={miembros}
                      proyectos={proyectos}
                      tarea={t}
                    />
                    <BorrarTarea id={t.id} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
