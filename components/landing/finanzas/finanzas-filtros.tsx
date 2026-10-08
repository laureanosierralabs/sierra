"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MONEDA_INICIAL } from "@/components/landing/finanzas/vistas";
import { FiltroSelect } from "@/components/landing/filtro-select";
import {
  Select,
  SelectContent,
  SelectIndicator,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/tailgrids/core/select";
import { nombreMes } from "@/lib/landing/meses";
import type { Moneda } from "@/lib/landing/tipos";

const TODOS = "todos";

/** Cambia un parámetro de la URL y deja los demás (vista, mes, moneda) como están. */
function useCambiarParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (clave: string, valor: string | null) => {
    const siguiente = new URLSearchParams(params.toString());
    if (valor) siguiente.set(clave, valor);
    else siguiente.delete(clave);
    const qs = siguiente.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };
}

export function FiltroMesFinanzas({ meses, actual }: { meses: string[]; actual?: string }) {
  const cambiar = useCambiarParam();
  if (meses.length === 0) return null;

  return (
    <FiltroSelect
      etiqueta="Filtrar por mes"
      valor={actual || TODOS}
      onChange={(v) => cambiar("mes", v === TODOS ? null : v)}
      todos={{ valor: TODOS, etiqueta: "Todos los meses" }}
      opciones={meses.map((m) => ({ valor: m, etiqueta: nombreMes(m) }))}
    />
  );
}

export function SelectorMoneda({ opciones, actual }: { opciones: Moneda[]; actual: Moneda }) {
  const cambiar = useCambiarParam();
  // Con una sola moneda con datos no hay nada que elegir.
  if (opciones.length < 2) return null;

  return (
    <Select
      aria-label="Moneda de los gráficos"
      value={actual}
      onChange={(key) => cambiar("moneda", key === MONEDA_INICIAL ? null : String(key))}
      className="w-full sm:w-32"
    >
      <SelectTrigger size="md">
        <SelectValue />
        <SelectIndicator />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((m) => (
          <SelectItem key={m} id={m} textValue={m}>
            {m}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
