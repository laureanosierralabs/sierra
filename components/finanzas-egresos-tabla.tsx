"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { crearColumnasEgresos } from "@/components/finanzas-egresos-columnas";
import type { AcuerdoEquipo } from "@/lib/landing/tipos";

const OBTENER_ID = (a: AcuerdoEquipo) => a.id;
const IR_AL_ACUERDO = (a: AcuerdoEquipo) => `/landing-pages/finanzas/acuerdo/${a.id}`;

export function EgresosTabla({
  acuerdos,
  proyectos,
}: {
  acuerdos: AcuerdoEquipo[];
  /** Pares [id, nombre]. */
  proyectos: [string, string][];
}) {
  const columnas = useMemo(() => crearColumnasEgresos(new Map(proyectos)), [proyectos]);

  return (
    <DataTable
      columns={columnas}
      data={acuerdos}
      label="Egresos al equipo"
      getRowId={OBTENER_ID}
      getRowHref={IR_AL_ACUERDO}
      emptyState={<EmptyState variant="inline">Todavía no hay acuerdos con el equipo.</EmptyState>}
    />
  );
}
