"use client";

import { Plus } from "@tailgrids/icons";
import { DonutChartCard } from "@/components/common/charts/donut-chart-card";
import { CHART_COLORS } from "@/components/common/charts/chart-theme";
import { HorizontalBarChartCard } from "@/components/common/charts/horizontal-bar-chart-card";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/tailgrids/core/button";
import { matchesFinanceFilters, money, type FinanceData } from "@/lib/personal-finance";
import { balancesByAccount, currencySplit } from "@/lib/personal-finance-stats";
import { SeedCard, needsSeed } from "../ajustes/seed-card";
import { useFinanceDialogs } from "../editores/dialogos";
import type { FinanceQuery } from "../tipos";
import { CuentaCard } from "./cuenta-card";
import { ObjetivoCard } from "./objetivo-card";

const formatUsd = (value: number) => money(value, "USD");
const PARCIAL = "Estimación parcial: las cuentas en ARS sin cotización disponible no se incluyen.";

export function PatrimonioView({
  data,
  month,
  query,
}: {
  data: FinanceData;
  month: string;
  query: FinanceQuery;
}) {
  const { openEntity } = useFinanceDialogs();
  const balances = balancesByAccount(data);
  const known = balances.filter((b) => b.usd !== null);
  const split = currencySplit(data);
  const accounts = data.accounts.filter((a) => matchesFinanceFilters(a, query, "account"));

  const addAccount = () => openEntity("account", { title: "Agregar cuenta" });
  const addGoal = () => openEntity("goal", { title: "Agregar objetivo" });

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="patrimonio-cuentas" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="patrimonio-cuentas" className="text-lg font-semibold text-text-primary">
            Cuentas
          </h2>
          <Button onPress={addAccount}>
            <Plus />
            Agregar cuenta
          </Button>
        </div>

        {accounts.length === 0 ? (
          needsSeed(data) ? (
            <SeedCard />
          ) : (
            <EmptyState
              title="Todavía no hay cuentas"
              description="Agregá la primera cuenta para registrar saldos y movimientos."
              action={<Button onPress={addAccount}>Agregar cuenta</Button>}
            />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <CuentaCard key={account.id} account={account} data={data} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <HorizontalBarChartCard
                  title="Saldo por cuenta"
                  description="Cuentas activas · equivalente en USD"
                  data={known.map((b) => ({
                    name: b.name,
                    value: b.usd ?? 0,
                    color: b.currency === "USD" ? CHART_COLORS.net : undefined,
                  }))}
                  valueLabel="Saldo (USD)"
                  formatValue={formatUsd}
                  isEmpty={known.length === 0}
                  emptyMessage="No hay cuentas activas con saldo convertible a USD."
                  footer={known.length < balances.length ? PARCIAL : undefined}
                />
              </div>
              <DonutChartCard
                title="Reparto ARS / USD"
                description="Cash disponible medido en USD"
                data={split.items.map((i) => ({ name: i.name, value: i.value }))}
                centerValue={money(split.total, "USD")}
                centerLabel="Cash"
                height={280}
                formatValue={formatUsd}
                isEmpty={split.items.length === 0}
                emptyMessage="Sin saldo positivo para repartir."
                footer={split.parcial ? PARCIAL : undefined}
              />
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="patrimonio-objetivos" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="patrimonio-objetivos" className="text-lg font-semibold text-text-primary">
            Objetivos
          </h2>
          <Button onPress={addGoal}>
            <Plus />
            Agregar objetivo
          </Button>
        </div>
        {data.goals.length === 0 ? (
          <EmptyState
            title="Todavía no hay objetivos"
            description="Creá un objetivo de ahorro o de ingreso mensual para seguir tu avance."
            action={<Button onPress={addGoal}>Agregar objetivo</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {data.goals.map((goal) => (
              <ObjetivoCard key={goal.id} goal={goal} data={data} month={month} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
