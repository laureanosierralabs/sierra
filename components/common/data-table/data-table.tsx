"use client";

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { Card } from "@/components/tailgrids/core/card";
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
  className,
}: DataTableProps<TData>) {
  // Las columnas con facet filtran por igualdad exacta, no por "contiene".
  const resolvedColumns = useMemo(() => {
    const facetIds = new Set(facets.map((facet) => facet.columnId));
    return columns.map((column) => {
      const key = columnKey(column);
      return key && facetIds.has(key) && !column.filterFn
        ? { ...column, filterFn: "equalsString" as const }
        : column;
    });
  }, [columns, facets]);

  // TanStack devuelve funciones no memoizables: el React Compiler se salta este
  // componente (esperado, no hay props memoizadas que dependan de `table`).
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getRowId,
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

  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <DataTableToolbar
        table={table}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        facets={facets}
        actions={toolbarActions}
      />

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
