"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FiltroSelect } from "@/components/landing/filtro-select";
import { nombreMes } from "@/lib/landing/meses";

/** Valor interno de "todos los meses": el Select no admite una clave vacía. */
const TODOS = "todos";

/** El mes elegido viaja en la URL: así el filtro sobrevive a un refresh. */
export function FiltroMes({ meses }: { meses: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const actual = params.get("mes") ?? "";

  if (meses.length === 0) return null;

  return (
    <FiltroSelect
      etiqueta="Filtrar por mes"
      valor={actual || TODOS}
      onChange={(v) => router.push(v === TODOS ? "?" : `?mes=${v}`)}
      todos={{ valor: TODOS, etiqueta: "Todos los meses" }}
      opciones={meses.map((m) => ({ valor: m, etiqueta: nombreMes(m) }))}
    />
  );
}
