"use client";

import Link from "next/link";
import { Badge } from "@/components/tailgrids/core/badge";
import { money, type FinanceData } from "@/lib/personal-finance";
import { balancesByAccount } from "@/lib/personal-finance-stats";
import { SeccionCard } from "../seccion-card";
import type { FinanceQuery } from "../tipos";
import { vistaHref } from "../url";

/** Saldo de cada cuenta activa en una lista corta (nativo y ≈ USD). */
export function SaldosCompactos({ data, query }: { data: FinanceData; query: FinanceQuery }) {
  const balances = balancesByAccount(data);

  return (
    <SeccionCard
      title="Saldos por cuenta"
      description="Saldo de todas las fechas; ARS convertido con la cotización actual"
      action={
        <Link
          href={vistaHref(query, "patrimonio")}
          className="text-sm font-medium text-primary-500 hover:underline"
        >
          Administrar
        </Link>
      }
    >
      {balances.length === 0 ? (
        <p className="text-sm text-text-tertiary">No hay cuentas activas.</p>
      ) : (
        <ul className="divide-y divide-card-border">
          {balances.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-text-primary">{account.name}</span>
                <Badge size="sm" color="gray">
                  {account.currency}
                </Badge>
              </div>
              <div className="text-right tabular-nums">
                <p className="text-sm font-semibold text-text-primary">
                  {money(account.balance, account.currency)}
                </p>
                {account.currency !== "USD" && (
                  <p className="text-xs text-text-tertiary">
                    ≈ {account.usd === null ? "sin cotización" : money(account.usd, "USD")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SeccionCard>
  );
}
