"use client";

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Table,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { Card } from "@/components/tailgrids/core/card";
import { Checkbox } from "@/components/tailgrids/core/checkbox";
import {
  TableBody,
  TableCell,
  TableHeader,
  TableRoot,
  TableRow,
} from "@/components/tailgrids/core/table";
import { cn } from "@/utils/cn";
import { DataTableHeaderCell } from "./data-table-header";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableRow } from "./data-table-row";
import { DataTableSkeletonRows } from "./data-table-skeleton";
import { DataTableToolbar } from "./data-table-toolbar";
import type { DataTableFacet, DataTableProps } from "./types";

const DEFAULT_PAGE_SIZE = 10;
const NO_FACETS: DataTableFacet[] = [];

function columnKey<TData>(column: ColumnDef<TData>): string | undefined {
  if (column.id) return column.id;
  return "accessorKey" in column ? String(column.accessorKey) : undefined;
}

/* "Seleccionar todas" toma solo las filas visibles con los filtros actuales:
   nunca algo que el usuario no está viendo. */
function SeleccionarTodas<TData>({ table }: { table: Table<TData> }) {
  const visibles = table.getFilteredRowModel().rows;
  const todas = visibles.length > 0 && visibles.every((r) => r.getIsSelected());
  const algunas = visibles.some((r) => r.getIsSelected());
  return (
    <Checkbox
      aria-label={todas ? "Quitar la selección" : "Seleccionar todas"}
      isSelected={todas}
      isIndeterminate={algunas && !todas}
      onChange={() => table.setRowSelection(todas ? {} : Object.fromEntries(visibles.map((r) => [r.id, true])))}
    />
  );
}

function columnaSeleccion<TData>(): ColumnDef<TData> {
  return {
    id: "_seleccion",
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { headerClassName: "w-10" },
    header: ({ table }) => <SeleccionarTodas table={table} />,
    cell: ({ row }) => (
      <Checkbox aria-label="Seleccionar fila" isSelected={row.getIsSelected()} onChange={(v) => row.toggleSelected(v)} />
    ),
  };
}

/**
 * Tabla genérica sobre TanStack Table y los primitivos `table`/`pagination` del
 * template. Ordena, filtra y pagina en el cliente: pensada para los volúmenes
 * de este panel (decenas o cientos de filas), no para datasets del lado servidor.
 */
export function DataTable<TData>({
  columns,
  data,
  label,
  getRowId,
  searchable = false,
  searchPlaceholder = "Buscar…",
  facets = NO_FACETS,
  paginate = false,
  pageSize = DEFAULT_PAGE_SIZE,
  initialSorting,
  getRowHref,
  onRowClick,
  isLoading = false,
  emptyState,
  toolbarActions,
  selectionActions,
  className,
}: DataTableProps<TData>) {
  const conSeleccion = Boolean(selectionActions);
  // Las columnas con facet filtran por igualdad exacta, no por "contiene".
  const resolvedColumns = useMemo(() => {
    const facetIds = new Set(facets.map((facet) => facet.columnId));
    const resueltas = columns.map((column) => {
      const key = columnKey(column);
      return key && facetIds.has(key) && !column.filterFn
        ? { ...column, filterFn: "equalsString" as const }
        : column;
    });
    return conSeleccion ? [columnaSeleccion<TData>(), ...resueltas] : resueltas;
  }, [columns, facets, conSeleccion]);

  // TanStack devuelve funciones no memoizables: el React Compiler se salta este
  // componente (esperado, no hay props memoizadas que dependan de `table`).
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getRowId,
    enableRowSelection: conSeleccion,
    initialState: {
      sorting: initialSorting,
      pagination: { pageIndex: 0, pageSize },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(paginate ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    globalFilterFn: "includesString",
  });

  const rows = table.getRowModel().rows;
  const columnCount = resolvedColumns.length;
  // Solo las elegidas que se ven con los filtros actuales: una acción masiva
  // nunca toca filas ocultas por la búsqueda o un filtro.
  const elegidas = conSeleccion
    ? table.getFilteredRowModel().rows.filter((r) => r.getIsSelected()).map((r) => r.id)
    : [];
  const limpiar = () => table.resetRowSelection();

  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <DataTableToolbar
        table={table}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        facets={facets}
        actions={toolbarActions}
      />

      {selectionActions && elegidas.length > 0 && (
        <div
          role="region"
          aria-label="Acciones sobre la selección"
          className="flex flex-wrap items-center gap-3 border-b border-card-border bg-primary-500/5 px-4 py-2.5"
        >
          <span className="text-sm font-semibold text-text-primary tabular-nums">
            {elegidas.length === 1 ? "1 seleccionada" : `${elegidas.length} seleccionadas`}
          </span>
          <div className="flex flex-wrap items-center gap-2">{selectionActions(elegidas, limpiar)}</div>
          <button
            type="button"
            onClick={limpiar}
            className="ml-auto text-sm font-medium text-text-tertiary hover:text-text-primary"
          >
            Quitar selección
          </button>
        </div>
      )}

      <TableRoot fullBleed aria-label={label} aria-busy={isLoading || undefined}>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <DataTableHeaderCell key={header.id} header={header} />
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <DataTableSkeletonRows columns={columnCount} rows={Math.min(pageSize, 5)} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="py-10 text-center font-normal">
                {emptyState ?? (
                  <span className="text-sm text-text-tertiary">Sin resultados.</span>
                )}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <DataTableRow
                key={row.id}
                row={row}
                href={getRowHref?.(row.original)}
                onRowClick={onRowClick}
              />
            ))
          )}
        </TableBody>
      </TableRoot>

      {paginate && !isLoading && <DataTablePagination table={table} />}
    </Card>
  );
}
