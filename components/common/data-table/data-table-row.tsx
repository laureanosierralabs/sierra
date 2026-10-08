"use client";

import { flexRender, type Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";
import { TableCell, TableRow } from "@/components/tailgrids/core/table";
import { cn } from "@/utils/cn";

interface DataTableRowProps<TData> {
  row: Row<TData>;
  href?: string;
  onRowClick?: (row: TData) => void;
}

/* Controles que ya manejan su propio click: la fila no debe pisarlos. */
const INTERACTIVE = "a,button,input,select,textarea,label,[role='button'],[role='dialog'],[role='alertdialog']";

export function DataTableRow<TData>({ row, href, onRowClick }: DataTableRowProps<TData>) {
  const router = useRouter();
  const clickable = Boolean(href || onRowClick);

  function activate() {
    if (href) router.push(href);
    onRowClick?.(row.original);
  }

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    if (!clickable) return;
    // Synthetic events bubble through portals: ignore clicks from dialogs opened in a cell.
    if (!event.currentTarget.contains(event.target as Node)) return;
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
    activate();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (!clickable || event.target !== event.currentTarget) return;
    if (event.key === "Enter") activate();
  }

  return (
    <TableRow
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable ? 0 : undefined}
      className={cn(
        clickable &&
          "cursor-pointer outline-none hover:bg-background-gray-secondary focus-visible:bg-background-gray-secondary",
      )}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
