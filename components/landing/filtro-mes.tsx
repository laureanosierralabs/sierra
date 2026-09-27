"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { nombreMes } from "@/lib/landing/meses";

/** El mes elegido viaja en la URL: así el filtro sobrevive a un refresh. */
export function FiltroMes({ meses }: { meses: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const actual = params.get("mes") ?? "";

  if (meses.length === 0) return null;

  return (
    <select
      value={actual}
      onChange={(e) => {
        const v = e.target.value;
        router.push(v ? `?mes=${v}` : "?");
      }}
      aria-label="Filtrar por mes"
      className="filtro-select"
    >
      <option value="">Todos los meses</option>
      {meses.map((m) => (
        <option key={m} value={m}>
          {nombreMes(m)}
        </option>
      ))}
    </select>
  );
}
