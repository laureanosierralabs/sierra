"use client";

import { CircleDollarSign } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Select,
} from "@/components/landing/dialogo-form";
import { registrarCobro } from "@/app/landing-pages/acciones";
import type { Cotizacion } from "@/lib/landing/tipos";

function hoyISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * Registra el cobro en finanzas/movimientos.json. El formulario llega
 * precargado desde la cotización, pero se confirma a mano: no es automático.
 */
export function RegistrarCobro({
  cotizacion,
  cliente,
}: {
  cotizacion: Cotizacion;
  cliente: string | null;
}) {
  // El JSON de finanzas solo maneja ARS y USD.
  const moneda = cotizacion.currency === "EUR" ? "USD" : cotizacion.currency;

  return (
    <DialogoForm
      titulo="Registrar cobro en finanzas"
      action={registrarCobro}
      disparador={
        <span className="inline-flex items-center gap-1 text-xs font-medium text-ok hover:underline">
          <CircleDollarSign className="size-3.5" />
          Registrar cobro
        </span>
      }
    >
      <input type="hidden" name="quote_id" value={cotizacion.id} />
      {cliente && <input type="hidden" name="cliente" value={cliente} />}

      <Campo label="Concepto">
        <Input
          name="concepto"
          required
          defaultValue={
            cotizacion.service
              ? `${cotizacion.service} — ${cotizacion.title}`
              : cotizacion.title
          }
        />
      </Campo>

      <div className="grid grid-cols-3 gap-4">
        <Campo label="Monto">
          <Input
            name="monto"
            inputMode="decimal"
            required
            defaultValue={cotizacion.amount?.toString() ?? ""}
          />
        </Campo>

        <Campo label="Moneda">
          <Select name="moneda" defaultValue={moneda}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </Campo>

        <Campo label="Fecha">
          <Input type="date" name="fecha" defaultValue={hoyISO()} />
        </Campo>
      </div>

      <Campo label="Estado del cobro">
        <Select name="estado" defaultValue="pendiente">
          <option value="pendiente">Pendiente</option>
          <option value="cobrado">Cobrado</option>
          <option value="pagado">Pagado</option>
        </Select>
      </Campo>

      {cotizacion.currency === "EUR" && (
        <p className="rounded-lg bg-warn-dim px-3 py-2 text-xs text-warn">
          La cotización está en EUR y finanzas solo maneja ARS y USD.
          Convertí el monto antes de guardar.
        </p>
      )}

      <p className="text-xs text-text-3">
        Se registra como ingreso de negocio en la unidad Landing Pages.
      </p>
    </DialogoForm>
  );
}
