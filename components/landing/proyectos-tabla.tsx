"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { crearColumnasProyectos } from "@/components/landing/proyectos-columnas";
import type { ResumenCotizado } from "@/lib/landing/datos";
import type { Cliente, Miembro, Proyecto } from "@/lib/landing/tipos";

const OBTENER_ID = (p: Proyecto) => p.id;
const IR_AL_PROYECTO = (p: Proyecto) => `/landing-pages/projects/${p.id}`;

export function ProyectosTabla({
  proyectos,
  clientes,
  miembros,
  clientePor,
  nombreMiembro,
  cotizado,
  verCotizacion,
}: {
  proyectos: Proyecto[];
  clientes: Cliente[];
  miembros: Miembro[];
  clientePor: Map<string, string>;
  nombreMiembro: Map<string, string>;
  cotizado: Map<string, ResumenCotizado>;
  verCotizacion: boolean;
}) {
  const columnas = useMemo(
    () =>
      crearColumnasProyectos({
        clientes,
        miembros,
        clientePor,
        nombreMiembro,
        cotizado,
        verCotizacion,
      }),
    [clientes, miembros, clientePor, nombreMiembro, cotizado, verCotizacion],
  );

  return (
    <DataTable
      columns={columnas}
      data={proyectos}
      label="Proyectos"
      getRowId={OBTENER_ID}
      getRowHref={IR_AL_PROYECTO}
      emptyState={<EmptyState variant="inline">Todavía no hay proyectos.</EmptyState>}
    />
  );
}
