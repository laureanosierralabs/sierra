/**
 * Agregaciones puras de Finanzas personales (sin React, sin I/O).
 * Se apoyan en los helpers de `personal-finance.ts` y nunca inventan USD:
 * si un `usd_amount` o la cotización faltan, el resultado marca `parcial`.
 */
import {
  accountBalance,
  converted,
  goalProgress,
  isPosted,
  remaining,
  today,
  type FinanceData,
  type FinanceRow,
} from "./personal-finance";

const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/* ───────────── Meses ───────────── */

/** Suma `delta` meses a un `AAAA-MM`. */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const index = year * 12 + (m - 1) + delta;
  const y = Math.floor(index / 12);
  return `${y}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** `2026-10` -> `oct 26`. */
export function monthShortLabel(month: string): string {
  const [year, m] = month.split("-");
  return `${MESES_CORTOS[Number(m) - 1] ?? m} ${year.slice(2)}`;
}

/** `2026-10` -> `octubre 2026`. */
export function monthLongLabel(month: string): string {
  const [year, m] = month.split("-");
  return `${MESES_LARGOS[Number(m) - 1] ?? m} ${year}`;
}

/** Meses con movimientos, más el actual y el elegido, del más nuevo al más viejo. */
export function availableMonths(data: FinanceData, selected: string): string[] {
  const set = new Set<string>([today().slice(0, 7), selected]);
  for (const m of data.movements) {
    const month = String(m.fecha ?? "").slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(month)) set.add(month);
  }
  return [...set].sort().reverse();
}

/* ───────────── Movimientos ───────────── */

export type MonthlyPoint = {
  mes: string;
  etiqueta: string;
  ingresos: number;
  gastos: number;
  neto: number;
  /** Algún movimiento del mes no tiene `usd_amount` y quedó fuera de las sumas. */
  parcial: boolean;
};

/** Ingresos, gastos y neto (USD) de los últimos `months` meses hasta `endMonth`. */
export function monthlyIncomeExpense(
  data: FinanceData,
  months = 12,
  endMonth: string = today().slice(0, 7),
): MonthlyPoint[] {
  const points = new Map<string, MonthlyPoint>();
  for (let i = months - 1; i >= 0; i--) {
    const mes = shiftMonth(endMonth, -i);
    points.set(mes, {
      mes, etiqueta: monthShortLabel(mes), ingresos: 0, gastos: 0, neto: 0, parcial: false,
    });
  }
  for (const m of data.movements) {
    if (!isPosted(m)) continue;
    const point = points.get(String(m.fecha).slice(0, 7));
    if (!point) continue;
    if (m.usd_amount === null || m.usd_amount === undefined) {
      point.parcial = true;
      continue;
    }
    if (m.tipo === "ingreso") point.ingresos += Number(m.usd_amount);
    else point.gastos += Number(m.usd_amount);
  }
  return [...points.values()].map((p) => ({
    ...p,
    ingresos: round(p.ingresos),
    gastos: round(p.gastos),
    neto: round(p.ingresos - p.gastos),
  }));
}

export type CategorySlice = { name: string; value: number };

/** Gastos pagados del mes por categoría (USD): las `top` mayores y el resto en "Otros". */
export function expensesByCategory(data: FinanceData, month: string, top = 6) {
  const totals = new Map<string, number>();
  let parcial = false;
  for (const m of data.movements) {
    if (!isPosted(m) || m.tipo !== "egreso" || !String(m.fecha).startsWith(month)) continue;
    const name = String(m.categoria ?? "Sin categoría");
    if (m.usd_amount === null || m.usd_amount === undefined) {
      parcial = true;
      continue;
    }
    totals.set(name, (totals.get(name) ?? 0) + Number(m.usd_amount));
  }
  const sorted = [...totals.entries()]
    .map(([name, value]) => ({ name, value: round(value) }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, top);
  const rest = sorted.slice(top).reduce((n, slice) => n + slice.value, 0);
  const items: CategorySlice[] = rest > 0 ? [...head, { name: "Otros", value: round(rest) }] : head;
  return { items, total: round(sorted.reduce((n, s) => n + s.value, 0)), parcial };
}

export type DailyPoint = { dia: number; fecha: string; gastos: number };

/** Gasto pagado por día del mes (USD), de 1 a `lastDay` (por defecto, todo el mes). */
export function dailyExpenses(data: FinanceData, month: string, lastDay?: number) {
  const [year, m] = month.split("-").map(Number);
  const days = Math.min(lastDay ?? 31, new Date(Date.UTC(year, m, 0)).getUTCDate());
  const byDay = new Array<number>(days).fill(0);
  let parcial = false;
  for (const mov of data.movements) {
    if (!isPosted(mov) || mov.tipo !== "egreso" || !String(mov.fecha).startsWith(month)) continue;
    if (mov.usd_amount === null || mov.usd_amount === undefined) {
      parcial = true;
      continue;
    }
    const day = Number(String(mov.fecha).slice(8, 10));
    if (day >= 1 && day <= days) byDay[day - 1] += Number(mov.usd_amount);
  }
  const points: DailyPoint[] = byDay.map((gastos, i) => ({
    dia: i + 1,
    fecha: `${month}-${String(i + 1).padStart(2, "0")}`,
    gastos: round(gastos),
  }));
  return { points, parcial };
}

/** Variación porcentual; `null` si falta un dato o el período previo es 0. */
export function deltaPercent(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/* ───────────── Compromisos ───────────── */

export type Commitment = { row: FinanceRow; entity: "schedule" | "obligation" };

const CLOSED_OBLIGATION = ["paid", "collected", "cancelled", "uncollectible"];

/** Fecha (o mes) en que vence un compromiso, tal como se ordena. */
export function commitmentDate(row: FinanceRow): string | null {
  const value = row.next_date ?? row.target_date ?? row.next_month ?? row.target_month;
  return value ? String(value) : null;
}

/** Cronogramas activos/incompletos y obligaciones abiertas, por fecha más cercana. */
export function upcomingCommitments(data: FinanceData, limit?: number): Commitment[] {
  const sorted: Commitment[] = [
    ...data.schedules
      .filter((schedule) => ["active", "incomplete"].includes(String(schedule.status)))
      .map((row) => ({ row, entity: "schedule" as const })),
    ...data.obligations
      .filter((obligation) => !CLOSED_OBLIGATION.includes(String(obligation.status)))
      .map((row) => ({ row, entity: "obligation" as const })),
  ].sort((a, b) =>
    String(
      a.row.next_date ?? a.row.target_date ?? a.row.next_month ?? a.row.target_month ?? "9999",
    ).localeCompare(
      String(
        b.row.next_date ?? b.row.target_date ?? b.row.next_month ?? b.row.target_month ?? "9999",
      ),
    ),
  );
  return limit === undefined ? sorted : sorted.slice(0, limit);
}

/** Monto sugerido al pagar: cuota mensual, o el saldo pendiente / monto del cronograma. */
export function defaultPaymentAmount(
  row: FinanceRow,
  entity: "schedule" | "obligation",
  data: FinanceData,
): number | null {
  const value =
    row.monthly_payment ?? (entity === "obligation" ? remaining(row, data.movements) : row.amount);
  return value === null || value === undefined ? null : Number(value);
}

/** `true` si el compromiso es plata que entra (ingreso recurrente o cuenta por cobrar). */
export function isIncoming(row: FinanceRow): boolean {
  return row.kind === "income" || row.kind === "receivable";
}

export type DueBucket = { mes: string; etiqueta: string; pagos: number; cobros: number };

/** Vencimientos de los próximos `months` meses (USD), con los vencidos y sin fecha aparte. */
export function duesByMonth(data: FinanceData, months = 6, startMonth: string = today().slice(0, 7)) {
  const rate = data.rate?.rate ?? null;
  const buckets = new Map<string, DueBucket>();
  for (let i = 0; i < months; i++) {
    const mes = shiftMonth(startMonth, i);
    buckets.set(mes, { mes, etiqueta: monthShortLabel(mes), pagos: 0, cobros: 0 });
  }
  const overdue = { pagos: 0, cobros: 0, count: 0 };
  let sinFecha = 0;
  let parcial = false;
  for (const { row, entity } of upcomingCommitments(data)) {
    const date = commitmentDate(row);
    if (!date) {
      sinFecha++;
      continue;
    }
    const period = date.slice(0, 7);
    const target = buckets.get(period) ?? (period < startMonth ? overdue : null);
    if (!target) continue;
    const amount = defaultPaymentAmount(row, entity, data);
    const usd = amount === null ? null : converted(amount, String(row.currency), rate);
    if (target === overdue) overdue.count++;
    if (usd === null) {
      parcial = true;
      continue;
    }
    if (isIncoming(row)) target.cobros += usd;
    else target.pagos += usd;
  }
  const round2 = (b: { pagos: number; cobros: number }) => ({
    pagos: round(b.pagos), cobros: round(b.cobros),
  });
  return {
    buckets: [...buckets.values()].map((b) => ({ ...b, ...round2(b) })),
    overdue: { ...overdue, ...round2(overdue) },
    sinFecha,
    parcial,
  };
}

export type ObligationProgress = {
  total: number | null;
  paid: number;
  remaining: number | null;
  /** 0-100, o `null` si el total no se conoce. */
  percent: number | null;
};

/** Pagado vs pendiente de una obligación, en su moneda nativa. */
export function obligationProgress(o: FinanceRow, data: FinanceData): ObligationProgress {
  const paid = data.movements
    .filter((m) => m.obligation_id === o.id && isPosted(m))
    .reduce((n, m) => n + Number(m.monto), 0);
  const total = o.amount === null || o.amount === undefined ? null : Number(o.amount);
  return {
    total,
    paid: round(paid),
    remaining: remaining(o, data.movements),
    percent: total === null || total <= 0 ? null : Math.min(100, Math.max(0, (paid / total) * 100)),
  };
}

/* ───────────── Patrimonio ───────────── */

export type AccountBalance = {
  id: string;
  name: string;
  currency: string;
  balance: number;
  usd: number | null;
};

/** Saldo de cada cuenta activa, nativo y en USD (`null` si falta la cotización). */
export function balancesByAccount(data: FinanceData): AccountBalance[] {
  const rate = data.rate?.rate ?? null;
  return data.accounts
    .filter((a) => a.active)
    .map((a) => {
      const balance = accountBalance(a, data.movements);
      const usd = converted(balance, String(a.currency), rate);
      return {
        id: a.id,
        name: String(a.name),
        currency: String(a.currency),
        balance,
        usd: usd === null ? null : round(usd),
      };
    })
    .sort((a, b) => (b.usd ?? -Infinity) - (a.usd ?? -Infinity));
}

/** Reparto del cash entre ARS y USD, medido en USD. Los saldos negativos no entran al gráfico. */
export function currencySplit(data: FinanceData) {
  const balances = balancesByAccount(data);
  const parcial = balances.some((b) => b.usd === null && b.balance !== 0);
  const items = (["USD", "ARS"] as const)
    .map((currency) => {
      const rows = balances.filter((b) => b.currency === currency);
      return {
        name: currency,
        native: round(rows.reduce((n, b) => n + b.balance, 0)),
        value: round(rows.reduce((n, b) => n + Math.max(0, b.usd ?? 0), 0)),
      };
    })
    .filter((item) => item.value > 0);
  return { items, total: round(items.reduce((n, i) => n + i.value, 0)), parcial };
}

export type GoalStats = {
  accumulated: number | null;
  gap: number;
  /** 0-100. */
  progress: number;
  /** Días hasta la fecha objetivo (negativo si venció), `null` sin fecha. */
  days: number | null;
};

/** Avance de un objetivo: acumulado, faltante, porcentaje y días restantes. */
export function goalStats(
  goal: FinanceRow,
  data: FinanceData,
  month: string,
  todayDate: string = today(),
): GoalStats {
  const accumulated = goalProgress(goal, data, month);
  const gap = Math.max(0, Number(goal.amount) - (accumulated ?? 0));
  const progress =
    accumulated === null ? 0 : Math.min(100, (accumulated / Number(goal.amount)) * 100);
  const days = goal.target_date
    ? Math.ceil(
        (Date.parse(String(goal.target_date) + "T00:00:00Z") -
          Date.parse(todayDate + "T00:00:00Z")) /
          86400000,
      )
    : null;
  return { accumulated, gap, progress, days };
}

/**
 * Un objetivo de ahorro tiene reservas sin respaldo si lo reservado en alguna de
 * sus cuentas supera el cash actual de esa cuenta (movido tal cual de la pantalla anterior).
 */
export function hasUnbackedReserve(goal: FinanceRow, data: FinanceData): boolean {
  if (goal.kind !== "savings") return false;
  return data.contributions
    .filter((c) => c.goal_id === goal.id)
    .some((c) => {
      const a = data.accounts.find((a) => a.id === c.account_id);
      return (
        !!a &&
        data.contributions
          .filter((r) => r.account_id === a.id)
          .reduce((n, r) => n + Number(r.amount), 0) > Math.max(0, accountBalance(a, data.movements))
      );
    });
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
