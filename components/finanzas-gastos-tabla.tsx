"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { crearColumnasGastos } from "@/components/finanzas-gastos-columnas";
import type { GastoFijo } from "@/lib/landing/tipos";

const OBTENER_ID = (g: GastoFijo) => g.id;

export function GastosTabla({ gastos, hoy }: { gastos: GastoFijo[]; hoy: string }) {
  const columnas = useMemo(() => crearColumnasGastos(hoy), [hoy]);

  return (
    <DataTable
      columns={columnas}
      data={gastos}
      label="Gastos operativos"
      getRowId={OBTENER_ID}
      emptyState={<EmptyState variant="inline">Todavía no cargaste gastos operativos.</EmptyState>}
    />
  );
}
