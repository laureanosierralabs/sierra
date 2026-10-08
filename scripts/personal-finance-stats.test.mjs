import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Resolve the production extensionless TypeScript import with Node's native runner.
registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === "./personal-finance" ? "./personal-finance.ts" : specifier, context);
} });
const {
  shiftMonth,
  monthlyIncomeExpense,
  expensesByCategory,
  dailyExpenses,
  upcomingCommitments,
  duesByMonth,
  balancesByAccount,
  currencySplit,
  obligationProgress,
  goalStats,
  hasUnbackedReserve,
  deltaPercent,
  defaultPaymentAmount,
} = await import("../lib/personal-finance-stats.ts");

const mov = (id, tipo, fecha, usd, extra = {}) => ({
  id, owner_id: "o", account_id: "a", tipo, fecha, monto: usd ?? 100, moneda: usd === null ? "ARS" : "USD",
  usd_amount: usd, estado: tipo === "ingreso" ? "cobrado" : "pagado", cancelled_at: null, categoria: "Comida", ...extra,
});
const data = {
  accounts: [
    { id: "a", owner_id: "o", name: "Banco", currency: "USD", opening_balance: 100, active: true },
    { id: "b", owner_id: "o", name: "Pesos", currency: "ARS", opening_balance: 1000, active: true },
  ],
  categories: [], schedules: [], goals: [], milestones: [], contributions: [],
  obligations: [
    { id: "d1", owner_id: "o", name: "Deuda", kind: "debt", amount: 200, currency: "USD", status: "pending", target_date: "2026-11-15" },
    { id: "d2", owner_id: "o", name: "Sin fecha", kind: "debt", amount: 50, currency: "USD", status: "pending" },
    { id: "d3", owner_id: "o", name: "Cerrada", kind: "debt", amount: 50, currency: "USD", status: "paid", target_date: "2026-11-01" },
  ],
  movements: [
    mov("m1", "ingreso", "2026-10-02", 500),
    mov("m2", "egreso", "2026-10-03", 120),
    mov("m3", "egreso", "2026-10-03", null),
    mov("m4", "egreso", "2026-09-10", 40, { categoria: "Salud" }),
    mov("m5", "egreso", "2026-10-04", 999, { cancelled_at: "2026-10-05" }),
    mov("m6", "egreso", "2026-10-06", 60, { obligation_id: "d1", categoria: "Deuda" }),
  ],
  rate: { rate: 1000, quoted_at: null, source: null, manual: true, seed_version: 1 },
  projects: [], contextProjects: [], units: [],
};

test("shiftMonth cruza años", () => {
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
});

test("monthlyIncomeExpense suma solo posteados con USD y marca parcial", () => {
  const points = monthlyIncomeExpense(data, 3, "2026-10");
  assert.deepEqual(points.map((p) => p.mes), ["2026-08", "2026-09", "2026-10"]);
  const oct = points[2];
  assert.equal(oct.ingresos, 500);
  assert.equal(oct.gastos, 180);
  assert.equal(oct.neto, 320);
  assert.equal(oct.parcial, true);
  assert.equal(points[1].gastos, 40);
  assert.equal(points[1].parcial, false);
});

test("expensesByCategory agrupa, agrega Otros y marca parcial", () => {
  const r = expensesByCategory(data, "2026-10", 1);
  assert.deepEqual(r.items.map((i) => i.name), ["Comida", "Otros"]);
  assert.equal(r.total, 180);
  assert.equal(r.parcial, true);
});

test("dailyExpenses respeta el último día", () => {
  const { points } = dailyExpenses(data, "2026-10", 6);
  assert.equal(points.length, 6);
  assert.equal(points[2].gastos, 120);
  assert.equal(points[5].gastos, 60);
});

test("upcomingCommitments excluye cerradas y ordena por fecha", () => {
  const list = upcomingCommitments(data);
  assert.deepEqual(list.map((c) => c.row.id), ["d1", "d2"]);
  assert.equal(upcomingCommitments(data, 1).length, 1);
  assert.equal(defaultPaymentAmount(data.obligations[0], "obligation", data), 140);
});

test("duesByMonth reparte por mes y cuenta los sin fecha", () => {
  const r = duesByMonth(data, 3, "2026-10");
  assert.equal(r.buckets.find((b) => b.mes === "2026-11").pagos, 140);
  assert.equal(r.sinFecha, 1);
  assert.equal(r.parcial, false);
});

test("balancesByAccount y currencySplit son null-safe sin cotización", () => {
  const sinTasa = { ...data, rate: null };
  const rows = balancesByAccount(sinTasa);
  assert.equal(rows.find((r) => r.id === "b").usd, null);
  const split = currencySplit(sinTasa);
  assert.equal(split.parcial, true);
  assert.deepEqual(split.items.map((i) => i.name), ["USD"]);
  assert.equal(currencySplit(data).items.find((i) => i.name === "ARS").value, 1);
});

test("obligationProgress y goalStats", () => {
  const p = obligationProgress(data.obligations[0], data);
  assert.equal(p.paid, 60);
  assert.equal(p.remaining, 140);
  assert.equal(p.percent, 30);
  const goal = { id: "g", owner_id: "o", kind: "savings", amount: 100, currency: "USD", target_date: "2026-10-20" };
  const g = goalStats(goal, { ...data, contributions: [{ goal_id: "g", amount: 25 }] }, "2026-10", "2026-10-10");
  assert.equal(g.accumulated, 25);
  assert.equal(g.gap, 75);
  assert.equal(g.progress, 25);
  assert.equal(g.days, 10);
});

test("deltaPercent no inventa variaciones", () => {
  assert.equal(deltaPercent(110, 100), 10);
  assert.equal(deltaPercent(null, 100), null);
  assert.equal(deltaPercent(10, 0), null);
});

test("hasUnbackedReserve detecta reservas por encima del cash de la cuenta", () => {
  const goal = { id: "g", owner_id: "o", kind: "savings", amount: 100, currency: "USD" };
  const contribution = (amount) => ({ id: "c", goal_id: "g", account_id: "a", amount });
  // Cuenta "a": 100 de saldo inicial + 500 - 120 - 40... (solo posteados de esa cuenta)
  assert.equal(hasUnbackedReserve(goal, { ...data, contributions: [contribution(50)] }), false);
  assert.equal(hasUnbackedReserve(goal, { ...data, contributions: [contribution(10000)] }), true);
  assert.equal(hasUnbackedReserve({ ...goal, kind: "income" }, { ...data, contributions: [contribution(10000)] }), false);
});
