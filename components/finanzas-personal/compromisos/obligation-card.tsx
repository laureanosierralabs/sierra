"use client";

import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import { Progress } from "@/components/tailgrids/core/progress";
import { money, type FinanceData, type FinanceRow } from "@/lib/personal-finance";
import { obligationProgress } from "@/lib/personal-finance-stats";
import { COLOR_PRIORIDAD, colorEstado, etiqueta } from "../tipos";
import { CompromisoAcciones } from "./compromiso-acciones";

const CERRADAS = ["paid", "collected", "cancelled", "uncollectible"];

/** Deuda o cuenta por cobrar, con el avance pagado vs. pendiente. */
export function ObligationCard({
  row,
  data,
  onHistory,
}: {
  row: FinanceRow;
  data: FinanceData;
  onHistory: (row: FinanceRow) => void;
}) {
  const progress = obligationProgress(row, data);
  const history = data.movements.filter((m) => m.obligation_id === row.id);
  const incoming = row.kind === "receivable";

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-text-primary">{String(row.counterparty)}</h3>
          <p className="mt-0.5 truncate text-xs text-text-tertiary">{String(row.name)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Badge size="sm" color={colorEstado(row.status)}>
            {etiqueta(row.status)}
          </Badge>
          <Badge size="sm" color={COLOR_PRIORIDAD[String(row.priority)] ?? "gray"}>
            Prioridad {etiqueta(row.priority).toLowerCase()}
          </Badge>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xl font-semibold text-text-primary tabular-nums">
            {money(progress.remaining, row.currency)}
          </p>
          <p className="text-xs text-text-tertiary">
            pendiente de {money(row.amount, row.currency)}
          </p>
        </div>
        {progress.percent !== null ? (
          <div className="mt-3">
            <Progress
              progress={progress.percent}
              className="max-w-none"
              barColor={incoming ? "var(--color-success-500)" : undefined}
            />
            <p className="mt-1.5 text-xs text-text-tertiary tabular-nums">
              {incoming ? "Cobrado" : "Pagado"} {money(progress.paid, row.currency)} ·{" "}
              {Math.round(progress.percent)}%
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-text-tertiary">
            Saldo total desconocido: no se puede calcular el avance.
          </p>
        )}
      </div>

      <p className="text-sm text-text-secondary">
        Objetivo{" "}
        <span className="font-medium text-text-primary">
          {String(row.target_date ?? row.target_month ?? "Sin fecha")}
        </span>{" "}
        · Próxima cuota{" "}
        <span className="font-medium text-text-primary">
          {String(row.next_date ?? row.next_month ?? "Sin fecha")}
        </span>
        {row.monthly_payment ? ` · ${money(row.monthly_payment, row.currency)}` : ""}
      </p>

      {(!row.allocation_known || row.amount === null) && (
        <p className="text-xs text-warning-500">
          {!row.allocation_known
            ? "Monto conjunto: proporción personal desconocida."
            : "Saldo total desconocido: las cuotas se registran, no se inventa el saldo pendiente."}{" "}
          Excluido del patrimonio exacto.
        </p>
      )}

      {row.description && <p className="text-xs text-text-tertiary">{String(row.description)}</p>}

      <div className="mt-auto flex justify-end border-t border-card-border pt-4">
        <CompromisoAcciones
          row={row}
          entity="obligation"
          canPay={!CERRADAS.includes(String(row.status))}
          editTitle="Editar / cancelar obligación"
          historyCount={history.length}
          onHistory={() => onHistory(row)}
        />
      </div>
    </Card>
  );
}
