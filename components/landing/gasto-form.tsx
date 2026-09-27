"use client";

import { Pencil } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
  Textarea,
} from "@/components/landing/dialogo-form";
import { guardarGastoFijo } from "@/app/landing-pages/acciones";
import {
  CATEGORIAS_GASTO,
  LABEL_CATEGORIA_GASTO,
  LABEL_PERIODO,
  MONEDAS,
  PERIODOS_GASTO,
  type GastoFijo,
} from "@/lib/landing/tipos";

export function GastoForm({ gasto }: { gasto?: GastoFijo }) {
  const editar = Boolean(gasto);

  return (
    <DialogoForm
      titulo={editar ? "Editar gasto fijo" : "Nuevo gasto fijo"}
      etiquetaAbrir="Nuevo gasto"
      action={guardarGastoFijo}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      {gasto && <input type="hidden" name="id" value={gasto.id} />}

      <Campo label="Nombre">
        <Input
          name="name"
          required
          placeholder="Vercel Pro, Figma, dominio…"
          defaultValue={gasto?.name ?? ""}
        />
      </Campo>

      <div className="grid grid-cols-3 gap-4">
        <Campo label="Monto">
          <Input
            name="amount"
            inputMode="decimal"
            required
            defaultValue={gasto?.amount?.toString() ?? ""}
          />
        </Campo>

        <Campo label="Moneda">
          <Select name="currency" defaultValue={gasto?.currency ?? "USD"}>
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Campo>

        <Campo label="Periodicidad">
          <Select name="period" defaultValue={gasto?.period ?? "monthly"}>
            {PERIODOS_GASTO.map((p) => (
              <option key={p} value={p}>
                {LABEL_PERIODO[p]}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo label="Categoría">
        <Select name="category" defaultValue={gasto?.category ?? "herramienta"}>
          {CATEGORIAS_GASTO.map((c) => (
            <option key={c} value={c}>
              {LABEL_CATEGORIA_GASTO[c]}
            </option>
          ))}
        </Select>
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Desde">
          <Input
            type="date"
            name="active_from"
            required
            defaultValue={
              gasto?.active_from ?? new Date().toISOString().slice(0, 10)
            }
          />
        </Campo>

        {/* Vacío = sigue vigente. Se completa cuando se da de baja. */}
        <Campo label="Hasta (si se dio de baja)">
          <Input
            type="date"
            name="active_until"
            defaultValue={gasto?.active_until ?? ""}
          />
        </Campo>
      </div>

      <Campo label="Notas">
        <Textarea name="notes" rows={2} defaultValue={gasto?.notes ?? ""} />
      </Campo>
    </DialogoForm>
  );
}
