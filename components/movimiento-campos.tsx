"use client";

import { useState } from "react";
import {
  FormSelectField,
  FormTextField,
} from "@/components/common/form/form-fields";
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
  ESTADOS_MOVIMIENTO,
  MONEDAS,
  TIPOS,
} from "@/components/movimiento-esquema";
import type { ZodFormApi } from "@/components/landing/dialogo-form";
import {
  Select,
  SelectContent,
  SelectErrorMessage,
  SelectIndicator,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { hoyISOcliente } from "@/lib/fecha";
import type { Ambito, Movimiento } from "@/lib/finanzas";

export function MovimientoCampos({
  form,
  ambito,
  movimiento,
}: {
  form: ZodFormApi;
  ambito: Ambito;
  movimiento?: Movimiento;
}) {
  const [tipo, setTipo] = useState<string>(movimiento?.tipo ?? "egreso");
  const categorias = tipo === "egreso" ? CATEGORIAS_EGRESO : CATEGORIAS_INGRESO;
  const categoriaInicial =
    movimiento && categorias.some((c) => c.value === movimiento.categoria)
      ? movimiento.categoria
      : categorias[0].value;

  return (
    <>
      <input type="hidden" name="ambito" value={ambito} />
      {movimiento && <input type="hidden" name="id" value={movimiento.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Controlado: el tipo decide qué categorías se ofrecen. */}
        <Select
          name="tipo"
          value={tipo}
          onChange={(key) => {
            setTipo(String(key));
            form.clearError("tipo");
          }}
          isInvalid={Boolean(form.errors.tipo)}
          validationBehavior="aria"
        >
          <SelectLabel>Tipo</SelectLabel>
          <SelectTrigger size="lg">
            <SelectValue />
            <SelectIndicator />
          </SelectTrigger>
          <SelectErrorMessage>{form.errors.tipo}</SelectErrorMessage>
          <SelectContent>
            {TIPOS.map((t) => (
              <SelectItem key={t.value} id={t.value} textValue={t.label}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormTextField
          {...form.fieldProps("fecha")}
          type="date"
          label="Fecha"
          required
          defaultValue={movimiento?.fecha ?? hoyISOcliente()}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormTextField
          {...form.fieldProps("monto")}
          label="Monto"
          required
          placeholder="0"
          defaultValue={movimiento ? String(movimiento.monto) : undefined}
        />
        <FormSelectField
          {...form.fieldProps("moneda")}
          label="Moneda"
          options={MONEDAS}
          defaultValue={movimiento?.moneda ?? "ARS"}
        />
      </div>

      <FormTextField
        {...form.fieldProps("concepto")}
        label="Concepto"
        required
        placeholder="Ej: Pago a Bruno por Lead Magnet"
        defaultValue={movimiento?.concepto}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelectField
          key={tipo}
          {...form.fieldProps("categoria")}
          label="Categoría"
          options={categorias}
          defaultValue={categoriaInicial}
        />
        <FormSelectField
          {...form.fieldProps("estado")}
          label="Estado"
          options={ESTADOS_MOVIMIENTO}
          defaultValue={movimiento?.estado ?? "pagado"}
        />
      </div>

      {ambito === "negocio" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormTextField
            {...form.fieldProps("persona")}
            label="Persona (opcional)"
            placeholder="Bruno, Cielo…"
            defaultValue={movimiento?.persona}
          />
          <FormTextField
            {...form.fieldProps("cliente")}
            label="Cliente (opcional)"
            placeholder="Pilar Sousa…"
            defaultValue={movimiento?.cliente}
          />
        </div>
      )}
    </>
  );
}
