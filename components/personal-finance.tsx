"use client";
import { createContext, useContext, useEffect, useState, useTransition, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDownLeft, ArrowUpRight, ArrowRight, Wallet, LayoutDashboard, Receipt, Repeat, HandCoins, Target, Plus, Settings2, X, CalendarDays, SlidersHorizontal, Sparkles, Check, CircleHelp, type LucideIcon } from "lucide-react";
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
  "min-h-11 w-full min-w-0 rounded-xl border border-line bg-ground px-3 py-2.5 text-sm text-text outline-none transition focus:border-idle focus:ring-2 focus:ring-idle/15";
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-idle px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50";
const secondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-medium transition hover:bg-surface-2 disabled:cursor-wait disabled:opacity-50";
const tabs = [
  ["summary", "Resumen"],
  ["accounts", "Cuentas"],
  ["income", "Ingresos"],
  ["expenses", "Gastos"],
  ["subscriptions", "Suscripciones"],
  ["debts", "Deudas"],
  ["receivables", "Por cobrar"],
  ["goals", "Objetivos"],
];
const tabIcons: Record<string, LucideIcon> = {
  summary: LayoutDashboard, accounts: Wallet, income: ArrowDownLeft,
  expenses: ArrowUpRight, subscriptions: Repeat, debts: Receipt,
  receivables: HandCoins, goals: Target,
};
const DialogPending = createContext<((pending: boolean) => void) | null>(null);

