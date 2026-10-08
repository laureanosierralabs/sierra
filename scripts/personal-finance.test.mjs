import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseMoney,
  validDate,
  parseEntity,
  accountBalance,
  financeSummary,
  remaining,
  goalProgress,
  converted,
  entityFields,
  fetchAllFinanceRows,
  preservedHistoricalQuote,
  matchesFinanceFilters,
  hasObligationPaymentHistory,
} from "../lib/personal-finance.ts";
const account = {
  id: "a",
  owner_id: "owner",
  currency: "USD",
  opening_balance: 408,
  active: true,
};
const movement = {
  id: "m",
  owner_id: "owner",
  account_id: "a",
  tipo: "ingreso",
  monto: 12.5,
  moneda: "USD",
  usd_amount: 12.5,
  fecha: "2026-10-07",
  estado: "cobrado",
  cancelled_at: null,
};
const data = {
  accounts: [account],
  movements: [movement],
  categories: [],
  schedules: [],
  obligations: [],
  goals: [],
  milestones: [],
  contributions: [],
  rate: null,
  projects: [],
  contextProjects: [],
  units: [],
};
test("money preserves decimal cents; ambiguous thousands rejected", () => {
  assert.equal(parseMoney("12.50"), 12.5);
  assert.equal(parseMoney("12,50"), 12.5);
  assert.equal(parseMoney("1500000"), 1500000);
  for (const raw of ["1.500.000", "1,000.00", "12.555", "NaN", "", "-1", "0"])
    assert.throws(() => parseMoney(raw));
  assert.equal(parseMoney("-20", true), -20);
});
test("installment fields remain locked after active or cancelled payment history", () => {
  assert.equal(hasObligationPaymentHistory("card", []), false);
  assert.equal(
    hasObligationPaymentHistory("card", [
      { ...movement, obligation_id: "other" },
    ]),
    false,
  );
  assert.equal(
    hasObligationPaymentHistory("card", [
      { ...movement, obligation_id: "card" },
    ]),
    true,
  );
  assert.equal(
    hasObligationPaymentHistory("card", [
      { ...movement, obligation_id: "card", cancelled_at: "2026-11-02" },
    ]),
    true,
  );
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261008000000_personal_finance.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(
    sql,
    /oldrow->>'monthly_payment'\)::numeric is distinct from \(rowdata->>'monthly_payment'/,
  );
  assert.match(
    sql,
    /oldrow->>'next_date'\)::date is distinct from \(rowdata->>'next_date'/,
  );
  assert.match(
    sql,
    /oldrow->>'next_month' is distinct from rowdata->>'next_month'/,
  );
  const ui = readFileSync(
    new URL("../components/personal-finance.tsx", import.meta.url),
    "utf8",
  );
  assert.match(ui, /readOnly=\{locked\}/);
});
test("untouched optional enum controls serialize valid SQL defaults", () => {
  const cases = [
    [
      "schedule",
      { name: "Netflix", kind: "subscription", currency: "ARS" },
      { frequency: "monthly", status: "active" },
    ],
    [
      "obligation",
      { name: "Card", counterparty: "Bank", kind: "debt", currency: "ARS" },
      { priority: "medium", status: "pending" },
    ],
    [
      "goal",
      { name: "Trip", amount: "100", currency: "USD" },
      { kind: "savings", status: "active" },
    ],
    [
      "milestone",
      { name: "Phase", goal_id: "goal-1", amount: "100" },
      { status: "active" },
    ],
  ];
  for (const [entity, values, expected] of cases) {
    const fd = new FormData();
    for (const [key, value] of Object.entries(values)) fd.set(key, value);
    for (const key of Object.keys(expected)) fd.set(key, "");
    const parsed = parseEntity(entity, fd);
    for (const [key, value] of Object.entries(expected)) {
      assert.equal(parsed[key], value);
      assert.equal(
        entityFields[entity].find((f) => f.name === key).default,
        value,
      );
    }
  }
});
test("owner pagination includes the 1001st ledger row in cash, income and debt outstanding", async () => {
  const fixtures = Array.from({ length: 1001 }, (_, i) => ({
    ...movement,
    id: String(i).padStart(6, "0"),
    monto: 1,
    usd_amount: 1,
    obligation_id: "r",
  }));
  const ranges = [];
  const rows = await fetchAllFinanceRows((from, to) => {
    ranges.push([from, to]);
    return Promise.resolve({ data: fixtures.slice(from, to + 1), error: null });
  });
  assert.equal(rows.length, 1001);
  assert.deepEqual(ranges, [
    [0, 499],
    [500, 999],
    [1000, 1499],
  ]);
  assert.equal(accountBalance(account, rows), 1409);
  assert.equal(
    financeSummary({ ...data, movements: rows }, "2026-10").income,
    1001,
  );
  assert.equal(remaining({ amount: 2000, id: "r" }, rows), 999);
  await assert.rejects(
    () =>
      fetchAllFinanceRows(() =>
        Promise.resolve({ data: null, error: { message: "Unavailable" } }),
      ),
    /Unavailable/,
  );
});
test("concept and amount edits preserve the historical FX timestamp; changed date/rate do not", () => {
  const original = {
    ...movement,
    moneda: "ARS",
    exchange_rate: 1250,
    exchange_quoted_at: "2026-10-07T10:37:21Z",
  };
  const expected = {
    exchange_rate: 1250,
    exchange_quoted_at: original.exchange_quoted_at,
  };
  assert.deepEqual(
    preservedHistoricalQuote(original, "ARS", original.fecha, "1250"),
    expected,
  );
  assert.deepEqual(
    preservedHistoricalQuote(original, "ARS", original.fecha, ""),
    expected,
  );
  assert.deepEqual(
    preservedHistoricalQuote(
      { ...original, monto: 200 },
      "ARS",
      original.fecha,
      "1250.0000",
    ),
    expected,
  );
  assert.equal(
    preservedHistoricalQuote(original, "ARS", original.fecha, "1300"),
    null,
  );
  assert.equal(
    preservedHistoricalQuote(original, "ARS", "2026-10-06", "1250"),
    null,
  );
  assert.equal(
    preservedHistoricalQuote(original, "USD", original.fecha, "1250"),
    null,
  );
});
test("date filters use exact commitment dates and month-only obligations, never account creation", () => {
  const october = { month: "2026-10" },
    november = { month: "2026-11" };
  const housing = { next_date: "2026-10-15", currency: "ARS" };
  const card = { next_date: null, next_month: "2026-11", currency: "ARS" };
  const jeremias = {
    target_date: null,
    target_month: "2026-11",
    currency: "USD",
  };
  assert.equal(matchesFinanceFilters(housing, october, "schedule"), true);
  assert.equal(matchesFinanceFilters(housing, november, "schedule"), false);
  assert.equal(matchesFinanceFilters(card, october, "obligation"), false);
  assert.equal(matchesFinanceFilters(card, november, "obligation"), true);
  assert.equal(matchesFinanceFilters(jeremias, november, "obligation"), true);
  assert.equal(
    matchesFinanceFilters(
      card,
      { from: "2026-11-20", to: "2026-11-25" },
      "obligation",
    ),
    true,
  );
  assert.equal(
    matchesFinanceFilters(card, { from: "2026-12-01" }, "obligation"),
    false,
  );
  assert.equal(
    matchesFinanceFilters(
      account,
      { ...october, from: "2027-01-01" },
      "account",
    ),
    true,
  );
  assert.equal(
    matchesFinanceFilters(account, { account: "different" }, "account"),
    false,
  );
});
test("calendar validates real dates and leap years", () => {
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2026-13-01"), false);
  assert.equal(validDate("2024-02-29"), true);
});
test("opening balance is not monthly income; pending and cancelled ledger excluded", () => {
  const d = {
    ...data,
    movements: [
      movement,
      { ...movement, id: "pending", monto: 5000, estado: "pendiente" },
      { ...movement, id: "cancel", monto: 10000, cancelled_at: "2026-10-07" },
      {
        ...movement,
        id: "expense",
        tipo: "egreso",
        estado: "pagado",
        monto: 20,
        usd_amount: 20,
      },
    ],
  };
  assert.equal(accountBalance(account, d.movements), 400.5);
  const s = financeSummary(d, "2026-10");
  assert.equal(s.cash, 400.5);
  assert.equal(s.income, 12.5);
  assert.equal(s.expense, 20);
});
test("FX missing stays unknown; historical snapshots never use current FX", () => {
  const d = {
    ...data,
    accounts: [{ ...account, currency: "ARS", opening_balance: 55000 }],
    movements: [{ ...movement, moneda: "ARS", monto: 100000, usd_amount: 100 }],
    rate: { rate: 2000 },
  };
  assert.equal(financeSummary(d, "2026-10").income, 100);
  assert.equal(financeSummary({ ...d, rate: null }, "2026-10").cash, null);
  assert.equal(converted(10, "USD", null), 10);
  assert.equal(converted(100000, "ARS", 1000), 100);
});
test("debt creation does not spend cash; partial payments affect cash and net once", () => {
  const debt = {
    id: "d",
    amount: 1500,
    currency: "USD",
    kind: "debt",
    allocation_known: true,
    status: "pending",
  };
  const d = {
    ...data,
    obligations: [debt],
    movements: [
      {
        ...movement,
        tipo: "egreso",
        monto: 100,
        usd_amount: 100,
        estado: "pagado",
        obligation_id: "d",
      },
    ],
  };
  assert.equal(remaining(debt, d.movements), 1400);
  const s = financeSummary(d, "2026-10");
  assert.equal(s.cash, 308);
  assert.equal(s.net, -1092);
  assert.equal(remaining({ ...debt, amount: null }, d.movements), null);
});
test("joint unknown debt excluded from known wealth with explicit warning", () => {
  const s = financeSummary(
    {
      ...data,
      obligations: [
        {
          id: "x",
          amount: 700000,
          currency: "ARS",
          kind: "debt",
          status: "review",
          allocation_known: false,
        },
      ],
    },
    "2026-10",
  );
  assert.equal(s.net, s.cash);
  assert.equal(s.wealthUnknown, true);
});
test("goal earmark does not create cash or income; income goal only posted personal income", () => {
  const goal = { id: "g", kind: "savings", currency: "USD" };
  const d = { ...data, contributions: [{ goal_id: "g", amount: 100 }] };
  assert.equal(goalProgress(goal, d, "2026-10"), 100);
  assert.equal(financeSummary(d, "2026-10").income, 12.5);
  assert.equal(goalProgress({ ...goal, kind: "income" }, d, "2026-10"), 12.5);
});
test("entity parser ignores forged owner and rejects unknown state/receivable amount", () => {
  const fd = new FormData();
  fd.set("name", "Test");
  fd.set("kind", "receivable");
  fd.set("counterparty", "Person");
  fd.set("currency", "USD");
  fd.set("priority", "medium");
  fd.set("status", "pending");
  fd.set("owner_id", "forged");
  assert.throws(() => parseEntity("obligation", fd), /monto/);
  fd.set("amount", "12.50");
  const row = parseEntity("obligation", fd);
  assert.equal(row.amount, 12.5);
  assert.equal("owner_id" in row, false);
  fd.set("status", "anything");
  assert.throws(() => parseEntity("obligation", fd));
});
test("every new action and DAL enforces authoritative Clerk owner; legacy cannot mutate personal", () => {
  const action = readFileSync(
    new URL("../app/finanzas/personal/actions.ts", import.meta.url),
    "utf8",
  );
  const server = readFileSync(
    new URL("../lib/personal-finance-server.ts", import.meta.url),
    "utf8",
  );
  const legacy = readFileSync(
    new URL("../app/finanzas/acciones.ts", import.meta.url),
    "utf8",
  );
  assert.equal(
    (action.match(/await requireFinanceOwner\(\)/g) || []).length,
    3,
  );
  assert.match(
    server.replace(/\s/g, ""),
    /if\(!userId\|\|!\(awaitaccesoActual\(\)\)\.esOwner\)/,
  );
  assert.match(server.replace(/\s/g, ""), /\.eq\("owner_id",owner\)/);
  assert.match(legacy, /mov\.ambito !== "negocio"/);
  assert.match(legacy, /\.eq\("ambito", "negocio"\)/);
});
