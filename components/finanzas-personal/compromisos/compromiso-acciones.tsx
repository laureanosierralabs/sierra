"use client";

import { MenuKebab1 } from "@tailgrids/icons";
import { Button } from "@/components/tailgrids/core/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import type { FinanceRow } from "@/lib/personal-finance";
import { isIncoming } from "@/lib/personal-finance-stats";
import { useFinanceDialogs } from "../editores/dialogos";
import type { EntidadPago } from "../tipos";

interface CompromisoAccionesProps {
  row: FinanceRow;
  entity: EntidadPago;
  /** Muestra el botón principal de pago o cobro. */
  canPay: boolean;
  editTitle: string;
  historyCount: number;
  onHistory: () => void;
}

/** Una acción principal (Pagar o Cobrar) y un menú con Editar e Historial. */
export function CompromisoAcciones({
  row,
  entity,
  canPay,
  editTitle,
  historyCount,
  onHistory,
}: CompromisoAccionesProps) {
  const { openPayment, openEntity } = useFinanceDialogs();
  const incoming = isIncoming(row);

  return (
    <div className="flex items-center gap-2">
      {canPay && (
        <Button
          size="sm"
          variant={incoming ? "success" : "primary"}
          onPress={() => openPayment(row, entity)}
          aria-label={`${incoming ? "Registrar cobro" : "Registrar pago"}: ${row.name}`}
        >
          {incoming ? "Cobrar" : "Pagar"}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Más acciones de ${row.name}`}
          className="flex size-8 items-center justify-center rounded-md text-text-tertiary hover:bg-background-gray-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-5"
        >
          <MenuKebab1 />
        </DropdownMenuTrigger>
        <DropdownMenuContent placement="bottom end">
          <DropdownMenuItem
            id="edit"
            className="px-3 py-2"
            onAction={() => openEntity(entity, { row, title: editTitle })}
          >
            Editar
          </DropdownMenuItem>
          {historyCount > 0 && (
            <DropdownMenuItem id="history" className="px-3 py-2" onAction={onHistory}>
              Historial ({historyCount})
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
