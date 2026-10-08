"use client";

import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { money, type FinanceData, type FinanceRow } from "@/lib/personal-finance";
import { useFinanceDialogs } from "../editores/dialogos";
import { FinanceDialog } from "../editores/dialogo-finanzas";
import { accountName, estadoMovimiento, type EntidadPago } from "../tipos";

interface HistorialDialogProps {
  data: FinanceData;
  row: FinanceRow;
  entity: EntidadPago;
  onClose: () => void;
}

/** Pagos y cobros registrados contra un compromiso, con la opción de anularlos. */
export function HistorialDialog({ data, row, entity, onClose }: HistorialDialogProps) {
  const { cancelMovement } = useFinanceDialogs();
  const key = entity === "obligation" ? "obligation_id" : "schedule_id";
  const movements = data.movements.filter((m) => m[key] === row.id);

  return (
    <FinanceDialog isOpen onClose={onClose} title={`Historial · ${row.name}`}>
      {movements.length === 0 ? (
        <p className="text-sm text-text-tertiary">Todavía no hay pagos registrados.</p>
      ) : (
        <ul className="divide-y divide-card-border">
          {movements.map((m) => {
            const estado = estadoMovimiento(m);
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary tabular-nums">
                    {String(m.fecha)} · {money(m.monto, m.moneda)}
                  </p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {accountName(data.accounts, m.account_id)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge size="sm" color={estado.color}>
                    {estado.label}
                  </Badge>
                  {!m.cancelled_at && (
                    <Button
                      size="sm"
                      variant="danger"
                      appearance="outline"
                      onPress={() => cancelMovement(m)}
                      aria-label={`Anular pago del ${m.fecha}`}
                    >
                      Anular
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </FinanceDialog>
  );
}
