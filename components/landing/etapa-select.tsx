"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cambiarEtapaProyecto } from "@/app/landing-pages/acciones";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { ETAPAS, LABEL_ETAPA, type Etapa } from "@/lib/landing/tipos";

/** El Select de React Aria no admite una opción de valor vacío: se usa este centinela. */
const SIN_ETAPA = "__sin-etapa__";

export function EtapaSelect({
  id,
  valor,
}: {
  id: string;
  valor: Etapa | null;
}) {
  const [pendiente, iniciar] = useTransition();

  return (
    <Select
      aria-label="Cambiar etapa"
      value={valor ?? SIN_ETAPA}
      isDisabled={pendiente}
      onChange={(key) => {
        const clave = String(key);
        // La action espera cadena vacía para "sin etapa".
        const nueva = clave === SIN_ETAPA ? "" : clave;
        if (nueva === (valor ?? "")) return;
        iniciar(async () => {
          try {
            await cambiarEtapaProyecto(id, nueva);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "No se pudo cambiar la etapa");
          }
        });
      }}
      className="w-40"
    >
      <SelectTrigger size="xs" className="gap-2 px-2.5 font-medium">
        <SelectValue className="flex-1 text-left" />
        <SelectIndicator />
      </SelectTrigger>
      <SelectContent>
        <SelectItem id={SIN_ETAPA} textValue="Sin etapa">
          Sin etapa
        </SelectItem>
        {ETAPAS.map((e) => (
          <SelectItem key={e} id={e} textValue={LABEL_ETAPA[e]}>
            {LABEL_ETAPA[e]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
