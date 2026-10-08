"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/tailgrids/core/button";
import {
  entityFields,
  hasObligationPaymentHistory,
  type Field,
  type FinanceData,
  type FinanceRow,
} from "@/lib/personal-finance";
import type { EntidadSimple } from "../tipos";
import { ActionForm, runMutation, useRequestToken } from "./action-form";
import { CampoArea, CampoCheckbox, CampoSelect, CampoTexto, Nota, type OpcionCampo } from "./campos";
import { FinanceDialog } from "./dialogo-finanzas";

const MONEDAS: OpcionCampo[] = [
  { value: "USD", label: "USD" },
  { value: "ARS", label: "ARS" },
];

/** Opciones de un select de la ficha: fijas (`options`) o tomadas de los datos (`source`). */
function fieldOptions(
  field: Field,
  data: FinanceData,
  row: FinanceRow | undefined,
  currency: string,
): [string, string][] | null {
  if (field.options) return field.options;
  switch (field.source) {
    case "accounts":
      return data.accounts
        .filter((a) => a.currency === currency)
        .filter((a) => a.active || a.id === row?.account_id)
        .map((a) => [a.id, `${a.name} · ${a.currency}`]);
    case "categories":
      return data.categories.map((c) => [
        c.id,
        `${c.name} · ${c.kind === "ingreso" ? "Ingreso" : "Gasto"}`,
      ]);
    case "goals":
      return data.goals
        .filter((g) => field.name !== "goal_id" || g.kind === "savings")
        .map((g) => [g.id, String(g.name)]);
    case "projects":
      return data.projects.map((p) => [p.id, p.name]);
    case "contextProjects":
      return data.contextProjects.map((p) => [p.slug, p.nombre]);
    case "units":
      return data.units.map((u) => [u.slug, u.nombre]);
    default:
      return null;
  }
}

interface EntityFieldInputProps {
  field: Field;
  data: FinanceData;
  row?: FinanceRow;
  defaults: Record<string, string>;
  currency: string;
  locked: boolean;
}

function EntityFieldInput({ field, data, row, defaults, currency, locked }: EntityFieldInputProps) {
  const value = row?.[field.name] ?? defaults[field.name] ?? field.default ?? "";

  if (field.type === "checkbox")
    return <CampoCheckbox name={field.name} label={field.label} defaultSelected={Boolean(value)} />;

  const options = fieldOptions(field, data, row, currency);
  if (options) {
    return (
      <CampoSelect
        // Las cuentas dependen de la moneda: al cambiarla se reinicia la selección.
        key={field.source === "accounts" ? currency : field.name}
        name={field.name}
        label={field.label}
        options={options.map(([v, l]) => ({ value: v, label: l }))}
        defaultValue={String(
          value || (field.required || field.options ? (options[0]?.[0] ?? "") : ""),
        )}
        required={field.required}
        allowEmpty={!field.required && !field.options}
      />
    );
  }

  if (field.type === "textarea")
    return <CampoArea name={field.name} label={field.label} defaultValue={String(value)} />;

  return (
    <CampoTexto
      name={field.name}
      label={field.label}
      type={field.type ?? "text"}
      step={field.type === "number" ? "0.01" : undefined}
      maxLength={field.type ? undefined : 120}
      required={field.required}
      readOnly={locked}
      defaultValue={String(value)}
    />
  );
}

interface EntityDialogProps {
  entity: EntidadSimple;
  data: FinanceData;
  row?: FinanceRow;
  /** Valores iniciales (por ejemplo el tipo o el objetivo) cuando se crea. */
  defaults?: Record<string, string>;
  title: string;
  onClose: () => void;
}

/** Alta y edición de cuentas, categorías, compromisos, obligaciones, objetivos, hitos y aportes. */
export function EntityDialog({ entity, data, row, defaults = {}, title, onClose }: EntityDialogProps) {
  const [currency, setCurrency] = useState(String(row?.currency ?? defaults.currency ?? "USD"));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const token = useRequestToken();
  const planLocked =
    entity === "obligation" && !!row && hasObligationPaymentHistory(row.id, data.movements);

  return (
    <FinanceDialog isOpen onClose={onClose} title={title}>
      <ActionForm entity={entity} row={row} onSuccess={onClose} onCancel={onClose}>
        <div className="grid gap-4 sm:grid-cols-2">
          {entityFields[entity].map((field) => {
            if (defaults[field.name] && !row && ["kind", "goal_id"].includes(field.name))
              return <input key={field.name} type="hidden" name={field.name} value={defaults[field.name]} />;
            if (field.name === "currency")
              return (
                <CampoSelect
                  key={field.name}
                  name="currency"
                  label="Moneda"
                  options={MONEDAS}
                  value={currency}
                  onChange={setCurrency}
                  required
                />
              );
            return (
              <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
                <EntityFieldInput
                  field={field}
                  data={data}
                  row={row}
                  defaults={defaults}
                  currency={currency}
                  locked={
                    planLocked && ["monthly_payment", "next_date", "next_month"].includes(field.name)
                  }
                />
              </div>
            );
          })}
        </div>
        {planLocked && (
          <Nota>
            El plan tiene historial de pagos, incluidos anulados. La cuota mensual y el próximo
            período se conservan y avanzan mediante pagos; no se pueden editar manualmente. El monto
            total se puede completar o corregir sin reducirlo por debajo de lo ya pagado.
          </Nota>
        )}
        {entity === "contribution" && (
          <Nota>
            Reservar dinero existente para un objetivo no genera un ingreso ni un gasto. La cuenta y
            el objetivo deben usar la misma moneda.
          </Nota>
        )}
        {entity === "account" && (
          <Nota>
            Saldo actual = saldo inicial + movimientos efectivamente cobrados/pagados. Cambiar el
            saldo inicial es una corrección, no un ingreso.
          </Nota>
        )}
      </ActionForm>

      {row && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-card-border pt-4">
          <Nota className="max-w-sm">
            Si hay historial vinculado, usar el estado inactivo/cancelado en lugar de eliminar.
          </Nota>
          <Button variant="danger" appearance="outline" onPress={() => setConfirmingDelete(true)}>
            Eliminar
          </Button>
          <ConfirmDialog
            isOpen={confirmingDelete}
            onOpenChange={setConfirmingDelete}
            title="¿Eliminar este registro?"
            description="El historial se conserva cuando corresponde. Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            pendingLabel="Eliminando…"
            successMessage="Eliminado"
            onConfirm={async () => {
              await runMutation({ entity, operation: "delete", id: row.id }, token.next());
              token.clear();
              onClose();
            }}
          />
        </div>
      )}
    </FinanceDialog>
  );
}
