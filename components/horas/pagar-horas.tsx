"use client";

import { useState } from "react";
import { FormSelectField } from "@/components/common/form/form-fields";
import { DialogoForm, Input } from "@/components/landing/dialogo-form";
import { pagarHoras } from "@/app/landing-pages/horas-acciones";
import { detallePagoHoras, totalMinutos, type EntradaHora } from "@/lib/horas/tipos";
import { MONEDAS } from "@/lib/landing/tipos";

function Campo({ etiqueta, children, ayuda }: { etiqueta: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-input-label-text">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-text-tertiary">{ayuda}</span>}
    </label>
  );
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Pagar las horas elegidas de una persona. La tarifa se propone desde su último
 * pago de horas y el monto se calcula solo; los dos se pueden cambiar. Queda
 * como egreso del equipo en Finanzas y en sus Mis cobros.
 */
export function PagarHoras({
  abierto,
  onCerrar,
  entradas,
  hoy,
  tarifa,
}: {
  abierto: boolean;
  onCerrar: () => void;
  entradas: EntradaHora[];
  hoy: string;
  tarifa: { tarifa: number; moneda: string } | null;
}) {
  return (
    <DialogoForm
      titulo="Pagar horas"
      action={pagarHoras}
      abiertoExterno={abierto}
      onCerrar={onCerrar}
      etiquetaEnviar="Registrar pago"
      etiquetaEnviando="Registrando…"
    >
      {/* key: cada selección arranca con su tarifa y su monto. */}
      <Campos key={entradas.map((e) => e.id).join(",")} entradas={entradas} hoy={hoy} tarifa={tarifa} />
    </DialogoForm>
  );
}

function Campos({
  entradas,
  hoy,
  tarifa,
}: {
  entradas: EntradaHora[];
  hoy: string;
  tarifa: { tarifa: number; moneda: string } | null;
}) {
  const minutos = totalMinutos(entradas);
  const horas = minutos / 60;
  const [porHora, setPorHora] = useState(tarifa ? String(tarifa.tarifa) : "");
  const [monto, setMonto] = useState(tarifa ? String(redondear(horas * tarifa.tarifa)) : "");
  const [moneda, setMoneda] = useState(tarifa?.moneda ?? "USD");

  function cambiarTarifa(valor: string) {
    setPorHora(valor);
    const n = Number(valor.replace(",", "."));
    if (valor.trim() && Number.isFinite(n) && n > 0) setMonto(String(redondear(horas * n)));
  }

  const tarifaNumero = Number(porHora.replace(",", "."));

  return (
    <>
      <input type="hidden" name="entry_ids" value={entradas.map((e) => e.id).join(",")} />

      <div className="rounded-lg border border-card-border bg-background-gray-secondary px-3 py-2.5 text-sm">
        <p className="font-medium text-text-primary">{entradas[0]?.user_name}</p>
        <p className="text-text-secondary">
          {entradas.length} {entradas.length === 1 ? "carga" : "cargas"} ·{" "}
          {detallePagoHoras(minutos, Number.isFinite(tarifaNumero) && tarifaNumero > 0 ? tarifaNumero : null, moneda)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo etiqueta="Tarifa por hora" ayuda={tarifa ? "La del último pago" : undefined}>
          <Input name="rate" inputMode="decimal" value={porHora} onChange={(e) => cambiarTarifa(e.target.value)} placeholder="10" />
        </Campo>
        <FormSelectField
          name="currency"
          label="Moneda"
          value={moneda}
          onChange={setMoneda}
          options={MONEDAS.map((m) => ({ value: m, label: m }))}
        />
        <Campo etiqueta="Monto a pagar">
          <Input name="amount" inputMode="decimal" required value={monto} onChange={(e) => setMonto(e.target.value)} />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Fecha del pago">
          <Input name="paid_on" type="date" required defaultValue={hoy} />
        </Campo>
        <Campo etiqueta="Medio (opcional)">
          <Input name="method" placeholder="Transferencia, USDT, AstroPay…" />
        </Campo>
      </div>
    </>
  );
}
