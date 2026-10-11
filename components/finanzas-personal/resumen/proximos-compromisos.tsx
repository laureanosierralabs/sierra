"use client";

import Link from "next/link";
import { CheckCircle1 } from "@tailgrids/icons";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { money, today, type FinanceData } from "@/lib/personal-finance";
import {
  defaultPaymentAmount,
  isIncoming,
  monthCommitments,
  monthLongLabel,
} from "@/lib/personal-finance-stats";
import { cn } from "@/utils/cn";
import { useFinanceDialogs } from "../editores/dialogos";
import { SeccionCard } from "../seccion-card";
import { etiqueta, type FinanceQuery } from "../tipos";
import { vistaHref } from "../url";

/** Tipo de compromiso en texto, tal como lo mostraba el resumen anterior. */
export function tipoCompromiso(entity: "schedule" | "obligation", kind: unknown): string {
  const incoming = kind === "income" || kind === "receivable";
  if (entity === "obligation") return incoming ? "Por cobrar personal" : "Deuda personal";
  return incoming ? "Ingreso esperado" : kind === "subscription" ? "Suscripción" : "Gasto programado";
}

/**
 * Compromisos del mes en curso: lo pendiente (con lo vencido primero) y lo ya
 * saldado, tildado. Lo de meses futuros aparece cuando llega su mes.
 */
export function ProximosCompromisos({ data, query }: { data: FinanceData; query: FinanceQuery }) {
  const { openPayment } = useFinanceDialogs();
  const month = today().slice(0, 7);
  const items = monthCommitments(data, month);
  const resueltos = items.filter((c) => c.settled).length;

  return (
    <SeccionCard
      title="Compromisos del mes"
      description={`${monthLongLabel(month)} · ${resueltos} de ${items.length} resueltos`}
      action={
        <Link
          href={vistaHref(query, "compromisos")}
          className="text-sm font-medium text-primary-500 hover:underline"
        >
          Ver todos
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          No hay compromisos este mes. Los de otros meses están en{" "}
          <Link href={vistaHref(query, "compromisos")} className="font-medium text-primary-500 hover:underline">
            Compromisos
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-card-border">
          {items.map(({ row, entity, date, settled, overdue, settledAmount }) => {
            const incoming = isIncoming(row);
            return (
              <li
                key={`${entity}:${row.id}:${settled ? "ok" : "pendiente"}`}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className={cn("min-w-0", settled && "opacity-60")}>
                  <p
                    className={cn(
                      "truncate text-sm font-medium text-text-primary",
                      settled && "line-through",
                    )}
                  >
                    {String(row.name)}
                  </p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {tipoCompromiso(entity, row.kind)} · {date}
                    {settled ? null : <> · {etiqueta(row.status)}</>}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-text-primary tabular-nums">
                    {money(settled ? settledAmount : defaultPaymentAmount(row, entity, data), row.currency)}
                    {settled ? null : overdue ? (
                      <Badge size="sm" color="error">
                        Vencido
                      </Badge>
                    ) : (
                      <Badge size="sm" color={incoming ? "success" : "gray"}>
                        {incoming ? "A cobrar" : "A pagar"}
                      </Badge>
                    )}
                  </p>
                </div>
                {settled ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-badge-success-text">
                    <CheckCircle1 className="size-4" aria-hidden="true" />
                    {incoming ? "Cobrado" : "Pagado"}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    appearance="outline"
                    onPress={() => openPayment(row, entity)}
                    aria-label={`${incoming ? "Registrar cobro" : "Registrar pago"}: ${row.name}`}
                  >
                    {incoming ? "Cobrar" : "Pagar"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SeccionCard>
  );
}
