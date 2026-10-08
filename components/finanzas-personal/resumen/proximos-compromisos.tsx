"use client";

import Link from "next/link";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { money, type FinanceData } from "@/lib/personal-finance";
import {
  commitmentDate,
  defaultPaymentAmount,
  isIncoming,
  upcomingCommitments,
} from "@/lib/personal-finance-stats";
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

export function ProximosCompromisos({ data, query }: { data: FinanceData; query: FinanceQuery }) {
  const { openPayment } = useFinanceDialogs();
  const upcoming = upcomingCommitments(data, 5);

  return (
    <SeccionCard
      title="Próximos compromisos"
      description="Lo más cercano por pagar o cobrar"
      action={
        <Link
          href={vistaHref(query, "compromisos")}
          className="text-sm font-medium text-primary-500 hover:underline"
        >
          Ver todos
        </Link>
      }
    >
      {upcoming.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          No hay compromisos pendientes. Podés agregar suscripciones, deudas o cuentas por cobrar en{" "}
          <Link href={vistaHref(query, "compromisos")} className="font-medium text-primary-500 hover:underline">
            Compromisos
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-card-border">
          {upcoming.map(({ row, entity }) => {
            const incoming = isIncoming(row);
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{String(row.name)}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {tipoCompromiso(entity, row.kind)} · {commitmentDate(row) ?? "Fecha a confirmar"} ·{" "}
                    {etiqueta(row.status)}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-text-primary tabular-nums">
                    {money(defaultPaymentAmount(row, entity, data), row.currency)}
                    <Badge size="sm" color={incoming ? "success" : "gray"}>
                      {incoming ? "A cobrar" : "A pagar"}
                    </Badge>
                  </p>
                </div>
                <Button
                  size="sm"
                  appearance="outline"
                  onPress={() => openPayment(row, entity)}
                  aria-label={`${incoming ? "Registrar cobro" : "Registrar pago"}: ${row.name}`}
                >
                  {incoming ? "Cobrar" : "Pagar"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </SeccionCard>
  );
}
