export type Currency = "USD" | "ARS";
export type Entity =
  | "account"
  | "category"
  | "schedule"
  | "obligation"
  | "goal"
  | "milestone"
  | "contribution"
  | "movement";
export type FinanceRow = {
  id: string;
  owner_id: string;
  [key: string]: string | number | boolean | null;
};
export type FinanceData = {
  accounts: FinanceRow[];
  categories: FinanceRow[];
  schedules: FinanceRow[];
  obligations: FinanceRow[];
  goals: FinanceRow[];
  milestones: FinanceRow[];
  contributions: FinanceRow[];
  movements: FinanceRow[];
  rate: {
    rate: number | null;
    quoted_at: string | null;
    source: string | null;
    manual: boolean;
    seed_version: number;
  } | null;
  projects: { id: string; name: string }[];
  contextProjects: { slug: string; nombre: string }[];
  units: { slug: string; nombre: string }[];
};
export type Field = {
  name: string;
  label: string;
  type?: "number" | "date" | "month" | "checkbox" | "textarea";
  required?: boolean;
  options?: [string, string][];
  source?:
    | "accounts"
    | "categories"
    | "goals"
    | "projects"
    | "contextProjects"
    | "units";
  default?: string | boolean;
};
const currency: Field = {
  name: "currency",
  label: "Moneda",
  options: [
    ["USD", "USD"],
    ["ARS", "ARS"],
  ],
  required: true,
};
const name: Field = {
  name: "name",
  label: "Nombre / concepto",
  required: true,
};
const amount: Field = {
  name: "amount",
  label: "Monto",
  type: "number",
  required: true,
};
const description: Field = {
  name: "description",
  label: "Descripción",
  type: "textarea",
};
const account: Field = {
  name: "account_id",
  label: "Cuenta",
  source: "accounts",
};
const category: Field = {
  name: "category_id",
  label: "Categoría",
  source: "categories",
};
const target: Field = {
  name: "target_date",
  label: "Fecha objetivo",
  type: "date",
};
export const entityFields: Record<Exclude<Entity, "movement">, Field[]> = {
  account: [
    name,
    currency,
    {
      name: "opening_balance",
      label: "Saldo inicial (no ingreso)",
      type: "number",
      required: true,
      default: "0",
    },
    { name: "account_type", label: "Tipo de cuenta" },
    { name: "active", label: "Activa", type: "checkbox", default: true },
    description,
  ],
  category: [
    name,
    {
      name: "kind",
      label: "Tipo",
      options: [
        ["egreso", "Gasto"],
        ["ingreso", "Ingreso"],
      ],
      required: true,
    },
    { name: "active", label: "Activa", type: "checkbox", default: true },
  ],
  schedule: [
    name,
    {
      name: "kind",
      label: "Tipo",
      options: [
        ["subscription", "Suscripción"],
        ["income", "Ingreso recurrente"],
        ["expense", "Gasto programado"],
      ],
      required: true,
    },
    { ...amount, required: false },
    currency,
    account,
    category,
    {
      name: "frequency",
      label: "Frecuencia",
      options: [
        ["monthly", "Mensual"],
        ["yearly", "Anual"],
        ["once", "Una vez"],
        ["custom", "Personalizada"],
      ],
    },
    {
      name: "interval_days",
      label: "Días (frecuencia personalizada)",
      type: "number",
    },
    { name: "next_date", label: "Próxima fecha", type: "date" },
    { name: "period_end", label: "Fin del período", type: "date" },
    {
      name: "status",
      label: "Estado",
      options: [
        ["active", "Activa / pendiente"],
        ["paused", "Pausada"],
        ["cancelled", "Cancelada"],
        ["incomplete", "Pendiente de completar"],
        ["paid", "Pagado"],
      ],
    },
    { name: "origin", label: "Origen", default: "Personal" },
    description,
  ],
  obligation: [
    { name: "counterparty", label: "Acreedor / persona", required: true },
    name,
    {
      name: "kind",
      label: "Tipo",
      options: [
        ["debt", "Deuda"],
        ["receivable", "Cuenta por cobrar"],
      ],
      required: true,
    },
    { ...amount, required: false },
    currency,
    {
      name: "priority",
      label: "Prioridad",
      options: [
        ["low", "Baja"],
        ["medium", "Media"],
        ["medium-high", "Media-Alta"],
        ["high", "Alta"],
      ],
    },
    target,
    {
      name: "target_month",
      label: "Mes objetivo (si el día no se conoce)",
      type: "month",
    },
    {
      name: "status",
      label: "Estado",
      options: [
        ["pending", "Pendiente"],
        ["negotiating", "En negociación"],
        ["installments", "En cuotas"],
        ["review", "Por revisar"],
        ["paid", "Pagada"],
        ["cancelled", "Cancelada"],
        ["partial", "Parcial"],
        ["collected", "Cobrado"],
        ["uncollectible", "Incobrable"],
      ],
    },
    {
      name: "allocation_known",
      label: "Monto íntegramente personal confirmado",
      type: "checkbox",
      default: true,
    },
    { name: "installments", label: "Cantidad de cuotas", type: "number" },
    { name: "monthly_payment", label: "Cuota mensual", type: "number" },
    { name: "next_date", label: "Próxima cuota (día conocido)", type: "date" },
    { name: "next_month", label: "Próximo mes de cuota", type: "month" },
    description,
  ],
  goal: [
    name,
    {
      name: "kind",
      label: "Tipo",
      options: [
        ["savings", "Ahorro / patrimonio"],
        ["income", "Ingreso mensual neto"],
      ],
    },
    amount,
    currency,
    target,
    account,
    {
      name: "status",
      label: "Estado",
      options: [
        ["active", "Activo"],
        ["completed", "Completado"],
        ["paused", "Pausado"],
        ["cancelled", "Cancelado"],
      ],
    },
    description,
  ],
  milestone: [
    name,
    { name: "goal_id", label: "Objetivo", source: "goals", required: true },
    amount,
    target,
    { name: "target_month", label: "Mes (día desconocido)", type: "month" },
    {
      name: "status",
      label: "Estado",
      options: [
        ["active", "Activo"],
        ["completed", "Completado"],
        ["cancelled", "Cancelado"],
      ],
    },
    description,
  ],
  contribution: [
    {
      name: "goal_id",
      label: "Objetivo de ahorro",
      source: "goals",
      required: true,
    },
    { ...account, required: true },
    amount,
    currency,
    {
      name: "contributed_on",
      label: "Fecha del aporte",
      type: "date",
      required: true,
    },
    description,
  ],
};
// Optional enum controls still need concrete database defaults, not null.
const enumDefaults: Partial<
  Record<Exclude<Entity, "movement">, Record<string, string>>
