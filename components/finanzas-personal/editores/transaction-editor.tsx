"use client";

import { useId, useState } from "react";
import { today, type FinanceData, type FinanceRow } from "@/lib/personal-finance";
import type { TipoMovimiento } from "../tipos";
import { ActionForm } from "./action-form";
import { FinanceDialog } from "./dialogo-finanzas";
import {
  CampoArea,
  CampoCheckbox,
  CampoSelect,
  CampoTexto,
  Nota,
  Plegable,
  Recuadro,
  type OpcionCampo,
} from "./campos";

const MONEDAS: OpcionCampo[] = [
  { value: "USD", label: "USD" },
  { value: "ARS", label: "ARS" },
];

const ORIGENES_BASE = ["Personal", "Landing Pages", "Synous", "Seguro", "Otro"];

export function accountOptions(data: FinanceData, currency: string, selectedId?: unknown): OpcionCampo[] {
  return data.accounts
    .filter((a) => (a.active || a.id === selectedId) && (!currency || a.currency === currency))
    .map((a) => ({ value: a.id, label: `${a.name} · ${a.currency}` }));
}

interface TransactionDialogProps {
  data: FinanceData;
  type: TipoMovimiento;
  row?: FinanceRow;
  onClose: () => void;
}

/** Alta y edición de un ingreso o gasto. Se monta al abrir, así que los campos arrancan limpios. */
export function TransactionDialog({ data, type, row, onClose }: TransactionDialogProps) {
  const listId = useId();
  const [currency, setCurrency] = useState(String(row?.moneda ?? "USD"));
  const [date, setDate] = useState(String(row?.fecha ?? today()));
  const [category, setCategory] = useState(String(row?.categoria ?? ""));

  const categories = data.categories.filter((c) => c.kind === type && c.active);
  const categoryExists = categories.some((c) => c.name === category);
  const incoming = type === "ingreso";
  const sameQuote = row?.moneda === currency && row?.fecha === date && !!row?.exchange_rate;
  const origins = [...new Set([...ORIGENES_BASE, ...data.movements.map((m) => String(m.origin ?? "Personal"))])];

  const unitOptions = data.units.map((u) => ({ value: u.slug, label: u.nombre }));
  const projectOptions = data.projects.map((p) => ({ value: p.id, label: p.name }));
  const contextOptions = data.contextProjects.map((p) => ({ value: p.slug, label: p.nombre }));
  const paidValue = incoming ? "cobrado" : "pagado";

  return (
    <FinanceDialog
      isOpen
      onClose={onClose}
      title={row ? "Editar movimiento" : incoming ? "Nuevo ingreso" : "Nuevo gasto"}
      description={
        incoming
          ? "Registrá dinero recibido en una cuenta personal."
          : "Registrá un gasto en la cuenta de la que salió el dinero."
      }
    >
      <ActionForm entity="movement" row={row} onSuccess={onClose} onCancel={onClose}>
        <input type="hidden" name="tipo" value={type} />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            name="concepto"
            label="Concepto"
            required
            maxLength={160}
            defaultValue={String(row?.concepto ?? "")}
          />
          <CampoTexto
            name="monto"
            label="Monto"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={String(row?.monto ?? "")}
          />
          <CampoSelect
            name="moneda"
            label="Moneda"
            options={MONEDAS}
            value={currency}
            onChange={setCurrency}
            required
          />
          <CampoTexto
            name="categoria"
            label="Categoría"
            required
            maxLength={120}
            list={`categories-${listId}`}
            value={category}
            onChange={setCategory}
            description={category && !categoryExists ? `Crear categoría «${category}» al guardar` : undefined}
          />
          <datalist id={`categories-${listId}`}>
            {categories.map((c) => (
              <option key={c.id} value={String(c.name)} />
            ))}
          </datalist>
          <CampoSelect
            key={currency}
            name="account_id"
            label="Cuenta"
            options={accountOptions(data, currency, row?.moneda === currency ? row?.account_id : undefined)}
            defaultValue={row?.moneda === currency ? String(row?.account_id ?? "") : ""}
            placeholder="Seleccionar cuenta"
            required
          />
          <CampoTexto
            name="fecha"
            label="Fecha"
            type="date"
            required
            value={date}
            onChange={setDate}
          />
        </div>

        {currency === "ARS" ? (
          <Recuadro>
            <CampoTexto
              key={`${currency}-${date}`}
              name="exchange_rate"
              label="Cotización ARS por USD"
              type="number"
              step="0.0001"
              min="0.0001"
              required={(date !== today() || !data.rate?.rate) && !sameQuote}
              defaultValue={sameQuote ? String(row?.exchange_rate ?? "") : ""}
              placeholder={
                date === today() && data.rate?.rate
                  ? `Referencia actual: ${data.rate.rate}`
                  : "Ingresá la cotización de esa fecha"
              }
            />
            <Nota>
              {sameQuote
                ? "Se conserva la cotización histórica de este movimiento si no la cambiás."
                : date !== today()
                  ? "Para una fecha distinta de hoy, la cotización histórica es obligatoria."
                  : data.rate?.rate
                    ? `Sin un valor manual, se usa la referencia ${data.rate.manual ? "manual" : "MEP"} actual: ARS ${data.rate.rate} por USD.`
                    : "No hay una cotización disponible. Ingresá una referencia manual para guardar."}
            </Nota>
          </Recuadro>
        ) : (
          <input type="hidden" name="exchange_rate" value="" />
        )}

        <Plegable titulo="Más detalles">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelect
              name="estado"
              label="Estado"
              defaultValue={String(row?.estado ?? paidValue)}
              options={[
                { value: paidValue, label: incoming ? "Cobrado" : "Pagado" },
                { value: "pendiente", label: "Pendiente (no afecta cash)" },
              ]}
            />
            <CampoTexto
              name="origin"
              label="Origen"
              list={`finance-origins-${listId}`}
              defaultValue={String(row?.origin ?? "Personal")}
            />
            <datalist id={`finance-origins-${listId}`}>
              {origins.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <CampoSelect
              name="related_business"
              label="Negocio relacionado"
              options={unitOptions}
              defaultValue={String(row?.related_business ?? "")}
              allowEmpty
            />
            <CampoSelect
              name="related_project"
              label="Proyecto Landing Pages"
              options={projectOptions}
              defaultValue={String(row?.related_project ?? "")}
              allowEmpty
            />
            <CampoSelect
              name="related_context_project"
              label="Proyecto de contexto"
              options={contextOptions}
              defaultValue={String(row?.related_context_project ?? "")}
              allowEmpty
            />
            <CampoCheckbox name="recurring" label="Recurrente" defaultSelected={Boolean(row?.recurring)} />
          </div>
          <CampoArea name="notas" label="Descripción" defaultValue={String(row?.notas ?? "")} />
          <Nota>
            La cotización queda congelada en este movimiento. Los retiros del negocio se cargan
            manualmente como ingresos personales; nunca se importa su facturación.
          </Nota>
        </Plegable>
      </ActionForm>
    </FinanceDialog>
  );
}
