"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import {
  crearColumnasInicioProyectos,
  type ProyectoInicio,
} from "@/components/landing/inicio-proyectos-columnas";

const OBTENER_ID = (p: ProyectoInicio) => p.id;
const IR_AL_PROYECTO = (p: ProyectoInicio) => `/landing-pages/projects/${p.id}`;

export function InicioProyectosTabla({ proyectos }: { proyectos: ProyectoInicio[] }) {
  const columnas = useMemo(() => crearColumnasInicioProyectos(), []);

  return (
    <DataTable
      columns={columnas}
      data={proyectos}
      label="Proyectos activos"
      getRowId={OBTENER_ID}
      getRowHref={IR_AL_PROYECTO}
      emptyState={<EmptyState variant="inline">No hay proyectos activos.</EmptyState>}
    />
  );
}
