"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { crearColumnasBalance } from "@/components/finanzas-balance-columnas";
import type { Mes } from "@/lib/landing/balance";

const OBTENER_ID = (m: Mes) => m.mes;

export function BalanceTabla({ meses, filtrado }: { meses: Mes[]; filtrado: boolean }) {
  const columnas = useMemo(() => crearColumnasBalance(), []);

  return (
    <DataTable
      columns={columnas}
      data={meses}
      label="Balance por mes"
      getRowId={OBTENER_ID}
      emptyState={
        <EmptyState variant="inline">
          {filtrado ? "No hubo movimientos en ese mes." : "Todavía no hay movimientos con fecha."}
        </EmptyState>
      }
    />
  );
}