> = {
  schedule: { frequency: "monthly", status: "active" },
  obligation: { priority: "medium", status: "pending" },
  goal: { kind: "savings", status: "active" },
  milestone: { status: "active" },
};
for (const [entity, defaults] of Object.entries(enumDefaults)) {
  for (const field of entityFields[entity as Exclude<Entity, "movement">]) {
    if (defaults[field.name]) field.default = defaults[field.name];
  }
}
export function parseMoney(value: unknown, allowZero = false): number {
  const raw = String(value ?? "").trim();
  if (!/^-?\d+(?:[.,]\d{1,2})?$/.test(raw))
    throw new Error("Monto inválido: usar decimales sin separadores de miles.");
  const n = Number(raw.replace(",", "."));
  if (
    !Number.isFinite(n) ||
    Math.abs(n) > 999999999999.99 ||
    (!allowZero && n <= 0)
  )
    throw new Error("Monto inválido.");
  return n;
}
export function validDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value
  );
}
export function parseEntity(
  entity: Exclude<Entity, "movement">,
  fd: FormData,
): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  for (const field of entityFields[entity]) {
    const submitted = String(fd.get(field.name) ?? "").trim();
    const raw =
      submitted || (typeof field.default === "string" ? field.default : "");
    if (field.type === "checkbox") {
      result[field.name] = fd.get(field.name) === "on";
      continue;
    }
    if (field.required && !raw)
      throw new Error(`Falta ${field.label.toLowerCase()}.`);
    if (!raw) {
      result[field.name] = null;
      continue;
    }
    if (raw.length > 10000) throw new Error("Texto demasiado largo.");
    if (field.type === "number") {
      result[field.name] = parseMoney(raw, field.name === "opening_balance");
      continue;
    }
    if (field.type === "date" && !validDate(raw))
      throw new Error("Fecha inválida.");
    if (field.type === "month" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw))
      throw new Error("Mes inválido.");
    if (field.options && !field.options.some(([v]) => v === raw))
      throw new Error("Opción inválida.");
    if (field.source && !/^[\w-]{1,150}$/.test(raw))
      throw new Error("Referencia inválida.");
    result[field.name] = raw;
  }
  if (
    entity === "obligation" &&
    result.kind === "receivable" &&
    result.amount === null
  )
    throw new Error("Completar monto de la cuenta por cobrar.");
  return result;
}
export function isPosted(m: FinanceRow): boolean {
  return !m.cancelled_at && (m.estado === "pagado" || m.estado === "cobrado");
}
export function hasObligationPaymentHistory(
  id: string,
  movements: FinanceRow[],
): boolean {
  // Cancellation reverses money, but does not erase the original plan history.
  return movements.some((movement) => movement.obligation_id === id);
}
export function accountBalance(a: FinanceRow, movements: FinanceRow[]): number {
  return (
    Math.round(
      (Number(a.opening_balance) +
        movements
          .filter((m) => m.account_id === a.id && isPosted(m))
          .reduce(
            (n, m) => n + (m.tipo === "ingreso" ? 1 : -1) * Number(m.monto),
            0,
          )) *
        100,
    ) / 100
  );
}
export function remaining(
  o: FinanceRow,
  movements: FinanceRow[],
): number | null {
  return o.amount === null
    ? null
    : Math.max(
        0,
        Number(o.amount) -
          movements
            .filter((m) => m.obligation_id === o.id && isPosted(m))
            .reduce((n, m) => n + Number(m.monto), 0),
      );
}
export function converted(
  amount: number,
  currency: string,
  rate: number | null,
): number | null {
  return currency === "USD" ? amount : rate && rate > 0 ? amount / rate : null;
}
export function goalProgress(
  goal: FinanceRow,
  data: FinanceData,
  month: string,
): number | null {
  if (goal.kind === "savings")
    return data.contributions
      .filter((c) => c.goal_id === goal.id)
      .reduce((n, c) => n + Number(c.amount), 0);
  const movements = data.movements.filter(
    (m) =>
      isPosted(m) && m.tipo === "ingreso" && String(m.fecha).startsWith(month),
  );
  if (goal.currency === "ARS")
    return movements.some((m) => m.moneda === "USD" && !data.rate?.rate)
      ? null
      : movements.reduce(
          (n, m) =>
            n +
            (m.moneda === "ARS"
              ? Number(m.monto)
              : Number(m.monto) * Number(data.rate?.rate)),
          0,
        );
  if (movements.some((m) => m.usd_amount === null)) return null;
  return movements.reduce((n, m) => n + Number(m.usd_amount), 0);
}
export function financeSummary(data: FinanceData, month: string) {
  const rate = data.rate?.rate ?? null;
  let cash = 0,
    net = 0,
    income = 0,
    expense = 0;
  let cashUnknown = false,
    wealthUnknown = false,
    incomeUnknown = false,
    expenseUnknown = false;
  const native = { USD: 0, ARS: 0 };
  for (const a of data.accounts) {
    const b = accountBalance(a, data.movements);
    native[a.currency as Currency] += b;
    const usd = converted(b, String(a.currency), rate);
    if (usd === null && b !== 0) cashUnknown = true;
    else cash += usd ?? 0;
  }
  net = cash;
  for (const o of data.obligations) {
    if (
      ["cancelled", "uncollectible", "paid", "collected"].includes(
        String(o.status),
      )
    )
      continue;
    const r = remaining(o, data.movements);
    if (!o.allocation_known || r === null) {
      wealthUnknown = true;
      continue;
    }
    const usd = converted(r, String(o.currency), rate);
    if (usd === null) {
      wealthUnknown = true;
      continue;
    }
    net += (o.kind === "debt" ? -1 : 1) * usd;
  }
  for (const m of data.movements.filter(
    (m) => isPosted(m) && String(m.fecha).startsWith(month),
  )) {
    if (m.usd_amount === null) {
      if (m.tipo === "ingreso") incomeUnknown = true;
      else expenseUnknown = true;
    } else if (m.tipo === "ingreso") income += Number(m.usd_amount);
    else expense += Number(m.usd_amount);
  }
  return {
    cash: cashUnknown ? null : cash,
    net: cashUnknown ? null : net,
    income: incomeUnknown ? null : income,
    expense: expenseUnknown ? null : expense,
    native,
    wealthUnknown: wealthUnknown || cashUnknown,
  };
}
export function money(value: unknown, currency: unknown = "USD"): string {
  return value === null || value === undefined
    ? "Pendiente de completar"
    : `${currency} ${Number(value).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}
export function today(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

export async function fetchAllFinanceRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    if (page.error) throw new Error(page.error.message);
    rows.push(...(page.data ?? []));
    if ((page.data?.length ?? 0) < pageSize) return rows;
  }
}

export function preservedHistoricalQuote(
  existing: FinanceRow | null,
  currency: string,
  date: string,
  explicit: string,
) {
  if (
    currency !== "ARS" ||
    !existing ||
    existing.moneda !== currency ||
    existing.fecha !== date ||
    !existing.exchange_rate ||
    !existing.exchange_quoted_at
  )
    return null;
  if (
    explicit &&
    Number(explicit.replace(",", ".")) !== Number(existing.exchange_rate)
  )
    return null;
  return {
    exchange_rate: Number(existing.exchange_rate),
    exchange_quoted_at: String(existing.exchange_quoted_at),
  };
}

export function matchesFinanceFilters(
  row: FinanceRow,
  query: Record<string, string>,
  entity: "movement" | "schedule" | "obligation" | "account",
) {
  const currency = row.moneda ?? row.currency;
  const date =
    entity === "movement"
      ? row.fecha
      : entity === "schedule"
        ? row.next_date
        : (row.next_date ?? row.target_date);
  const period = date
    ? String(date).slice(0, 7)
    : entity === "obligation"
      ? (row.next_month ?? row.target_month)
      : null;
  const hasDateFilters = !!(query.month || query.from || query.to);
  const dateMatch =
    entity === "account" ||
    !hasDateFilters ||
    (!!period &&
      (!query.month || period === query.month) &&
      (!query.from ||
        (date
          ? String(date) >= query.from
          : String(period) >= query.from.slice(0, 7))) &&
      (!query.to ||
        (date
          ? String(date) <= query.to
          : String(period) <= query.to.slice(0, 7))));
  return (
    dateMatch &&
    (!query.currency || currency === query.currency) &&
    (!query.account ||
      (entity === "account" ? row.id : row.account_id) === query.account) &&
    (!query.category || row.category_id === query.category) &&
    (!query.status || (row.estado ?? row.status) === query.status) &&
    (!query.origin ||
      String(row.origin ?? "")
        .toLowerCase()
        .includes(query.origin.toLowerCase()))
  );
}
