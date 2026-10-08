"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { crearColumnasMovimientos } from "@/components/finanzas-columnas";
import type { Ambito, Movimiento } from "@/lib/finanzas";

const OBTENER_ID = (m: Movimiento) => m.id;

export function FinanzasMovimientosTabla({
  movimientos,
  ambito,
}: {
  movimientos: Movimiento[];
  ambito: Ambito;
}) {
  const columnas = useMemo(() => crearColumnasMovimientos(ambito), [ambito]);

  return (
    <DataTable
      columns={columnas}
      data={movimientos}
      label="Movimientos"
      getRowId={OBTENER_ID}
      emptyState={<EmptyState variant="inline">Todavía no hay movimientos.</EmptyState>}
    />
  );
}
