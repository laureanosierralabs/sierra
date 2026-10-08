"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "@tailgrids/icons";
import { AreaChartCard } from "@/components/common/charts/area-chart-card";
import { CHART_COLORS } from "@/components/common/charts/chart-theme";
import { DataTable } from "@/components/common/data-table/data-table";
import type { DataTableFacet } from "@/components/common/data-table/types";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/tailgrids/core/button";
import { isPosted, money, today, type FinanceData, type FinanceRow } from "@/lib/personal-finance";
import { dailyExpenses, monthLongLabel } from "@/lib/personal-finance-stats";
import { useFinanceDialogs } from "../editores/dialogos";
import { Segmentado } from "../segmentado";
import { accountName, capitalize, estadoMovimiento, type FiltroTipo, type FinanceQuery } from "../tipos";
import { buildHref } from "../url";
import { visibleRow } from "../filtros";
import { crearColumnasMovimientos } from "./movimientos-columnas";

interface MovimientosViewProps {
  data: FinanceData;
  month: string;
  tipo: FiltroTipo;
  todoElHistorial: boolean;
  query: FinanceQuery;
}

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));
const toOptions = (values: string[]) => unique(values).map((v) => ({ label: v, value: v }));

export function MovimientosView({ data, month, tipo, todoElHistorial, query }: MovimientosViewProps) {
  const { openMovement, cancelMovement } = useFinanceDialogs();
  const showCancelled = query.status === "all" || query.status === "cancelled";

  const rows = useMemo(
    () =>
      data.movements.filter(
        (m) =>
          (tipo === "todos" || m.tipo === tipo) &&
          visibleRow(m, { ...query, month: todoElHistorial ? "" : month }, "movement"),
      ),
    [data.movements, tipo, query, month, todoElHistorial],
  );

  const columns = useMemo(
    () =>
      crearColumnasMovimientos({
        accounts: data.accounts,
        onEdit: (row: FinanceRow) => openMovement(row.tipo === "ingreso" ? "ingreso" : "egreso", row),
        onCancel: cancelMovement,
      }),
    [data.accounts, openMovement, cancelMovement],
  );

  const facets: DataTableFacet[] = useMemo(
    () => [
      { columnId: "categoria", label: "Categoría", options: toOptions(rows.map((m) => String(m.categoria ?? "Sin categoría"))) },
      { columnId: "cuenta", label: "Cuenta", options: toOptions(rows.map((m) => accountName(data.accounts, m.account_id))) },
      { columnId: "monto", label: "Moneda", options: toOptions(rows.map((m) => String(m.moneda))) },
      { columnId: "estado", label: "Estado", options: toOptions(rows.map((m) => estadoMovimiento(m).label)) },
    ],
    [rows, data.accounts],
  );

  const daily = useMemo(() => {
    const isCurrent = month === today().slice(0, 7);
    return dailyExpenses(data, month, isCurrent ? Number(today().slice(8, 10)) : undefined);
  }, [data, month]);

  // Posted only, like the KPIs and charts: pending rows would contradict them.
  const totalIngresos = rows
    .filter((m) => m.tipo === "ingreso" && isPosted(m) && m.usd_amount !== null)
    .reduce((n, m) => n + Number(m.usd_amount), 0);
  const totalGastos = rows
    .filter((m) => m.tipo === "egreso" && isPosted(m) && m.usd_amount !== null)
    .reduce((n, m) => n + Number(m.usd_amount), 0);

  return (
    <div className="flex flex-col gap-5">
      {!todoElHistorial && (
        <AreaChartCard
          title="Gasto diario"
          description={`${monthLongLabel(month)} · USD históricos de los gastos pagados`}
          data={daily.points}
          xKey="dia"
          series={[{ key: "gastos", name: "Gastos", color: CHART_COLORS.expense }]}
          height={200}
          formatValue={(value) => money(value, "USD")}
          formatLabel={(dia) => `${dia} de ${monthLongLabel(month)}`}
          isEmpty={daily.points.every((p) => p.gastos === 0)}
          emptyMessage="Sin gastos pagados en este mes."
          footer={
            daily.parcial
              ? "Estimación parcial: los gastos sin conversión histórica a USD no se incluyen."
              : undefined
          }
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmentado
          label="Tipo de movimiento"
          value={tipo}
          options={[
            { value: "todos", label: "Todos", href: buildHref(query, { tipo: null }) },
            { value: "ingreso", label: "Ingresos", href: buildHref(query, { tipo: "ingreso" }) },
            { value: "egreso", label: "Gastos", href: buildHref(query, { tipo: "egreso" }) },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Segmentado
            label="Período"
            value={todoElHistorial ? "todo" : "mes"}
            options={[
              { value: "mes", label: capitalize(monthLongLabel(month)), href: buildHref(query, { periodo: null }) },
              { value: "todo", label: "Todo el historial", href: buildHref(query, { periodo: "todo" }) },
            ]}
          />
          <Link
            href={buildHref(query, { status: showCancelled ? null : "all" })}
            className="text-sm font-medium text-primary-500 hover:underline"
          >
            {showCancelled ? "Ocultar anulados" : "Ver anulados"}
          </Link>
        </div>
      </div>

      <p className="text-sm text-text-secondary">
        {rows.length} {rows.length === 1 ? "movimiento" : "movimientos"}
        {tipo !== "egreso" && <> · Ingresos {money(totalIngresos, "USD")}</>}
        {tipo !== "ingreso" && <> · Gastos {money(totalGastos, "USD")}</>}
        <span className="text-text-tertiary"> (USD históricos, sin los que no tienen conversión)</span>
      </p>

      <DataTable
        columns={columns}
        data={rows}
        label="Movimientos"
        getRowId={(m) => m.id}
        searchable
        searchPlaceholder="Buscar concepto, categoría o cuenta…"
        facets={facets}
        paginate
        pageSize={15}
        initialSorting={[{ id: "fecha", desc: true }]}
        emptyState={
          <EmptyState
            variant="inline"
            title="Sin movimientos para estos filtros"
            description="Registrá un ingreso o un gasto, o cambiá el período."
            action={
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="success" onPress={() => openMovement("ingreso")}>
                  <Plus />
                  Ingreso
                </Button>
                <Button size="sm" onPress={() => openMovement("egreso")}>
                  <Plus />
                  Gasto
                </Button>
              </div>
            }
          />
        }
      />
    </div>
  );
}
