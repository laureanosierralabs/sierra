"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { DataTable } from "@/components/common/data-table/data-table";
import { crearColumnasTareas } from "@/components/landing/tareas-columnas";
import {
  TabContent,
  TabList,
  TabRoot,
  TabTrigger,
} from "@/components/tailgrids/core/tabs";
import {
  esTareaAbierta,
  type Miembro,
  type Proyecto,
  type Tarea,
} from "@/lib/landing/tipos";

const OBTENER_ID = (t: Tarea) => t.id;
const IR_A_TAREA = (t: Tarea) => `/landing-pages/tasks/${t.id}`;

function TablaDeTareas({
  tareas,
  columnas,
  vacio,
}: {
  tareas: Tarea[];
  columnas: ReturnType<typeof crearColumnasTareas>;
  vacio: string;
}) {
  return (
    <DataTable
      columns={columnas}
      data={tareas}
      label="Tareas"
      getRowId={OBTENER_ID}
      getRowHref={IR_A_TAREA}
      emptyState={<EmptyState variant="inline">{vacio}</EmptyState>}
    />
  );
}

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
  const columnas = useMemo(
    () => crearColumnasTareas(proyectos, miembros),
    [proyectos, miembros],
  );
  const abiertas = useMemo(
    () => tareas.filter((t) => esTareaAbierta(t.status)),
    [tareas],
  );
  const ocultas = tareas.length - abiertas.length;

  return (
    <TabRoot
      defaultValue="abiertas"
      variant="minimal"
      className="border-0 px-0 pt-0"
    >
      <div className="flex flex-wrap items-center gap-x-4">
        <TabList>
          <TabTrigger value="abiertas" badge={String(abiertas.length)}>
            Abiertas
          </TabTrigger>
          <TabTrigger value="todas" badge={String(tareas.length)}>
            Todas
          </TabTrigger>
        </TabList>
        {ocultas > 0 && (
          <span className="text-xs text-text-tertiary">{ocultas} completadas ocultas</span>
        )}
      </div>

      <TabContent value="abiertas" className="px-0 py-4">
        <TablaDeTareas
          tareas={abiertas}
          columnas={columnas}
          vacio="No hay tareas abiertas."
        />
      </TabContent>
      <TabContent value="todas" className="px-0 py-4">
        <TablaDeTareas
          tareas={tareas}
          columnas={columnas}
          vacio="Todavía no hay tareas."
        />
      </TabContent>
    </TabRoot>
  );
}
