"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, ListChecks, Table2 } from "lucide-react";
import { Kanban } from "@/components/landing/kanban";
import { EstadoSelect } from "@/components/landing/estado-select";
import { TareaForm } from "@/components/landing/tarea-form";
import { BorrarTarea } from "@/components/landing/borrar";
import {
  Prioridad,
  SeccionTitulo,
  Vencimiento,
  VacioTabla,
} from "@/components/landing/ui";
import type { Miembro, Proyecto, Tarea } from "@/lib/landing/tipos";

const COLUMNAS = ["Tarea", "Estado", "Responsable", "Prioridad", "Deadline", ""];

export function GestionProyecto({
  proyecto,
  tareas,
  miembros,
  proyectos,
}: {
  proyecto: Proyecto;
  tareas: Tarea[];
  miembros: Miembro[];
  proyectos: Pick<Proyecto, "id" | "name">[];
}) {
  const [vista, setVista] = useState<"cuadro" | "tabla">("cuadro");

  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));

  const BOTON =
    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors";

  return (
    <section>
      <SeccionTitulo
        icono={ListChecks}
        accion={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-line p-0.5">
            <button
              type="button"
              onClick={() => setVista("cuadro")}
              className={`${BOTON} ${vista === "cuadro" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
            >
              <LayoutGrid className="size-3.5" />
              Cuadro
            </button>
            <button
              type="button"
              onClick={() => setVista("tabla")}
              className={`${BOTON} ${vista === "tabla" ? "bg-surface-2 text-text" : "text-text-2 hover:text-text"}`}
            >
              <Table2 className="size-3.5" />
              Tabla
            </button>
          </div>

          <TareaForm
            miembros={miembros}
            proyectos={proyectos}
            proyectoFijo={proyecto.id}
          />
        </div>
        }
      >
        Gestión del proyecto
      </SeccionTitulo>

      {vista === "cuadro" ? (
        <Kanban tareas={tareas} miembros={miembros} projectId={proyecto.id} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {COLUMNAS.map((h, i) => (
                  <th
                    key={h || i}
                    className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-text-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tareas.length === 0 && (
                <VacioTabla colSpan={COLUMNAS.length}>
                  Este proyecto todavía no tiene tareas.
                </VacioTabla>
              )}
              {tareas.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-2.5 font-medium">
                    <Link
                      href={`/landing-pages/tasks/${t.id}`}
                      className="hover:underline"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <EstadoSelect id={t.id} valor={t.status} tipo="tarea" />
                  </td>
                  <td className="px-4 py-2.5 text-text-2">
                    {t.assigned_to
                      ? (nombreMiembro.get(t.assigned_to) ?? "—")
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Prioridad prioridad={t.priority} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Vencimiento fecha={t.due_date} cerrado={t.status === "completada"} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center justify-end gap-3">
                      <TareaForm
                        miembros={miembros}
                        proyectos={proyectos}
                        tarea={t}
                      />
                      <BorrarTarea id={t.id} projectId={proyecto.id} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </section>
  );
}
