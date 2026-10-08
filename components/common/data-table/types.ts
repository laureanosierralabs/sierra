import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ReactNode } from "react";

export interface DataTableFacetOption {
  label: string;
  value: string;
}

/** Filtro por select sobre una columna (coincidencia exacta con el valor de la celda). */
export interface DataTableFacet {
  /** `id` de la columna (o su `accessorKey`) sobre la que filtra. */
  columnId: string;
  label: string;
  options: DataTableFacetOption[];
}

export interface DataTableProps<TData> {
  /* `any` en TValue: las columnas de un mismo array suelen tener tipos de valor
     distintos y TanStack no los unifica. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  /** Nombre accesible de la tabla (aria-label). */
  label: string;
  getRowId?: (row: TData, index: number) => string;
  /** Muestra el buscador global de texto. */
  searchable?: boolean;
  searchPlaceholder?: string;
  facets?: DataTableFacet[];
  /** Paginación en cliente. Por defecto no pagina (se renderizan todas las filas). */
  paginate?: boolean;
  pageSize?: number;
  initialSorting?: SortingState;
  /** Navega al hacer click en la fila. Los links y botones internos siguen funcionando. */
  getRowHref?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  /** Muestra filas esqueleto en vez de datos. */
  isLoading?: boolean;
  /** Contenido cuando no hay filas (por defecto, un texto simple). */
  emptyState?: ReactNode;
  /** Botones a la derecha de la barra de filtros. */
  toolbarActions?: ReactNode;
  className?: string;
}
