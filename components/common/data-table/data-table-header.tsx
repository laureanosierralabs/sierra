"use client";

import { flexRender, type Header } from "@tanstack/react-table";
import { ChevronBothDirection, ChevronDown, ChevronUp } from "@tailgrids/icons";
import { TableHead } from "@/components/tailgrids/core/table";
import { cn } from "@/utils/cn";

interface DataTableHeaderCellProps<TData> {
  header: Header<TData, unknown>;
}

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

export function DataTableHeaderCell<TData>({ header }: DataTableHeaderCellProps<TData>) {
  const column = header.column;
  const sorted = column.getIsSorted();
  const canSort = column.getCanSort();
  const content = header.isPlaceholder
    ? null
    : flexRender(column.columnDef.header, header.getContext());

  return (
    <TableHead
      scope="col"
      aria-sort={canSort ? (sorted ? ARIA_SORT[sorted] : "none") : undefined}
      className={cn("whitespace-nowrap", column.columnDef.meta?.headerClassName)}
    >
      {canSort ? (
        <button
          type="button"
          onClick={column.getToggleSortingHandler()}
          className="-mx-1 inline-flex items-center gap-1.5 rounded px-1 outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {content}
          <span aria-hidden="true" className="text-text-tertiary [&>svg]:size-3.5">
            {sorted === "asc" ? (
              <ChevronUp />
            ) : sorted === "desc" ? (
              <ChevronDown />
            ) : (
              <ChevronBothDirection />
            )}
          </span>
        </button>
      ) : (
        content
      )}
    </TableHead>
  );
}
