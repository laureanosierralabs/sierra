"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Dollar } from "@tailgrids/icons";
import { Dialog, DialogTrigger } from "react-aria-components";
import { toast } from "sonner";
import { updateFinanceRate } from "@/app/finanzas/personal/actions";
import { FormError } from "@/components/common/form/form-error";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Popover } from "@/components/tailgrids/core/popover";
import type { FinanceData } from "@/lib/personal-finance";
import { CampoTexto } from "../editores/campos";

const HORA_MS = 3600000;

/** Cotización de referencia: muestra el valor y permite fijarla a mano o consultarla a la API. */
export function RatePopover({ data }: { data: FinanceData }) {
  const rate = data.rate;
  const [rateInput, setRateInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [checkedAt] = useState(() => Date.now());
  const stale = !!rate?.quoted_at && checkedAt - Date.parse(rate.quoted_at) > HORA_MS;

  function send(mode: "manual" | "refresh" | "automatic") {
    // Mismos nombres de campo que antes: `rate` y `mode`.
    const fd = new FormData();
    fd.set("rate", rateInput);
    fd.set("mode", mode);
    start(async () => {
      setError(null);
      try {
        const result = await updateFinanceRate(fd);
        if (!result.ok) {
          const message = result.error ?? "Error";
          setError(message);
          toast.error(message);
          return;
        }
        toast.success("Cotización actualizada");
        setRateInput("");
      } catch (e) {
        unstable_rethrow(e);
        const message = "No se pudo actualizar la cotización. Podés volver a intentar.";
        setError(message);
        toast.error(message);
      }
    });
  }

  const statusLabel = rate?.manual ? "Manual" : stale ? "Desactualizada" : "MEP venta";
  const statusColor = rate?.manual ? "blue" : stale ? "warning" : "success";

  return (
    <DialogTrigger>
      <Button appearance="outline" size="md" aria-label="Tipo de cambio">
        <Dollar />
        <span className="tabular-nums">
          {rate?.rate ? `ARS ${rate.rate.toLocaleString("es-AR")}` : "Sin cotización"}
        </span>
        <Badge size="sm" color={rate?.rate ? statusColor : "gray"}>
          {rate?.rate ? statusLabel : "Pendiente"}
        </Badge>
      </Button>
      <Popover placement="bottom end" className="w-88 max-w-[calc(100vw-2rem)] p-5">
        <Dialog aria-label="Tipo de cambio" className="flex flex-col gap-4 outline-none">
          <div>
            <h2 className="text-base font-semibold text-title-50">Tipo de cambio</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {rate?.rate ? `ARS ${rate.rate} por USD · ${statusLabel}` : "Sin cotización disponible"}
            </p>
          </div>
          <p className="text-xs leading-relaxed text-text-tertiary">
            {rate?.source ?? "DolarAPI"} · {rate?.quoted_at ?? "Sin fecha"}. Cache de 1 hora;
            actualizar explícitamente. Cash usa esta referencia; el historial conserva su propia
            cotización. Sin cotización, no se inventan equivalencias.
          </p>
          <CampoTexto
            name="rate"
            label="Cotización manual (ARS por USD)"
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="ARS por USD"
            value={rateInput}
            onChange={setRateInput}
          />
          <FormError message={error} />
          <div className="flex flex-wrap gap-2">
            <Button appearance="outline" isDisabled={pending} onPress={() => send("manual")}>
              Aplicar manual
            </Button>
            <Button
              appearance="outline"
              isDisabled={pending}
              onPress={() => send(rate?.manual ? "automatic" : "refresh")}
            >
              {rate?.manual ? "Desactivar manual y consultar API" : "Actualizar API"}
            </Button>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
