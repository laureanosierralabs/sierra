"use client";

import type { Table } from "@tanstack/react-table";
import { Pagination } from "@/components/tailgrids/core/pagination";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const totalPages = table.getPageCount();
  if (totalPages <= 1) return null;

  const from = pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="flex flex-col items-center gap-3 border-t border-border-primary p-4 sm:flex-row">
      <p className="text-sm whitespace-nowrap text-text-tertiary tabular-nums">
        {from}–{to} de {total}
      </p>
      <Pagination
        currentPage={pageIndex + 1}
        totalPages={totalPages}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        sideLayout="icon"
      />
    </div>
  );
}
