"use client";

import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import { money, type FinanceData, type FinanceRow } from "@/lib/personal-finance";
import { isIncoming } from "@/lib/personal-finance-stats";
import { colorEstado, etiqueta } from "../tipos";
import { CompromisoAcciones } from "./compromiso-acciones";

/** Suscripción, ingreso recurrente o gasto programado. */
export function ScheduleCard({
  row,
  data,
  onHistory,
}: {
  row: FinanceRow;
  data: FinanceData;
  onHistory: (row: FinanceRow) => void;
}) {
  const incoming = isIncoming(row);
  const history = data.movements.filter((m) => m.schedule_id === row.id);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-text-primary">{String(row.name)}</h3>
          <p className="mt-0.5 text-xs text-text-tertiary">{String(row.origin ?? "Personal")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Badge size="sm" color={incoming ? "success" : "gray"}>
            {incoming ? "A cobrar" : "A pagar"}
          </Badge>
          <Badge size="sm" color={colorEstado(row.status)}>
            {etiqueta(row.status)}
          </Badge>
        </div>
      </div>

      <div>
        <p className="text-xl font-semibold text-text-primary tabular-nums">
          {money(row.amount, row.currency)}
        </p>
        <p className="mt-0.5 text-sm text-text-secondary">{etiqueta(row.frequency)}</p>
      </div>

      <p className="text-sm text-text-secondary">
        Próxima fecha:{" "}
        <span className="font-medium text-text-primary">
          {String(row.next_date ?? "Pendiente de confirmar")}
        </span>
        {row.period_end ? ` → ${row.period_end}` : ""}
      </p>

      <p className="text-xs text-text-tertiary">
        {row.description ? `${row.description} · ` : ""}No afecta cash hasta registrar pago/cobro
        efectivo.
      </p>

      <div className="mt-auto flex justify-end border-t border-card-border pt-4">
        <CompromisoAcciones
          row={row}
          entity="schedule"
          canPay={["active", "incomplete"].includes(String(row.status))}
          editTitle="Editar compromiso"
          historyCount={history.length}
          onHistory={() => onHistory(row)}
        />
      </div>
    </Card>
  );
}
