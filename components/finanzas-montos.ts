import type { PorMoneda } from "@/lib/landing/balance";
import { formatearMonto, type Moneda } from "@/lib/landing/tipos";

/** Texto de un total por moneda: "US$ 1.200 · $ 50.000", o "—" si todo es cero. */
export function textoMontos(total: PorMoneda, signo = false): string {
  const partes = (Object.entries(total) as [Moneda, number][])
    .filter(([, v]) => Math.round(v * 100) !== 0)
    .map(([m, v]) => {
      const t = formatearMonto(Math.abs(v), m);
      return signo && v < 0 ? `-${t}` : t;
    });
  return partes.length > 0 ? partes.join(" · ") : "—";
}

export function signoDe(total: PorMoneda): "pos" | "neg" | "cero" {
  const vals = Object.values(total);
  if (vals.some((v) => v > 0.005)) return "pos";
  if (vals.some((v) => v < -0.005)) return "neg";
  return "cero";
}
