"use client";
import { useState, useTransition, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import {
  mutateFinance,
  seedFinance,
  updateFinanceRate,
} from "@/app/finanzas/personal/actions";
import {
  accountBalance,
  entityFields,
  financeSummary,
  goalProgress,
  isPosted,
  money,
  remaining,
  today,
  matchesFinanceFilters,
  hasObligationPaymentHistory,
  type Entity,
  type Field,
  type FinanceData,
  type FinanceRow,
} from "@/lib/personal-finance";

const input =
  "w-full rounded-lg border border-line bg-ground px-3 py-2 text-sm text-text focus:border-border-strong outline-none";
const button =
  "rounded-lg bg-text px-3 py-2 text-sm font-semibold text-ground disabled:opacity-50";
const secondary =
  "rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface-2 disabled:opacity-50";
const tabs = [
  ["summary", "Resumen"],
  ["accounts", "Cuentas"],
  ["income", "Ingresos"],
  ["expenses", "Gastos"],
  ["subscriptions", "Suscripciones"],
  ["debts", "Deudas / por pagar"],
  ["receivables", "Por cobrar"],
  ["goals", "Objetivos"],
];
const labels: Record<string, string> = {
  active: "Activo / pendiente",
  paused: "Pausado",
  cancelled: "Cancelado",
  incomplete: "Pendiente de completar",
  paid: "Pagado",
  pending: "Pendiente",
  negotiating: "En negociación",
  installments: "En cuotas",
  partial: "Parcial",
  collected: "Cobrado",
  uncollectible: "Incobrable",
  review: "Por revisar",
  completed: "Completado",
  monthly: "Mensual",
  yearly: "Anual",
  once: "Una vez",
  custom: "Personalizada",
  low: "Baja",
  medium: "Media",
  "medium-high": "Media-Alta",
  high: "Alta",
};
function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-text-3">
      <span>{label}</span>
      {children}
    </label>
  );
}
function ActionForm({
  children,
  entity,
  operation = "save",
  row,
  linkedId,
  onSuccess,
}: {
  children: ReactNode;
  entity: Entity;
  operation?: string;
  row?: FinanceRow;
  linkedId?: string;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const token = useRef<string | null>(null);
  return (
    <form
      action={(fd) => {
        if (
          ["delete", "cancel"].includes(operation) &&
          !window.confirm(
            "¿Confirmar? El historial se conserva cuando corresponde. Anular un movimiento revierte su efecto en el saldo.",
          )
        )
          return;
        fd.set("confirmed", "yes");
        token.current ??= crypto.randomUUID();
        fd.set("request_id", token.current);
        start(async () => {
          setError("");
          const result = await mutateFinance(fd);
          if (!result.ok) setError(result.error ?? "Error");
          else {
            token.current = null;
            onSuccess?.();
          }
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="operation" value={operation} />
      {row && <input type="hidden" name="id" value={row.id} />}{" "}
      {linkedId && <input type="hidden" name="linked_id" value={linkedId} />}
      {children}
      {error && (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      )}
      <button
        disabled={pending}
        className={
          operation === "delete" || operation === "cancel" ? secondary : button
        }
      >
        {pending
          ? "Guardando…"
          : operation === "delete"
            ? "Eliminar"
            : operation === "cancel"
              ? "Anular movimiento"
              : operation === "pay"
                ? "Registrar pago / cobro"
                : "Guardar"}
      </button>
    </form>
  );
}
function EditorField({
  field,
  row,
  data,
  defaults,
  locked = false,
}: {
  field: Field;
  row?: FinanceRow;
  data: FinanceData;
  defaults: Record<string, string>;
  locked?: boolean;
}) {
  const value =
    row?.[field.name] ?? defaults[field.name] ?? field.default ?? "";
  const options =
    field.options ??
    (field.source === "accounts"
      ? data.accounts
          .filter((a) => a.active || a.id === row?.account_id)
          .map((a) => [a.id, `${a.name} · ${a.currency}`])
      : field.source === "categories"
        ? data.categories.map((c) => [
            c.id,
            `${c.name} · ${c.kind === "ingreso" ? "Ingreso" : "Gasto"}`,
          ])
        : field.source === "goals"
          ? data.goals
              .filter((g) => field.name !== "goal_id" || g.kind === "savings")
              .map((g) => [g.id, String(g.name)])
          : field.source === "projects"
            ? data.projects.map((p) => [p.id, p.name])
            : field.source === "contextProjects"
              ? data.contextProjects.map((p) => [p.slug, p.nombre])
              : field.source === "units"
                ? data.units.map((u) => [u.slug, u.nombre])
                : null);
  return (
    <FieldLabel label={field.label}>
      {field.type === "checkbox" ? (
        <input
          type="checkbox"
          name={field.name}
          defaultChecked={Boolean(value)}
          className="size-5"
        />
      ) : options ? (
        <select
          name={field.name}
          defaultValue={String(
            value ||
              (field.required || field.options ? (options[0]?.[0] ?? "") : ""),
          )}
          required={field.required}
          className={input}
        >
          {!field.required && !field.options && (
            <option value="">Sin especificar</option>
          )}
          {options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          className={input}
          name={field.name}
          defaultValue={String(value)}
          rows={3}
        />
      ) : (
        <input
          className={input}
          name={field.name}
          defaultValue={String(value)}
          required={field.required}
          type={field.type ?? "text"}
          step={field.type === "number" ? "0.01" : undefined}
          maxLength={field.type ? undefined : 120}
          readOnly={locked}
        />
      )}
    </FieldLabel>
  );
}
function EntityEditor({
  entity,
  data,
  row,
  defaults = {},
  title,
}: {
  entity: Exclude<Entity, "movement">;
  data: FinanceData;
  row?: FinanceRow;
  defaults?: Record<string, string>;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const planLocked =
    entity === "obligation" &&
    !!row &&
    hasObligationPaymentHistory(row.id, data.movements);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="rounded-lg border border-line p-3"
    >
      <summary className="cursor-pointer text-sm font-semibold">
        {title}
      </summary>
      <div className="mt-4">
        <ActionForm entity={entity} row={row} onSuccess={() => setOpen(false)}>
          <div className="grid gap-3 sm:grid-cols-2">
            {entityFields[entity].map((field) =>
              defaults[field.name] &&
              !row &&
              ["kind", "goal_id"].includes(field.name) ? (
                <input
                  key={field.name}
                  type="hidden"
                  name={field.name}
                  value={defaults[field.name]}
                />
              ) : (
                <EditorField
                  key={field.name}
                  field={field}
                  row={row}
                  data={data}
                  defaults={defaults}
                  locked={
                    planLocked &&
                    ["monthly_payment", "next_date", "next_month"].includes(
                      field.name,
                    )
                  }
                />
              ),
            )}
          </div>
          {planLocked && (
            <p className="text-xs text-text-3">
              El plan tiene historial de pagos, incluidos anulados. La cuota
              mensual y el próximo período se conservan y avanzan mediante
              pagos; no se pueden editar manualmente. El monto total se puede
              completar o corregir sin reducirlo por debajo de lo ya pagado.
            </p>
          )}
          {entity === "contribution" && (
            <p className="text-xs text-text-3">
              Reservar dinero existente para un objetivo no genera un ingreso ni
              un gasto. La cuenta y el objetivo deben usar la misma moneda.
            </p>
          )}
          {entity === "account" && (
            <p className="text-xs text-text-3">
              Saldo actual = saldo inicial + movimientos efectivamente
              cobrados/pagados. Cambiar el saldo inicial es una corrección, no
              un ingreso.
            </p>
          )}
        </ActionForm>
        {row && (
          <div className="mt-3">
            <ActionForm entity={entity} operation="delete" row={row}>
              <p className="text-xs text-text-3">
                Si hay historial vinculado, usar el estado inactivo/cancelado en
                lugar de eliminar.
              </p>
            </ActionForm>
          </div>
        )}
      </div>
    </details>
  );
}
function AccountSelect({
  data,
  value,
  currency,
}: {
  data: FinanceData;
  value?: unknown;
  currency?: string;
}) {
  return (
    <select
      name="account_id"
      required
      defaultValue={String(value ?? "")}
      className={input}
    >
      <option value="">Seleccionar cuenta</option>
      {data.accounts
        .filter(
          (a) =>
            (a.active || a.id === value) &&
            (!currency || a.currency === currency),
        )
        .map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} · {a.currency}
          </option>
        ))}
    </select>
  );
}
function TransactionEditor({
  data,
  type,
  row,
}: {
  data: FinanceData;
  type: string;
  row?: FinanceRow;
}) {
  const listId = useId();
  const [currency, setCurrency] = useState(String(row?.moneda ?? "USD"));
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(String(row?.categoria ?? ""));
  const categories = data.categories.filter((c) => c.kind === type && c.active);
  const exists = categories.some((c) => c.name === category);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="rounded-lg border border-line p-3"
    >
      <summary className="cursor-pointer text-sm font-semibold">
        {row
          ? "Editar movimiento"
          : type === "ingreso"
            ? "Agregar ingreso"
            : "Agregar gasto"}
      </summary>
      <div className="mt-4">
        <ActionForm
          entity="movement"
          row={row}
          onSuccess={() => setOpen(false)}
        >
          <input type="hidden" name="tipo" value={type} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FieldLabel label="Concepto">
              <input
                required
                name="concepto"
                defaultValue={String(row?.concepto ?? "")}
                maxLength={160}
                className={input}
              />
            </FieldLabel>
            <FieldLabel label="Monto">
              <input
                required
                name="monto"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={String(row?.monto ?? "")}
                className={input}
              />
            </FieldLabel>
            <FieldLabel label="Moneda">
              <select
                name="moneda"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={input}
              >
                <option>USD</option>
                <option>ARS</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Categoría">
              <input
                required
                name="categoria"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list={`categories-${listId}`}
                maxLength={120}
                className={input}
              />
              <datalist id={`categories-${listId}`}>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.name)} />
                ))}
              </datalist>
              {category && !exists && (
                <span>Crear categoría «{category}» al guardar</span>
              )}
            </FieldLabel>
            <FieldLabel label="Cuenta">
              <AccountSelect
                data={data}
                value={row?.account_id}
                currency={currency}
              />
            </FieldLabel>
            <FieldLabel label="Fecha">
              <input
                required
                name="fecha"
                type="date"
                defaultValue={String(row?.fecha ?? today())}
                className={input}
              />
            </FieldLabel>
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-text-2">
              Detalles opcionales / cotización histórica ARS
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <FieldLabel label="Cotización ARS por USD (obligatoria en fechas distintas de hoy)">
                <input
                  name="exchange_rate"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  defaultValue={String(row?.exchange_rate ?? "")}
                  className={input}
                />
              </FieldLabel>
              <FieldLabel label="Estado">
                <select
                  name="estado"
                  defaultValue={String(
                    row?.estado ?? (type === "ingreso" ? "cobrado" : "pagado"),
                  )}
                  className={input}
                >
                  <option value={type === "ingreso" ? "cobrado" : "pagado"}>
                    {type === "ingreso" ? "Cobrado" : "Pagado"}
                  </option>
                  <option value="pendiente">Pendiente (no afecta cash)</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Origen">
                <input
                  name="origin"
                  defaultValue={String(row?.origin ?? "Personal")}
                  list={`finance-origins-${listId}`}
                  className={input}
                />
                <datalist id={`finance-origins-${listId}`}>
                  {[
                    ...new Set([
                      "Personal",
                      "Landing Pages",
                      "Synous",
                      "Seguro",
                      "Otro",
                      ...data.movements.map((m) =>
                        String(m.origin ?? "Personal"),
                      ),
                    ]),
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </datalist>
              </FieldLabel>
              <EditorField
                field={{
                  name: "related_business",
                  label: "Negocio relacionado",
                  source: "units",
                }}
                row={row}
                data={data}
                defaults={{}}
              />
              <EditorField
                field={{
                  name: "related_project",
                  label: "Proyecto Landing Pages",
                  source: "projects",
                }}
                row={row}
                data={data}
                defaults={{}}
              />
              <EditorField
                field={{
                  name: "related_context_project",
                  label: "Proyecto de contexto",
                  source: "contextProjects",
                }}
                row={row}
                data={data}
                defaults={{}}
              />
              <FieldLabel label="Recurrente">
                <input
                  name="recurring"
                  type="checkbox"
                  defaultChecked={Boolean(row?.recurring)}
                  className="size-5"
                />
              </FieldLabel>
              <FieldLabel label="Descripción">
                <textarea
                  name="notas"
                  defaultValue={String(row?.notas ?? "")}
                  className={input}
                />
              </FieldLabel>
            </div>
            <p className="mt-2 text-xs text-text-3">
              La cotización queda congelada en este movimiento. Los retiros del
              negocio se cargan manualmente como ingresos personales; nunca se
              importa su facturación.
            </p>
          </details>
        </ActionForm>
      </div>
    </details>
  );
}
function PaymentEditor({
  data,
  row,
  entity,
}: {
  data: FinanceData;
  row: FinanceRow;
  entity: "obligation" | "schedule";
}) {
  return (
    <details className="mt-3 rounded-lg border border-line p-3">
      <summary className="cursor-pointer text-sm font-semibold">
        {row.kind === "receivable" || row.kind === "income"
          ? "Registrar cobro"
          : "Registrar pago / cuota"}
      </summary>
      <div className="mt-4">
        <ActionForm entity={entity} operation="pay" linkedId={row.id}>
          <input type="hidden" name="moneda" value={String(row.currency)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldLabel label={`Monto (${row.currency})`}>
              <input
                required
                name="monto"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={String(
                  row.monthly_payment ??
                    (entity === "obligation"
                      ? remaining(row, data.movements)
                      : row.amount) ??
                    "",
                )}
                className={input}
              />
            </FieldLabel>
            <FieldLabel label="Cuenta">
              <AccountSelect
                data={data}
                value={row.account_id}
                currency={String(row.currency)}
              />
            </FieldLabel>
            <FieldLabel label="Fecha efectiva">
              <input
                required
                name="fecha"
                type="date"
                defaultValue={today()}
                className={input}
              />
            </FieldLabel>
            <FieldLabel label="Cotización histórica ARS por USD (si corresponde)">
              <input
                name="exchange_rate"
                type="number"
                step="0.0001"
                min="0.0001"
                className={input}
              />
            </FieldLabel>
          </div>
          <p className="text-xs text-text-3">
            Se registra un único movimiento y se actualiza el saldo pendiente
            dentro de la misma transacción.
          </p>
        </ActionForm>
      </div>
    </details>
  );
}
function History({
  data,
  id,
  entity,
}: {
  data: FinanceData;
  id: string;
  entity: string;
}) {
  const rows = data.movements.filter(
    (m) => m[entity === "obligation" ? "obligation_id" : "schedule_id"] === id,
  );
  return rows.length > 0 ? (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm">
        Historial ({rows.length})
      </summary>
      <div className="mt-3 space-y-3">
        {rows.map((m) => (
          <div key={m.id} className="border-t border-line pt-2 text-sm">
            <p>
              {m.fecha} · {money(m.monto, m.moneda)} ·{" "}
              {m.cancelled_at ? "Anulado" : m.estado}
            </p>
            {!m.cancelled_at && (
              <ActionForm entity="movement" operation="cancel" row={m}>
                <span className="sr-only">Anular pago</span>
              </ActionForm>
            )}
          </div>
        ))}
      </div>
    </details>
  ) : null;
}
function Filters({
  data,
  tab,
  query,
}: {
  data: FinanceData;
  tab: string;
  query: Record<string, string>;
}) {
  return (
    <details className="mb-5 rounded-lg border border-line p-3">
      <summary className="cursor-pointer text-sm">
        Filtros · mes / fecha / moneda / cuenta
      </summary>
      <form className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <input type="hidden" name="tab" value={tab} />
        <FieldLabel label="Mes / año">
          <input
            name="month"
            type="month"
            defaultValue={query.month ?? ""}
            className={input}
          />
        </FieldLabel>
        <FieldLabel label="Desde">
          <input
            name="from"
            type="date"
            defaultValue={query.from}
            className={input}
          />
        </FieldLabel>
        <FieldLabel label="Hasta">
          <input
            name="to"
            type="date"
            defaultValue={query.to}
            className={input}
          />
        </FieldLabel>
        <FieldLabel label="Moneda">
          <select
            name="currency"
            defaultValue={query.currency}
            className={input}
          >
            <option value="">Todas</option>
            <option>USD</option>
            <option>ARS</option>
          </select>
        </FieldLabel>
        <FieldLabel label="Cuenta">
          <select name="account" defaultValue={query.account} className={input}>
            <option value="">Todas</option>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Categoría">
          <select
            name="category"
            defaultValue={query.category}
            className={input}
          >
            <option value="">Todas</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Estado">
          <input
            name="status"
            defaultValue={query.status}
            list="finance-statuses"
            className={input}
          />
          <datalist id="finance-statuses">
            {[
              ...new Set([
                ...data.movements.map((m) => String(m.estado)),
                ...data.obligations.map((o) => String(o.status)),
                ...data.schedules.map((s) => String(s.status)),
              ]),
            ].map((s) => (
              <option key={s} value={s}>
                {labels[s] ?? s}
              </option>
            ))}
          </datalist>
        </FieldLabel>
        <FieldLabel label="Origen">
          <input name="origin" defaultValue={query.origin} className={input} />
        </FieldLabel>
        <div className="flex items-end gap-2">
          <button className={secondary}>Filtrar</button>
          <Link href={`?tab=${tab}`} className="py-2 text-xs">
            Limpiar
          </Link>
        </div>
      </form>
    </details>
  );
}
function RatePanel({ data }: { data: FinanceData }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const rate = data.rate;
  const [checkedAt] = useState(() => Date.now());
  const stale =
    !!rate?.quoted_at && checkedAt - Date.parse(rate.quoted_at) > 3600000;
  return (
    <details className="my-5 rounded-lg border border-line p-3">
      <summary className="cursor-pointer text-sm">
        Tipo de cambio ·{" "}
        {rate?.rate ? `ARS ${rate.rate} por USD` : "Sin cotización"} ·{" "}
        {rate?.manual
          ? "Override manual"
          : stale
            ? "Última cotización desactualizada"
            : "MEP venta"}
      </summary>
      <p className="mt-3 text-xs text-text-3">
        {rate?.source ?? "DolarAPI"} · {rate?.quoted_at ?? "Sin fecha"}. Cache
        de 1 hora; actualizar explícitamente. Cash usa esta referencia; el
        historial conserva su propia cotización. Sin cotización, no se inventan
        equivalencias.
      </p>
      <form
        action={(fd) =>
          start(async () => {
            setError("");
            const r = await updateFinanceRate(fd);
            if (!r.ok) setError(r.error ?? "Error");
          })
        }
        className="mt-3 flex flex-wrap gap-2"
      >
        <input
          aria-label="Cotización manual ARS por USD"
          name="rate"
          type="number"
          min="0.0001"
          step="0.0001"
          placeholder="ARS por USD"
          className={`${input} max-w-48`}
        />
        <button
          className={secondary}
          disabled={pending}
          name="mode"
          value="manual"
        >
          Aplicar manual
        </button>
        <button
          className={secondary}
          disabled={pending}
          name="mode"
          value={rate?.manual ? "automatic" : "refresh"}
        >
          {rate?.manual
            ? "Desactivar manual y consultar API"
            : "Actualizar API"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-critical">
          {error}
        </p>
      )}
    </details>
  );
}
function Goals({
  data,
  month,
  compact = false,
}: {
  data: FinanceData;
  month: string;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.goals
        .filter((g) => !compact || g.status === "active")
        .map((g) => {
          const accumulated = goalProgress(g, data, month);
          const gap = Math.max(0, Number(g.amount) - (accumulated ?? 0));
          const progress =
            accumulated === null
              ? 0
              : Math.min(100, (accumulated / Number(g.amount)) * 100);
          const days = g.target_date
            ? Math.ceil(
                (Date.parse(String(g.target_date) + "T00:00:00Z") -
                  Date.parse(today() + "T00:00:00Z")) /
                  86400000,
              )
            : null;
          return (
            <Card key={g.id} className="p-5">
              <div className="flex justify-between gap-2">
                <h3 className="font-semibold">{g.name}</h3>
                <span className="text-xs text-text-3">
                  {g.kind === "income"
                    ? "Ingreso mensual neto"
                    : "Ahorro / patrimonio"}
                </span>
              </div>
              <p className="mt-2 text-sm">
                {money(accumulated, g.currency)} / {money(g.amount, g.currency)}{" "}
                · {progress.toFixed(1)}%
              </p>
              <progress
                aria-label={`Progreso ${g.name}`}
                value={progress}
                max={100}
                className="mt-2 w-full"
              />
              <p className="mt-2 text-xs text-text-2">
                Faltante: {money(accumulated === null ? null : gap, g.currency)}{" "}
                · {g.target_date ?? "Sin fecha estricta"}{" "}
                {days !== null &&
                  `· ${days < 0 ? "Vencido" : `${days} días`} · ${days > 0 ? `${money(gap / days, g.currency)} / día aproximado` : "Revisar plazo"}`}
              </p>
              {g.kind === "income" && (
                <p className="mt-2 text-xs text-text-3">
                  Mes {month}: solo ingresos personales efectivamente recibidos.
                  No se suma facturación empresarial.
                </p>
              )}
              <p className="mt-2 text-xs text-text-3">{g.description}</p>
              {g.kind === "savings" &&
                data.contributions
                  .filter((c) => c.goal_id === g.id)
                  .some((c) => {
                    const a = data.accounts.find((a) => a.id === c.account_id);
                    return (
                      a &&
                      data.contributions
                        .filter((r) => r.account_id === a.id)
                        .reduce((n, r) => n + Number(r.amount), 0) >
                        Math.max(0, accountBalance(a, data.movements))
                    );
                  }) && (
                  <p className="mt-2 text-xs text-warn">
                    Reservas registradas sin respaldo suficiente en cash actual.
                    Revisar o liberar aportes; no representan dinero adicional.
                  </p>
                )}
              {data.milestones
                .filter((m) => m.goal_id === g.id)
                .map((m) => (
                  <div
                    key={m.id}
                    className="mt-3 border-t border-line pt-2 text-xs"
                  >
                    <p>
                      {m.name} · {money(m.amount, g.currency)} ·{" "}
                      {m.target_date ?? m.target_month ?? "Fecha pendiente"} ·{" "}
                      {labels[String(m.status)]}
                    </p>
                    <p className="text-text-3">{m.description}</p>
                    {!compact && (
                      <EntityEditor
                        entity="milestone"
                        data={data}
                        row={m}
                        title="Editar hito"
                      />
                    )}
                  </div>
                ))}
              {!compact && (
                <div className="mt-4 space-y-3">
                  <EntityEditor
                    entity="goal"
                    data={data}
                    row={g}
                    title="Editar objetivo"
                  />
                  <EntityEditor
                    entity="milestone"
                    data={data}
                    defaults={{ goal_id: g.id }}
                    title="Agregar hito"
                  />
                  {g.kind === "savings" && (
                    <>
                      <EntityEditor
                        entity="contribution"
                        data={data}
                        defaults={{
                          goal_id: g.id,
                          currency: String(g.currency),
                          contributed_on: today(),
                        }}
                        title="Reservar / aportar dinero existente"
                      />
                      {data.contributions
                        .filter((c) => c.goal_id === g.id)
                        .map((c) => (
                          <div key={c.id}>
                            <p className="text-xs">
                              {c.contributed_on} · {money(c.amount, c.currency)}{" "}
                              ·{" "}
                              {
                                data.accounts.find((a) => a.id === c.account_id)
                                  ?.name
                              }
                            </p>
                            <EntityEditor
                              entity="contribution"
                              data={data}
                              row={c}
                              title="Editar / liberar aporte"
                            />
                          </div>
                        ))}
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
    </div>
  );
}
export function PersonalFinance({
  data,
  query,
}: {
  data: FinanceData;
  query: Record<string, string>;
}) {
  const tab = tabs.some(([v]) => v === query.tab) ? query.tab : "summary";
  const month = query.month ?? today().slice(0, 7);
  const summary = financeSummary(data, month);
  const [seedError, setSeedError] = useState("");
  const [seeding, startSeed] = useTransition();
  const movementType = tab === "income" ? "ingreso" : "egreso";
  const movs = data.movements.filter(
    (m) =>
      m.tipo === movementType &&
      matchesFinanceFilters(m, { ...query, month }, "movement"),
  );
  const scheduleKind =
    tab === "income"
      ? "income"
      : tab === "expenses"
        ? "expense"
        : "subscription";
  return (
    <div className="w-full min-w-0 px-4 py-8 md:px-10">
      <header className="mb-6">
        <p className="eyebrow">Finanzas · personal · USD principal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          Finanzas personales
        </h1>
        <p className="mt-2 text-sm text-text-3">
          Dinero de Laureano. Los negocios conservan su caja; solo los retiros
          registrados ingresan aquí.
        </p>
      </header>
      <nav
        aria-label="Secciones de finanzas"
        className="mb-6 flex flex-wrap gap-2"
      >
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={`?tab=${key}${query.month ? `&month=${query.month}` : ""}`}
            aria-current={tab === key ? "page" : undefined}
            className={tab === key ? button : secondary}
          >
            {label}
          </Link>
        ))}
      </nav>
      {!data.rate?.seed_version && data.accounts.length === 0 && (
        <Card className="mb-5 p-5">
          <h2 className="font-semibold">Carga inicial de octubre de 2026</h2>
          <p className="mt-2 text-sm text-text-3">
            Cargar saldos iniciales aproximados, compromisos pendientes y
            objetivos. No genera cobros, gastos ni ingresos ficticios. La carga
            se ejecuta una sola vez para Laureano.
          </p>
          <button
            disabled={seeding}
            className={`${button} mt-3`}
            onClick={() => {
              if (
                !window.confirm(
                  "¿Cargar los datos iniciales personales conocidos?",
                )
              )
                return;
              startSeed(async () => {
                const r = await seedFinance();
                setSeedError(r.error ?? "");
              });
            }}
          >
            {seeding ? "Cargando…" : "Cargar datos iniciales"}
          </button>
          {seedError && (
            <p role="alert" className="mt-2 text-critical">
              {seedError}
            </p>
          )}
        </Card>
      )}
      <RatePanel data={data} />
      <Filters data={data} tab={tab} query={query} />
      {tab === "summary" && (
        <>
          <section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Cash disponible", summary.cash],
              ["Patrimonio neto conocido", summary.net],
              ["Ingresos del mes", summary.income],
              ["Gastos del mes", summary.expense],
            ].map(([label, value]) => (
              <Card key={String(label)} className="p-5">
                <p className="text-xs text-text-3">
                  {label} {String(label).includes("mes") && month}
                </p>
                <p className="mt-2 text-xl font-bold">{money(value)}</p>
                {label === "Cash disponible" && (
                  <p className="mt-2 text-xs text-text-3">
                    {money(summary.native.USD)} +{" "}
                    {money(summary.native.ARS, "ARS")}
                  </p>
                )}
                {label === "Patrimonio neto conocido" &&
                  summary.wealthUnknown && (
                    <p className="mt-2 text-xs text-warn">
                      Estimación parcial. Avalian compartida, total de tarjeta o
                      conversión desconocidos se excluyen; no es patrimonio
                      exacto.
                    </p>
                  )}
              </Card>
            ))}
          </section>
          <h2 className="mb-4 font-semibold">Objetivos activos</h2>
          <Goals data={data} month={month} compact />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Próximos compromisos</h2>
              {[
                ...data.schedules.filter((s) =>
                  ["active", "incomplete"].includes(String(s.status)),
                ),
                ...data.obligations.filter(
                  (o) =>
                    ![
                      "paid",
                      "collected",
                      "cancelled",
                      "uncollectible",
                    ].includes(String(o.status)),
                ),
              ]
                .sort((a, b) =>
                  String(
                    a.next_date ??
                      a.target_date ??
                      a.next_month ??
                      a.target_month ??
                      "9999",
                  ).localeCompare(
                    String(
                      b.next_date ??
                        b.target_date ??
                        b.next_month ??
                        b.target_month ??
                        "9999",
                    ),
                  ),
                )
                .map((s) => (
                  <p key={s.id} className="mb-3 text-sm">
                    {s.name} ·{" "}
                    {money(s.monthly_payment ?? s.amount, s.currency)}
                    <span className="block text-xs text-text-3">
                      {s.next_date ??
                        s.target_date ??
                        s.next_month ??
                        s.target_month ??
                        "Fecha pendiente"}{" "}
                      · {labels[String(s.status)]}
                    </span>
                  </p>
                ))}
            </Card>
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">
                Distribución de gastos · {month}
              </h2>
              {[
                ...new Set(
                  data.movements
                    .filter(
                      (m) =>
                        isPosted(m) &&
                        m.tipo === "egreso" &&
                        String(m.fecha).startsWith(month),
                    )
                    .map((m) => String(m.categoria)),
                ),
              ].map((c) => {
                const rows = data.movements.filter(
                  (m) =>
                    isPosted(m) &&
                    m.tipo === "egreso" &&
                    m.categoria === c &&
                    String(m.fecha).startsWith(month),
                );
                return (
                  <p key={c} className="mb-3 text-sm">
                    {c} ·{" "}
                    {money(
                      rows.some((m) => m.usd_amount === null)
                        ? null
                        : rows.reduce((n, m) => n + Number(m.usd_amount), 0),
                    )}
                  </p>
                );
              })}
            </Card>
            {["ingreso", "egreso"].map((type) => (
              <Card key={type} className="p-5">
                <h2 className="mb-3 font-semibold">
                  {type === "ingreso"
                    ? "Ingresos recientes"
                    : "Gastos recientes"}
                </h2>
                {data.movements
                  .filter((m) => m.tipo === type && isPosted(m))
                  .slice(0, 5)
                  .map((m) => (
                    <p key={m.id} className="mb-3 text-sm">
                      {m.concepto} · {money(m.monto, m.moneda)}
                      <span className="block text-xs text-text-3">
                        {m.fecha} · ≈ {money(m.usd_amount)}
                      </span>
                    </p>
                  ))}
              </Card>
            ))}
          </div>
        </>
      )}
      {tab === "accounts" && (
        <>
          <EntityEditor entity="account" data={data} title="Agregar cuenta" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {data.accounts
              .filter((a) => matchesFinanceFilters(a, query, "account"))
              .map((a) => (
                <Card key={a.id} className="p-5">
                  <h2 className="font-semibold">
                    {a.name} · {a.active ? "Activa" : "Inactiva"}
                  </h2>
                  <p className="mt-2 text-xl font-bold">
                    {money(accountBalance(a, data.movements), a.currency)}
                  </p>
                  <p className="mt-2 text-xs text-text-3">
                    Inicial: {money(a.opening_balance, a.currency)} · Creada:{" "}
                    {String(a.created_at).slice(0, 10)} ·{" "}
                    {a.account_type ?? "Sin tipo"}
                  </p>
                  <p className="my-3 text-xs text-text-3">{a.description}</p>
                  <EntityEditor
                    entity="account"
                    data={data}
                    row={a}
                    title="Editar / archivar cuenta"
                  />
                </Card>
              ))}
          </div>
        </>
      )}
      {["income", "expenses"].includes(tab) && (
        <>
          <TransactionEditor data={data} type={movementType} />
          <Card className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-text-3">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Concepto / categoría</th>
                  <th className="p-3">Cuenta / origen</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Monto / USD histórico</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m) => (
                  <tr key={m.id} className="border-b border-line align-top">
                    <td className="whitespace-nowrap p-3">{m.fecha}</td>
                    <td className="p-3">
                      <p>{m.concepto}</p>
                      <p className="mt-1 text-xs text-text-3">{m.categoria}</p>
                      {m.notas && (
                        <p className="mt-1 text-xs text-text-3">{m.notas}</p>
                      )}
                    </td>
                    <td className="p-3">
                      {data.accounts.find((a) => a.id === m.account_id)?.name}
                      <p className="text-xs text-text-3">
                        {m.origin ?? "Personal"}
                      </p>
                    </td>
                    <td className="p-3 text-xs">
                      {m.cancelled_at ? "Anulado" : m.estado}
                    </td>
                    <td className="whitespace-nowrap p-3 text-right">
                      <p className="font-semibold">
                        {money(m.monto, m.moneda)}
                      </p>
                      <p className="text-xs text-text-3">
                        ≈ {money(m.usd_amount)}
                      </p>
                      {m.exchange_rate && (
                        <p className="text-xs text-text-3">
                          ARS/USD {m.exchange_rate}
                        </p>
                      )}
                    </td>
                    <td className="min-w-44 p-3">
                      {!m.cancelled_at && (
                        <div className="space-y-2">
                          {!m.obligation_id && !m.schedule_id && (
                            <TransactionEditor
                              data={data}
                              type={movementType}
                              row={m}
                            />
                          )}
                          <ActionForm
                            entity="movement"
                            operation="cancel"
                            row={m}
                          >
                            <span className="sr-only">Anular {m.concepto}</span>
                          </ActionForm>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="mt-5 space-y-3 md:hidden">
            {movs.map((m) => (
              <Card key={m.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{m.concepto}</h2>
                    <p className="mt-1 text-xs text-text-3">
                      {m.fecha} · {m.categoria} ·{" "}
                      {data.accounts.find((a) => a.id === m.account_id)?.name ??
                        "Cuenta pendiente"}{" "}
                      · {m.cancelled_at ? "Anulado" : m.estado} ·{" "}
                      {m.origin ?? "Personal"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{money(m.monto, m.moneda)}</p>
                    <p className="text-xs text-text-3">
                      ≈ {money(m.usd_amount)}{" "}
                      {m.exchange_rate && `· ARS/USD ${m.exchange_rate}`}
                    </p>
                  </div>
                </div>
                {m.notas && (
                  <p className="my-2 text-xs text-text-3">{m.notas}</p>
                )}
                {!m.cancelled_at && (
                  <div className="mt-3 space-y-2">
                    {!m.obligation_id && !m.schedule_id && (
                      <TransactionEditor
                        data={data}
                        type={movementType}
                        row={m}
                      />
                    )}
                    <ActionForm entity="movement" operation="cancel" row={m}>
                      <span className="sr-only">
                        Anular movimiento {m.concepto}
                      </span>
                    </ActionForm>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {movs.length === 0 && (
            <p className="my-5 text-sm text-text-3">
              Sin movimientos para estos filtros.
            </p>
          )}
        </>
      )}
      {["income", "expenses", "subscriptions"].includes(tab) && (
        <section className="mt-8">
          <h2 className="mb-4 font-semibold">
            {tab === "income"
              ? "Ingresos esperados / recurrentes"
              : tab === "expenses"
                ? "Gastos programados"
                : "Suscripciones personales"}
          </h2>
          <EntityEditor
            entity="schedule"
            data={data}
            defaults={{ kind: scheduleKind }}
            title="Agregar compromiso"
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {data.schedules
              .filter(
                (s) =>
                  s.kind === scheduleKind &&
                  matchesFinanceFilters(s, query, "schedule"),
              )
              .map((s) => (
                <Card key={s.id} className="p-5">
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="mt-2 text-sm">
                    {money(s.amount, s.currency)} ·{" "}
                    {labels[String(s.frequency)]} · {labels[String(s.status)]}
                  </p>
                  <p className="mt-1 text-xs text-text-3">
                    Próxima fecha: {s.next_date ?? "Pendiente de confirmar"}{" "}
                    {s.period_end && `→ ${s.period_end}`} ·{" "}
                    {s.origin ?? "Personal"}
                  </p>
                  <p className="my-3 text-xs text-text-3">
                    {s.description} · No afecta cash hasta registrar pago/cobro
                    efectivo.
                  </p>
                  <EntityEditor
                    entity="schedule"
                    data={data}
                    row={s}
                    title="Editar compromiso"
                  />
                  {["active", "incomplete"].includes(String(s.status)) && (
                    <PaymentEditor data={data} row={s} entity="schedule" />
                  )}
                  <History data={data} id={s.id} entity="schedule" />
                </Card>
              ))}
          </div>
        </section>
      )}
      {["debts", "receivables"].includes(tab) && (
        <>
          <EntityEditor
            entity="obligation"
            data={data}
            defaults={{ kind: tab === "debts" ? "debt" : "receivable" }}
            title={
              tab === "debts"
                ? "Agregar deuda"
                : "Agregar cuenta por cobrar personal"
            }
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {data.obligations
              .filter(
                (o) =>
                  o.kind === (tab === "debts" ? "debt" : "receivable") &&
                  matchesFinanceFilters(o, query, "obligation"),
              )
              .map((o) => (
                <Card key={o.id} className="p-5">
                  <h2 className="font-semibold">
                    {o.counterparty} · {o.name}
                  </h2>
                  <p className="mt-2 text-sm">
                    Original: {money(o.amount, o.currency)} · Pendiente:{" "}
                    {money(remaining(o, data.movements), o.currency)}
                  </p>
                  <p className="mt-2 text-xs text-text-3">
                    {labels[String(o.status)]} · Prioridad{" "}
                    {labels[String(o.priority)]} · Objetivo{" "}
                    {o.target_date ?? o.target_month ?? "Sin fecha"} · Próxima
                    cuota {o.next_date ?? o.next_month ?? "Sin fecha"}{" "}
                    {o.monthly_payment &&
                      `· ${money(o.monthly_payment, o.currency)}`}
                  </p>
                  {(!o.allocation_known || o.amount === null) && (
                    <p className="mt-2 text-xs text-warn">
                      {!o.allocation_known
                        ? "Monto conjunto: proporción personal desconocida."
                        : "Saldo total desconocido: las cuotas se registran, no se inventa el saldo pendiente."}{" "}
                      Excluido del patrimonio exacto.
                    </p>
                  )}
                  <p className="my-3 text-xs text-text-3">{o.description}</p>
                  <EntityEditor
                    entity="obligation"
                    data={data}
                    row={o}
                    title="Editar / cancelar obligación"
                  />
                  {![
                    "paid",
                    "collected",
                    "cancelled",
                    "uncollectible",
                  ].includes(String(o.status)) && (
                    <PaymentEditor data={data} row={o} entity="obligation" />
                  )}
                  <History data={data} id={o.id} entity="obligation" />
                </Card>
              ))}
          </div>
          {tab === "receivables" && (
            <p className="mt-4 text-xs text-text-3">
              Wonder USD ~250 pertenece a Landing Pages, no a estas cuentas
              personales.
            </p>
          )}
        </>
      )}
      {tab === "goals" && (
        <>
          <EntityEditor entity="goal" data={data} title="Agregar objetivo" />
          <div className="mt-5">
            <Goals data={data} month={month} />
          </div>
        </>
      )}
      <details className="mt-10">
        <summary className="cursor-pointer text-sm font-semibold">
          Administrar categorías
        </summary>
        <div className="mt-4 space-y-3">
          <EntityEditor entity="category" data={data} title="Crear categoría" />
          {data.categories.map((c) => (
            <EntityEditor
              key={c.id}
              entity="category"
              data={data}
              row={c}
              title={`${c.name} · ${c.kind === "ingreso" ? "Ingreso" : "Gasto"}`}
            />
          ))}
        </div>
      </details>
    </div>
  );
}
