"use client";

import { Pencil1 } from "@tailgrids/icons";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { accountBalance, converted, money, type FinanceData, type FinanceRow } from "@/lib/personal-finance";
import { cn } from "@/utils/cn";
import { useFinanceDialogs } from "../editores/dialogos";

export function CuentaCard({ account, data }: { account: FinanceRow; data: FinanceData }) {
  const { openEntity } = useFinanceDialogs();
  const balance = accountBalance(account, data.movements);
  const currency = String(account.currency);
  const usd = currency === "USD" ? null : converted(balance, currency, data.rate?.rate ?? null);

  return (
    <Card className={cn("flex flex-col gap-3", !account.active && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-text-primary">{String(account.name)}</h3>
          <p className="mt-0.5 text-xs text-text-tertiary">
            {String(account.account_type ?? "Sin tipo")}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Badge size="sm" color="gray">
            {currency}
          </Badge>
          <Badge size="sm" color={account.active ? "success" : "gray"}>
            {account.active ? "Activa" : "Inactiva"}
          </Badge>
        </div>
      </div>

      <div>
        <p className="text-2xl font-semibold text-text-primary tabular-nums">{money(balance, currency)}</p>
        {currency !== "USD" && (
          <p className="text-sm text-text-tertiary tabular-nums">
            ≈ {usd === null ? "sin cotización" : money(usd, "USD")}
          </p>
        )}
      </div>

      <p className="text-xs text-text-tertiary">
        Inicial: {money(account.opening_balance, currency)} · Creada:{" "}
        {String(account.created_at).slice(0, 10)}
        {account.description ? ` · ${account.description}` : ""}
      </p>

      <div className="mt-auto flex justify-end border-t border-card-border pt-3">
        <Button
          size="sm"
          appearance="outline"
          onPress={() => openEntity("account", { row: account, title: "Editar / archivar cuenta" })}
        >
          <Pencil1 />
          Editar / archivar
        </Button>
      </div>
    </Card>
  );
}
