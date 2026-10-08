"use client";

import { Pencil1 } from "@tailgrids/icons";
import {
  FormSelectField,
  FormTextAreaField,
  FormTextField,
} from "@/components/common/form/form-fields";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { gastoEsquema } from "@/components/landing/gasto-esquema";
import { guardarGastoFijo } from "@/app/landing-pages/acciones";
import {
  CATEGORIAS_GASTO,
  LABEL_CATEGORIA_GASTO,
  LABEL_PERIODO,
  MONEDAS,
  PERIODOS_GASTO,
  type GastoFijo,
} from "@/lib/landing/tipos";

const OPCIONES_MONEDA = MONEDAS.map((m) => ({ value: m, label: m }));
const OPCIONES_PERIODO = PERIODOS_GASTO.map((p) => ({ value: p, label: LABEL_PERIODO[p] }));
const OPCIONES_CATEGORIA = CATEGORIAS_GASTO.map((c) => ({
  value: c,
  label: LABEL_CATEGORIA_GASTO[c],
}));

export function GastoForm({ gasto }: { gasto?: GastoFijo }) {
  const editar = Boolean(gasto);

  return (
    <DialogoForm
      titulo={editar ? "Editar gasto fijo" : "Nuevo gasto fijo"}
      etiquetaAbrir="Nuevo gasto"
      action={guardarGastoFijo}
      schema={gastoEsquema}
      disparador={editar ? <Pencil1 /> : undefined}
    >
      {(form) => (
        <>
          {gasto && <input type="hidden" name="id" value={gasto.id} />}

          <FormTextField
            {...form.fieldProps("name")}
            label="Nombre"
            required
            placeholder="Vercel Pro, Figma, dominio…"
            defaultValue={gasto?.name ?? ""}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormTextField
              {...form.fieldProps("amount")}
              label="Monto"
              required
              defaultValue={gasto?.amount?.toString() ?? ""}
            />
            <FormSelectField
              {...form.fieldProps("currency")}
              label="Moneda"
              options={OPCIONES_MONEDA}
              defaultValue={gasto?.currency ?? "USD"}
            />
            <FormSelectField
              {...form.fieldProps("period")}
              label="Periodicidad"
              options={OPCIONES_PERIODO}
              defaultValue={gasto?.period ?? "monthly"}
            />
          </div>

          <FormSelectField
            {...form.fieldProps("category")}
            label="Categoría"
            options={OPCIONES_CATEGORIA}
            defaultValue={gasto?.category ?? "herramienta"}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              {...form.fieldProps("active_from")}
              type="date"
              label="Desde"
              required
              defaultValue={gasto?.active_from ?? new Date().toISOString().slice(0, 10)}
            />
            {/* Vacío = sigue vigente. Se completa cuando se da de baja. */}
            <FormTextField
              {...form.fieldProps("active_until")}
              type="date"
              label="Hasta (si se dio de baja)"
              defaultValue={gasto?.active_until ?? ""}
            />
          </div>

          <FormTextAreaField
            {...form.fieldProps("notes")}
            label="Notas"
            rows={2}
            defaultValue={gasto?.notes ?? ""}
          />
        </>
      )}
    </DialogoForm>
  );
}
