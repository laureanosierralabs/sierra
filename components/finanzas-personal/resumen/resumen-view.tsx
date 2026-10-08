"use client";

import { Wallet2 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/tailgrids/core/button";
import { today, type FinanceData } from "@/lib/personal-finance";
import { expensesByCategory, monthlyIncomeExpense } from "@/lib/personal-finance-stats";
import { SeedCard, needsSeed } from "../ajustes/seed-card";
import { useFinanceDialogs } from "../editores/dialogos";
import type { FinanceQuery } from "../tipos";
import { GraficoCategorias, GraficoIngresosGastos, GraficoNeto } from "./graficos";
import { ResumenKpis } from "./kpis";
import { ObjetivosResumen } from "./objetivos-resumen";
import { ProximosCompromisos } from "./proximos-compromisos";
import { SaldosCompactos } from "./saldos-compactos";

interface ResumenViewProps {
  data: FinanceData;
  month: string;
  query: FinanceQuery;
}

export function ResumenView({ data, month, query }: ResumenViewProps) {
  const { openEntity } = useFinanceDialogs();
  const points = monthlyIncomeExpense(data, 12, month);
  const categories = expensesByCategory(data, month);
  const hasAccounts = data.accounts.some((account) => account.active);

  return (
    <div className="flex flex-col gap-5">
      {!hasAccounts &&
        (needsSeed(data) ? (
          <SeedCard />
        ) : (
          <EmptyState
            icon={<Wallet2 />}
            title="No hay cuentas activas"
            description="Creá o reactivá una cuenta para registrar movimientos."
            action={
              <Button
                onPress={() =>
                  openEntity("account", { title: "Agregar cuenta", defaults: { currency: "USD" } })
                }
              >
                Agregar cuenta
              </Button>
            }
          />
        ))}

      <ResumenKpis data={data} month={month} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 xl:col-span-2">
          <GraficoIngresosGastos points={points} />
          <GraficoNeto points={points} />
          <SaldosCompactos data={data} query={query} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <GraficoCategorias
            month={month}
            items={categories.items}
            total={categories.total}
            parcial={categories.parcial}
          />
          <ProximosCompromisos data={data} query={query} />
          <ObjetivosResumen data={data} month={month} query={query} />
        </div>
      </div>

      {month === today().slice(0, 7) ? null : (
        <p className="text-xs text-text-tertiary">
          Los saldos y el patrimonio reflejan todas las fechas; solo los indicadores de ingresos y
          gastos siguen el mes elegido.
        </p>
      )}
    </div>
  );
}
