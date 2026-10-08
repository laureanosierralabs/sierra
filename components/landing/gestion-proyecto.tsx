"use client";

import { useMemo } from "react";
import { CheckCircle1, Layout6, Table2 } from "@tailgrids/icons";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { Kanban } from "@/components/landing/kanban";
import { TareaForm } from "@/components/landing/tarea-form";
import { crearColumnasTareas } from "@/components/landing/tareas-columnas";
import { SeccionTitulo } from "@/components/landing/ui";
import { TabContent, TabList, TabRoot, TabTrigger } from "@/components/tailgrids/core/tabs";
import type { Miembro, Proyecto, Tarea } from "@/lib/landing/tipos";

const OBTENER_ID = (t: Tarea) => t.id;
const IR_A_TAREA = (t: Tarea) => `/landing-pages/tasks/${t.id}`;

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
  const columnas = useMemo(
    () => crearColumnasTareas(proyectos, miembros, { proyectoActual: proyecto.id }),
    [proyectos, miembros, proyecto.id],
  );

  return (
    <section>
      <TabRoot defaultValue="cuadro" className="border-0">
        <SeccionTitulo
          icono={CheckCircle1}
          accion={
            <div className="flex flex-wrap items-center gap-3">
              <TabList>
                <TabTrigger value="cuadro" icon={<Layout6 />}>
                  Cuadro
                </TabTrigger>
                <TabTrigger value="tabla" icon={<Table2 />}>
                  Tabla
                </TabTrigger>
              </TabList>

              <TareaForm miembros={miembros} proyectos={proyectos} proyectoFijo={proyecto.id} />
            </div>
          }
        >
          Gestión del proyecto
        </SeccionTitulo>

        <TabContent value="cuadro" className="p-0">
          <Kanban tareas={tareas} miembros={miembros} projectId={proyecto.id} />
        </TabContent>
        <TabContent value="tabla" className="p-0">
          <DataTable
            columns={columnas}
            data={tareas}
            label="Tareas del proyecto"
            getRowId={OBTENER_ID}
            getRowHref={IR_A_TAREA}
            emptyState={
              <EmptyState variant="inline">Este proyecto todavía no tiene tareas.</EmptyState>
            }
          />
        </TabContent>
      </TabRoot>
    </section>
  );
}
