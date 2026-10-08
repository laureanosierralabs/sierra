"use client";

import { MenuKebab1 } from "@tailgrids/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import type { FinanceRow } from "@/lib/personal-finance";

interface MovimientoAccionesProps {
  row: FinanceRow;
  onEdit: (row: FinanceRow) => void;
  onCancel: (row: FinanceRow) => void;
}

/**
 * Editar y anular. Los movimientos que nacen de un pago (obligación o
 * cronograma) no se editan a mano; se corrigen anulando el pago.
 */
export function MovimientoAcciones({ row, onEdit, onCancel }: MovimientoAccionesProps) {
  if (row.cancelled_at) return <span className="text-text-tertiary">—</span>;
  const editable = !row.obligation_id && !row.schedule_id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Acciones de ${row.concepto}`}
        className="flex size-8 items-center justify-center rounded-md text-text-tertiary hover:bg-background-gray-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-5"
      >
        <MenuKebab1 />
      </DropdownMenuTrigger>
      <DropdownMenuContent placement="bottom end">
        {editable && (
          <DropdownMenuItem id="edit" onAction={() => onEdit(row)} className="px-3 py-2">
            Editar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          id="cancel"
          onAction={() => onCancel(row)}
          className="px-3 py-2 text-error-500"
        >
          Anular
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