// Native modal dialogs own focus containment; forms remain independent children.
function FinanceDialog({ open, onClose, title, description, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [busy, setBusy] = useState(false);
  const dirty = useRef(false);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dirty.current = false;
    element.showModal();
    const first = element.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea");
    first?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);
  function requestClose() {
    if (busy) return;
    if (dirty.current && !window.confirm("¿Cerrar sin guardar los cambios?")) return;
    onClose();
  }
  return open ? (
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      className="finance-dialog" onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onInput={() => { dirty.current = true; }}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
        <div>
          <h2 id={titleId} className="text-xl font-bold tracking-tight">{title}</h2>
          {description && <p id={descriptionId} className="mt-1.5 text-sm text-text-2">{description}</p>}
        </div>
        <button type="button" aria-label="Cerrar diálogo" disabled={busy} onClick={requestClose} className={`${secondary} shrink-0 !p-2.5`}><X className="size-5" aria-hidden="true" /></button>
      </div>
      <div className="px-5 py-6 sm:px-7">
        <DialogPending.Provider value={setBusy}>{children}</DialogPending.Provider>
      </div>
    </dialog>
  ) : null;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-7 text-center">
    <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-idle-dim text-idle"><CircleHelp className="size-5" aria-hidden="true" /></div>
    <p className="text-sm font-semibold">{title}</p>
    <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-text-2">{description}</p>
  </div>;
}
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
  const setDialogPending = useContext(DialogPending);
  useEffect(() => {
    setDialogPending?.(pending);
    return () => setDialogPending?.(false);
  }, [pending, setDialogPending]);
  return (
    <form
      action={(fd) => {
        if (pending) return;
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
          try {
            const result = await mutateFinance(fd);
            if (!result.ok) setError(result.error ?? "No se pudo guardar. Podés volver a intentar.");
            else {
              token.current = null;
              onSuccess?.();
            }
          } catch {
            setError("No se pudo confirmar el guardado. Volvé a intentar sin cerrar este formulario.");
          }
        });
      }}
      className="finance-action-form space-y-5"
      aria-busy={pending}
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
        type="submit"
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
  const [currency, setCurrency] = useState(String(row?.currency ?? defaults.currency ?? "USD"));
  const planLocked =
    entity === "obligation" &&
    !!row &&
    hasObligationPaymentHistory(row.id, data.movements);
  return (
    <>
      <button type="button" className={row ? secondary : button} onClick={() => setOpen(true)}>
        {row ? <Settings2 className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}{title}
      </button>
      <FinanceDialog open={open} onClose={() => setOpen(false)} title={title}>
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
              ) : field.name === "currency" ? (
                <FieldLabel key={field.name} label="Moneda">
                  <select name="currency" className={input} value={currency} onChange={(event) => setCurrency(event.target.value)}>
                    <option>USD</option><option>ARS</option>
                  </select>
                </FieldLabel>
              ) : (
                <EditorField
                  key={field.name}
                  field={field}
                  row={row}
                  data={field.source === "accounts" ? { ...data, accounts: data.accounts.filter((account) => account.currency === currency) } : data}
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
            <ActionForm entity={entity} operation="delete" row={row} onSuccess={() => setOpen(false)}>
              <p className="text-xs text-text-3">
                Si hay historial vinculado, usar el estado inactivo/cancelado en
                lugar de eliminar.
              </p>
            </ActionForm>
          </div>
        )}
      </FinanceDialog>
    </>
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
  prominent = false,
}: {
  data: FinanceData;
  type: string;
  row?: FinanceRow;
  prominent?: boolean;
}) {
  const listId = useId();
  const [currency, setCurrency] = useState(String(row?.moneda ?? "USD"));
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(String(row?.fecha ?? today()));
  const [category, setCategory] = useState(String(row?.categoria ?? ""));
  const categories = data.categories.filter((c) => c.kind === type && c.active);
  const exists = categories.some((c) => c.name === category);
  return (
    <>
      <button type="button" className={row ? `${secondary} !min-h-10 !px-3 !py-2` : prominent && type === "egreso" ? button : secondary}
        onClick={() => {
          setCurrency(String(row?.moneda ?? "USD")); setCategory(String(row?.categoria ?? ""));
          setDate(String(row?.fecha ?? today())); setOpen(true);
        }}>
        {row ? <Settings2 className="size-4" aria-hidden="true" /> : type === "ingreso" ? <ArrowDownLeft className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
        {row ? "Editar" : type === "ingreso" ? "Nuevo ingreso" : "Nuevo gasto"}
      </button>
      <FinanceDialog open={open} onClose={() => setOpen(false)}
        title={row ? "Editar movimiento" : type === "ingreso" ? "Nuevo ingreso" : "Nuevo gasto"}
        description={type === "ingreso" ? "Registrá dinero recibido en una cuenta personal." : "Registrá un gasto en la cuenta de la que salió el dinero."}>
        <ActionForm
          entity="movement"
          row={row}
          onSuccess={() => setOpen(false)}
        >
          <input type="hidden" name="tipo" value={type} />
          <div className="grid gap-3 sm:grid-cols-2">
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
                key={currency}
                data={data}
                value={row?.moneda === currency ? row?.account_id : undefined}
                currency={currency}
              />
            </FieldLabel>
            <FieldLabel label="Fecha">
              <input
                required
                name="fecha"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={input}
              />
            </FieldLabel>
          </div>
          {currency === "ARS" ? (
            <div className="rounded-xl border border-idle/20 bg-idle-dim/40 p-4">
              <FieldLabel label="Cotización ARS por USD">
                <input key={`${currency}-${date}`} name="exchange_rate" type="number" step="0.0001" min="0.0001"
                  required={(date !== today() || !data.rate?.rate) && !(row?.moneda === currency && row?.fecha === date && row?.exchange_rate)}
                  defaultValue={String(row?.moneda === currency && row?.fecha === date ? row?.exchange_rate ?? "" : "")}
                  placeholder={date === today() && data.rate?.rate ? `Referencia actual: ${data.rate.rate}` : "Ingresá la cotización de esa fecha"}
                  className={input} />
              </FieldLabel>
              <p className="mt-2 text-xs leading-relaxed text-text-2">
                {row?.moneda === currency && row?.fecha === date && row?.exchange_rate
                  ? "Se conserva la cotización histórica de este movimiento si no la cambiás."
                  : date !== today() ? "Para una fecha distinta de hoy, la cotización histórica es obligatoria."
                    : data.rate?.rate ? `Sin un valor manual, se usa la referencia ${data.rate.manual ? "manual" : "MEP"} actual: ARS ${data.rate.rate} por USD.`
                      : "No hay una cotización disponible. Ingresá una referencia manual para guardar."}
              </p>
            </div>
          ) : <input type="hidden" name="exchange_rate" value="" />}
          <details className="rounded-xl border border-line p-4">
            <summary className="cursor-pointer text-sm font-medium text-text-2">Más detalles</summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
      </FinanceDialog>
    </>
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
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const incoming = row.kind === "receivable" || row.kind === "income";
  return (
    <>
      <button type="button" className={`${secondary} !min-h-10 !px-3 !py-2 ${incoming ? "text-ok" : "text-text"}`}
        onClick={() => { setDate(today()); setOpen(true); }}>
        {incoming ? <ArrowDownLeft className="size-4" aria-hidden="true" /> : <ArrowUpRight className="size-4" aria-hidden="true" />}
        {incoming ? "Registrar cobro" : "Registrar pago"}
      </button>
      <FinanceDialog open={open} onClose={() => setOpen(false)} title={incoming ? `Registrar cobro · ${row.name}` : `Registrar pago · ${row.name}`}
        description="El movimiento se registra una sola vez y actualiza el saldo pendiente.">
        <ActionForm entity={entity} operation="pay" linkedId={row.id} onSuccess={() => setOpen(false)}>
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
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={input}
              />
            </FieldLabel>
            {row.currency === "ARS" && (
              <FieldLabel label="Cotización ARS por USD">
                <input key={date} name="exchange_rate" type="number" step="0.0001" min="0.0001"
                  required={date !== today() || !data.rate?.rate}
                  placeholder={date === today() && data.rate?.rate ? `Actual: ${data.rate.rate}` : "Cotización de esa fecha"}
                  className={input} />
                <span>{date !== today() ? "Obligatoria para pagos de otra fecha." : data.rate?.rate ? "Vacío: se usa la referencia actual." : "No hay referencia actual; ingresá una manual."}</span>
              </FieldLabel>
            )}
          </div>
          <p className="text-xs text-text-3">
            Se registra un único movimiento y se actualiza el saldo pendiente
            dentro de la misma transacción.
          </p>
        </ActionForm>
      </FinanceDialog>
    </>
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
function Filters({ data, tab, query }: {
  data: FinanceData; tab: string; query: Record<string, string>;
}) {
  const movements = tab === "income" || tab === "expenses";
  const dated = movements || ["subscriptions", "debts", "receivables"].includes(tab);
  return (
    <form className="finance-filters mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
      <input type="hidden" name="tab" value={tab} />
      {query.month && !dated && <input type="hidden" name="month" value={query.month} />}
      <div className="mb-3 mr-1 flex items-center gap-2 text-sm font-medium text-text-2"><SlidersHorizontal className="size-4" aria-hidden="true" />Filtros</div>
      {dated && <FieldLabel label={movements ? "Mes" : "Mes (opcional)"}>
        <input name="month" type="month" defaultValue={query.month ?? (movements ? today().slice(0, 7) : "")} className={input} />
      </FieldLabel>}
      <FieldLabel label="Moneda">
        <select name="currency" defaultValue={query.currency} className={input}><option value="">Todas</option><option>USD</option><option>ARS</option></select>
      </FieldLabel>
      {["accounts", "income", "expenses", "subscriptions"].includes(tab) && <FieldLabel label="Cuenta">
        <select name="account" defaultValue={query.account} className={input}><option value="">Todas</option>{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>
      </FieldLabel>}
      {movements && <FieldLabel label="Categoría">
        <select name="category" defaultValue={query.category} className={input}><option value="">Todas</option>{data.categories.filter((category) => category.kind === (tab === "income" ? "ingreso" : "egreso")).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      </FieldLabel>}
      {tab !== "accounts" && tab !== "goals" && <FieldLabel label="Estado">
        <select name="status" defaultValue={query.status ?? ""} className={input}>
          <option value="">Sin anulados / cancelados</option><option value="all">Todos (incluye historial)</option>
          {movements ? <><option value={tab === "income" ? "cobrado" : "pagado"}>{tab === "income" ? "Cobrado" : "Pagado"}</option><option value="pendiente">Pendiente</option><option value="cancelled">Anulado</option></>
            : ["active", "incomplete", "pending", "partial", "installments", "negotiating", "review", "paused", "paid", "collected", "cancelled", "uncollectible"].map((status) => <option key={status} value={status}>{labels[status]}</option>)}
        </select>
      </FieldLabel>}
      {movements && <details className="w-full">
        <summary className="cursor-pointer py-2 text-xs font-medium text-text-2">Fecha exacta y origen</summary>
        <div className="mt-2 flex flex-wrap gap-3">
          <FieldLabel label="Desde"><input name="from" type="date" defaultValue={query.from} className={input} /></FieldLabel>
          <FieldLabel label="Hasta"><input name="to" type="date" defaultValue={query.to} className={input} /></FieldLabel>
          <FieldLabel label="Origen"><input name="origin" defaultValue={query.origin} className={input} /></FieldLabel>
        </div>
      </details>}
      <button className={secondary}>Aplicar</button>
      <Link href={`?tab=${tab}`} className="inline-flex min-h-11 items-center px-1 text-xs font-medium text-text-2 hover:text-text">Limpiar</Link>
    </form>
  );
}

// Cancellation is a separate timestamp on movements, not their payment status.
function visibleRow(row: FinanceRow, query: Record<string, string>, entity: "movement" | "schedule" | "obligation" | "account") {
  const cancelled = entity === "movement" ? !!row.cancelled_at : row.status === "cancelled";
  if (query.status === "cancelled") return cancelled && matchesFinanceFilters(row, { ...query, status: "" }, entity);
  if (!query.status && cancelled) return false;
  return matchesFinanceFilters(row, query.status === "all" ? { ...query, status: "" } : query, entity);
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
function FinanceSettings({ data, open, onClose }: { data: FinanceData; open: boolean; onClose: () => void }) {
  return <FinanceDialog open={open} onClose={onClose} title="Configuración financiera" description="Cotización de referencia y categorías personales.">
    <RatePanel data={data} />
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Categorías</h3><EntityEditor entity="category" data={data} title="Crear categoría" /></div>
    <div className="mt-4 divide-y divide-line">{data.categories.map((category) => <div key={category.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div><p className="text-sm font-medium">{category.name}</p><p className="mt-1 text-xs text-text-2">{category.kind === "ingreso" ? "Ingreso" : "Gasto"} · {category.active ? "Activa" : "Inactiva"}</p></div>
      <EntityEditor entity="category" data={data} row={category} title="Editar categoría" />
    </div>)}</div>
  </FinanceDialog>;
}
function SectionHeading({ title, icon: Icon, href, link = "Ver todos" }: { title: string; icon: LucideIcon; href?: string; link?: string }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
    <h2 className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-text-2" aria-hidden="true" />{title}</h2>
    {href && <Link href={href} className="inline-flex min-h-10 items-center gap-1 text-xs font-medium text-idle">{link}<ArrowRight className="size-3.5" aria-hidden="true" /></Link>}
  </div>;
}
function FinanceOverview({ data, month }: { data: FinanceData; month: string }) {
  const summary = financeSummary(data, month);
  const monthly = data.movements.filter((movement) => isPosted(movement) && String(movement.fecha).startsWith(month));
  const recent = [...monthly].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))).slice(0, 6);
  const goals = data.goals.filter((goal) => goal.status === "active").slice(0, 3);
  const upcoming = [
    ...data.schedules.filter((schedule) => ["active", "incomplete"].includes(String(schedule.status))).map((row) => ({ row, entity: "schedule" as const })),
    ...data.obligations.filter((obligation) => !["paid", "collected", "cancelled", "uncollectible"].includes(String(obligation.status))).map((row) => ({ row, entity: "obligation" as const })),
  ].sort((a, b) => String(a.row.next_date ?? a.row.target_date ?? a.row.next_month ?? a.row.target_month ?? "9999").localeCompare(String(b.row.next_date ?? b.row.target_date ?? b.row.next_month ?? b.row.target_month ?? "9999"))).slice(0, 5);
  const grouped = [...new Set(monthly.filter((movement) => movement.tipo === "egreso").map((movement) => String(movement.categoria ?? "Sin categoría")))].map((category) => {
    const rows = monthly.filter((movement) => movement.tipo === "egreso" && String(movement.categoria ?? "Sin categoría") === category);
    return { category, total: rows.some((movement) => movement.usd_amount === null) ? null : rows.reduce((sum, movement) => sum + Number(movement.usd_amount), 0) };
  }).sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
  const knownExpenses = grouped.reduce((sum, group) => sum + (group.total ?? 0), 0);
  return <>
    <section aria-label="Cuentas personales" className="mb-7">
      <SectionHeading title="Tus cuentas" icon={Wallet} href={`?tab=accounts&month=${month}`} link="Administrar cuentas" />
      <div className="finance-accounts-grid">
        {data.accounts.filter((account) => account.active).map((account, index) => <Card key={account.id} className="finance-account-card min-w-0 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className={`finance-account-icon flex size-9 shrink-0 items-center justify-center rounded-xl ${index % 2 ? "bg-cat-teal-dim text-cat-teal" : "bg-idle-dim text-idle"}`}><Wallet className="size-4" aria-hidden="true" /></div>
            <span className="rounded-md bg-surface-2 px-1.5 py-1 text-[10px] font-semibold tracking-wide text-text-2">{account.currency}</span>
          </div>
          <p className="mt-3 truncate text-sm font-medium text-text-2" title={String(account.name)}>{account.name}</p>
          <p className="mt-1.5 break-words text-lg font-bold tracking-tight tabular-nums">{money(accountBalance(account, data.movements), account.currency)}</p>
        </Card>)}
      </div>
      {!data.accounts.some((account) => account.active) && <EmptyState title="No hay cuentas activas" description="Creá o reactivá una cuenta en Cuentas para registrar movimientos." />}
    </section>
    <div className="finance-overview-grid">
      <div className="min-w-0 space-y-6">
        <Card className="finance-balance relative overflow-hidden p-5 sm:p-6">
          <div aria-hidden="true" className="finance-balance-art pointer-events-none absolute right-0 top-0 h-48 w-64">
            <Image src="/MeshGradient.webp" alt="" fill sizes="256px" className="object-cover" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-text-2"><span className="size-2 rounded-full bg-ok" />Balance actual</div>
            <p className="mt-3 break-words text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{money(summary.cash)}</p>
            <p className="mt-2 text-xs leading-relaxed text-text-2">Dinero disponible · {money(summary.native.USD)} + {money(summary.native.ARS, "ARS")}</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
              <div><p className="text-xs text-text-2">Patrimonio neto conocido</p><p className="mt-1 text-base font-semibold tabular-nums">{money(summary.net)}</p></div>
              {summary.wealthUnknown && <span className="rounded-lg bg-warn-dim px-2.5 py-1.5 text-xs font-medium text-warn">Estimación parcial</span>}
            </div>
            {summary.wealthUnknown && <p className="mt-2 text-xs leading-relaxed text-text-2">No incluye proporciones personales, saldos de deuda o conversiones desconocidos.</p>}
            <p className="mt-3 text-[11px] text-text-2">Saldo de todas las fechas. ARS convertido con la referencia actual, si está disponible.</p>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          {[{ label: "Ingresos", value: summary.income, Icon: ArrowDownLeft, color: "text-ok", background: "bg-ok-dim" }, { label: "Gastos", value: summary.expense, Icon: ArrowUpRight, color: "text-critical", background: "bg-critical-dim" }].map(({ label, value, Icon, color, background }) => <Card key={label} className="min-w-0 p-4 sm:p-5">
            <div className="flex items-center gap-2"><span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${color} ${background}`}><Icon className="size-4" aria-hidden="true" /></span><span className="text-xs font-medium text-text-2">{label}</span></div>
            <p className="mt-3 break-words text-xl font-bold tracking-tight tabular-nums">{money(value)}</p><p className="mt-1 text-[11px] text-text-2">{month} · efectivamente {label === "Ingresos" ? "cobrados" : "pagados"}</p>
          </Card>)}
        </div>
        <Card className="overflow-hidden">
          <div className="px-5 pt-4 sm:px-6"><SectionHeading title="Movimientos recientes" icon={Receipt} href={`?tab=expenses&month=${month}`} link="Ver movimientos" /><p className="-mt-2 mb-4 text-xs text-text-2">Ingresos y gastos registrados en {month}.</p></div>
          {recent.length ? <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm"><thead className="bg-surface-2/60 text-left text-[11px] font-medium text-text-2"><tr><th className="px-5 py-3">Movimiento</th><th className="px-3 py-3">Cuenta</th><th className="px-3 py-3">Fecha</th><th className="px-5 py-3 text-right">Monto</th><th className="px-3 py-3"><span className="sr-only">Acciones</span></th></tr></thead>
                <tbody className="divide-y divide-line">{recent.map((movement) => <tr key={movement.id} className="hover:bg-surface-2/40">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${movement.tipo === "ingreso" ? "bg-ok-dim text-ok" : "bg-surface-2 text-text-2"}`}>{movement.tipo === "ingreso" ? <ArrowDownLeft className="size-4" aria-hidden="true" /> : <ArrowUpRight className="size-4" aria-hidden="true" />}</span><div><p className="font-medium">{movement.concepto}</p><p className="mt-1 text-xs text-text-2">{movement.categoria}</p></div></div></td>
                  <td className="px-3 py-3.5 text-xs text-text-2">{data.accounts.find((account) => account.id === movement.account_id)?.name ?? "Sin cuenta"}</td><td className="whitespace-nowrap px-3 py-3.5 text-xs text-text-2">{movement.fecha}</td>
                  <td className={`whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums ${movement.tipo === "ingreso" ? "text-ok" : "text-text"}`}>{movement.tipo === "ingreso" ? "+" : "−"}{money(movement.monto, movement.moneda)}</td>
                  <td className="px-3 py-3.5"><Link href={`?tab=${movement.tipo === "ingreso" ? "income" : "expenses"}&month=${month}`} className="inline-flex size-10 items-center justify-center rounded-lg text-text-2 hover:bg-surface-2" aria-label={`Ver ${movement.concepto}`}><ArrowRight className="size-4" aria-hidden="true" /></Link></td>
                </tr>)}</tbody></table>
            </div>
            <div className="divide-y divide-line md:hidden">{recent.map((movement) => <Link key={movement.id} href={`?tab=${movement.tipo === "ingreso" ? "income" : "expenses"}&month=${month}`} className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0"><p className="text-sm font-medium">{movement.concepto}</p><p className="mt-1.5 text-xs leading-relaxed text-text-2">{movement.categoria} · {data.accounts.find((account) => account.id === movement.account_id)?.name ?? "Sin cuenta"}<br />{movement.fecha}</p></div>
              <p className={`shrink-0 text-right text-sm font-semibold tabular-nums ${movement.tipo === "ingreso" ? "text-ok" : "text-text"}`}>{movement.tipo === "ingreso" ? "+" : "−"}{money(movement.monto, movement.moneda)}</p>
            </Link>)}</div>
          </> : <div className="px-5 pb-5"><EmptyState title="Todavía no hay movimientos este mes" description="Usá Nuevo ingreso o Nuevo gasto. Los compromisos pendientes no se cuentan como movimientos pagados." /></div>}
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeading title="Gastos por categoría" icon={ArrowUpRight} /><p className="-mt-2 mb-5 text-xs text-text-2">{month} · USD históricos de los gastos efectivamente pagados</p>
          {grouped.length ? <div className="space-y-4">{grouped.map(({ category, total }, index) => <div key={category}>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 font-medium"><span className="size-2 rounded-full" style={{ background: ["var(--idle)", "var(--cat-teal)", "var(--cat-violeta)", "var(--cat-ambar)"][index % 4] }} />{category}</span><span className="text-right tabular-nums text-text-2">{money(total)}{total !== null && knownExpenses > 0 ? ` · ${Math.round(total / knownExpenses * 100)}%` : ""}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${total !== null && knownExpenses > 0 ? Math.max(0, total / knownExpenses * 100) : 0}%`, background: ["var(--idle)", "var(--cat-teal)", "var(--cat-violeta)", "var(--cat-ambar)"][index % 4] }} /></div>
          </div>)}{grouped.some((group) => group.total === null) && <p className="text-xs text-warn">Distribución parcial: los gastos sin conversión histórica no se incluyen en los porcentajes.</p>}</div> : <p className="py-3 text-sm text-text-2">Sin gastos pagados en este mes. Las categorías aparecerán al registrar el primer gasto.</p>}
        </Card>
      </div>
      <aside aria-label="Objetivos y próximos compromisos" className="min-w-0 space-y-6">
        <Card className="p-5">
          <SectionHeading title="Objetivos" icon={Target} href={`?tab=goals&month=${month}`} />
          {goals.length ? <div className="space-y-5">{goals.map((goal) => {
            const accumulated = goalProgress(goal, data, month);
            const progress = accumulated === null || Number(goal.amount) <= 0 ? 0 : Math.min(100, Math.max(0, accumulated / Number(goal.amount) * 100));
            return <div key={goal.id} className="border-t border-line pt-4 first:border-0 first:pt-0"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{goal.name}</p><span className="text-xs font-semibold tabular-nums text-idle">{accumulated === null ? "Sin estimación" : `${progress.toFixed(0)}%`}</span></div>
              <p className="mt-1 text-[11px] text-text-2">{goal.kind === "income" ? `Ingresos recibidos · ${month}` : "Ahorro / patrimonio"}</p>
              <progress className="finance-progress mt-3 w-full" aria-label={`Progreso de ${goal.name}`} value={progress} max="100" />
              <p className="mt-2 text-xs leading-relaxed text-text-2"><span className="font-semibold text-text">{money(accumulated, goal.currency)}</span> de {money(goal.amount, goal.currency)}</p>
              {goal.target_date && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-text-2"><CalendarDays className="size-3" aria-hidden="true" />{goal.target_date}</p>}
            </div>;
          })}</div> : <p className="py-3 text-sm leading-relaxed text-text-2">Creá un objetivo de ahorro o ingreso mensual desde Objetivos.</p>}
        </Card>
        <Card className="p-5">
          <SectionHeading title="Próximos compromisos" icon={CalendarDays} />
          {upcoming.length ? <div className="space-y-4">{upcoming.map(({ row, entity }) => {
            const incoming = row.kind === "income" || row.kind === "receivable";
            const kind = entity === "obligation" ? incoming ? "Por cobrar personal" : "Deuda personal" : incoming ? "Ingreso esperado" : row.kind === "subscription" ? "Suscripción" : "Gasto programado";
            return <div key={row.id} className="border-t border-line pt-4 first:border-0 first:pt-0">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-2">{kind}</p>
              <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{row.name}</p><span className={`shrink-0 rounded-md px-1.5 py-1 text-[10px] font-medium ${incoming ? "bg-ok-dim text-ok" : "bg-surface-2 text-text-2"}`}>{incoming ? "A cobrar" : "A pagar"}</span></div>
              <p className="mt-2 text-base font-semibold tabular-nums">{money(row.monthly_payment ?? (entity === "obligation" ? remaining(row, data.movements) : row.amount), row.currency)}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-text-2">{row.next_date ?? row.target_date ?? row.next_month ?? row.target_month ?? "Fecha a confirmar"} · {labels[String(row.status)]}</p>
              <div className="mt-3"><PaymentEditor data={data} row={row} entity={entity} /></div>
            </div>;
          })}</div> : <p className="py-3 text-sm leading-relaxed text-text-2">No hay compromisos pendientes. Podés agregar suscripciones, deudas o cuentas por cobrar.</p>}
          <div className="mt-4 flex flex-wrap gap-x-3 border-t border-line pt-2">
            {[["subscriptions", "Suscripciones"], ["debts", "Deudas"], ["receivables", "Por cobrar"]].map(([key, label]) => <Link key={key} href={`?tab=${key}`} className="inline-flex min-h-10 items-center text-xs font-medium text-idle">{label}<ArrowRight className="ml-1 size-3" aria-hidden="true" /></Link>)}
          </div>
        </Card>
      </aside>
    </div>
  </>;
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
