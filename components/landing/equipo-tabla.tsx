"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { crearColumnasEquipo } from "@/components/landing/equipo-columnas";
import type { MiembroDetalle } from "@/lib/landing/auth";

const OBTENER_ID = (m: MiembroDetalle) => m.id;

export function EquipoTabla({
  miembros,
  esOwner,
  proyectosPor,
  tareasPor,
}: {
  miembros: MiembroDetalle[];
  esOwner: boolean;
  proyectosPor: Map<string, number>;
  tareasPor: Map<string, number>;
}) {
  const columnas = useMemo(
    () => crearColumnasEquipo({ esOwner, proyectosPor, tareasPor }),
    [esOwner, proyectosPor, tareasPor],
  );

  return (
    <DataTable
      columns={columnas}
      data={miembros}
      label="Equipo"
      getRowId={OBTENER_ID}
      emptyState={<EmptyState variant="inline">No hay miembros cargados.</EmptyState>}
    />
  );
}
