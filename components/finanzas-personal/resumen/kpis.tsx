import { ArrowDownward, ArrowUpward, Bank1, Wallet2 } from "@tailgrids/icons";
import { KpiCard } from "@/components/common/kpi-card";
import { financeSummary, money, type FinanceData } from "@/lib/personal-finance";
import { deltaPercent, monthLongLabel, shiftMonth } from "@/lib/personal-finance-stats";

function formatDelta(current: number | null, previous: number | null, lowerIsBetter = false) {
  const delta = deltaPercent(current, previous);
  if (delta === null) return undefined;
  const rounded = Math.round(delta);
  return {
    value: `${rounded > 0 ? "+" : ""}${rounded}%`,
    positive: lowerIsBetter ? rounded <= 0 : rounded >= 0,
  };
}

/** Cash, patrimonio e ingresos/gastos del mes, con variación contra el mes anterior cuando se puede calcular. */
export function ResumenKpis({ data, month }: { data: FinanceData; month: string }) {
  const summary = financeSummary(data, month);
  const previous = financeSummary(data, shiftMonth(month, -1));
  const label = monthLongLabel(month);
  const partial = "Estimación parcial: hay movimientos sin conversión a USD.";

  return (
    <section
      aria-label="Indicadores del mes"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
    >
      <KpiCard
        label="Cash disponible"
        value={money(summary.cash)}
        icon={<Wallet2 />}
        tone="primary"
        hint={`${money(summary.native.USD)} + ${money(summary.native.ARS, "ARS")}`}
      />
      <KpiCard
        label="Patrimonio neto conocido"
        value={money(summary.net)}
        icon={<Bank1 />}
        tone="violet"
        hint={
          summary.wealthUnknown
            ? "Estimación parcial: se excluyen montos conjuntos, saldos de deuda o conversiones desconocidos."
            : "Cash + por cobrar − deudas."
        }
      />
      <KpiCard
        label={`Ingresos de ${label}`}
        value={money(summary.income)}
        icon={<ArrowDownward />}
        tone="success"
        delta={formatDelta(summary.income, previous.income)}
        hint={summary.income === null ? partial : "Efectivamente cobrados, vs. mes anterior."}
      />
      <KpiCard
        label={`Gastos de ${label}`}
        value={money(summary.expense)}
        icon={<ArrowUpward />}
        tone="error"
        delta={formatDelta(summary.expense, previous.expense, true)}
        hint={summary.expense === null ? partial : "Efectivamente pagados, vs. mes anterior."}
      />
    </section>
  );
}
