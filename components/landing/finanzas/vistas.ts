import type { Balance, DatosFinanzas } from "@/lib/landing/balance";
import { MONEDAS, type Moneda } from "@/lib/landing/tipos";

export const VISTAS = [
  { id: "resumen", label: "Resumen" },
  { id: "cotizaciones", label: "Cotizaciones" },
  { id: "egresos", label: "Egresos" },
  { id: "gastos", label: "Gastos" },
] as const;

export type Vista = (typeof VISTAS)[number]["id"];

export const VISTA_INICIAL: Vista = "resumen";
export const MONEDA_INICIAL: Moneda = "USD";

export function leerVista(valor?: string): Vista {
  return VISTAS.find((v) => v.id === valor)?.id ?? VISTA_INICIAL;
}

/** Monedas con datos en pagos por mes, cotizaciones, acuerdos o gastos. */
export function monedasConDatos(
  balance: Balance,
  { cotizaciones, acuerdos, gastos }: Pick<DatosFinanzas, "cotizaciones" | "acuerdos" | "gastos">,
): Moneda[] {
  const presentes = new Set<Moneda>();
  for (const q of cotizaciones) if (q.total_amount) presentes.add(q.currency);
  for (const a of acuerdos) if (a.total_amount) presentes.add(a.currency);
  for (const g of gastos) if (g.amount) presentes.add(g.currency);
  return MONEDAS.filter(
    (m) =>
      presentes.has(m) ||
      balance.meses.some(
        (mes) => mes.ingresos[m] !== 0 || mes.costosEquipo[m] !== 0 || mes.gastos[m] !== 0,
      ),
  );
}

/** Una moneda inválida o sin datos cae a USD, o a la primera que tenga datos. */
export function leerMoneda(valor: string | undefined, disponibles: Moneda[]): Moneda {
  const pedida = MONEDAS.find((m) => m === valor);
  if (pedida && disponibles.includes(pedida)) return pedida;
  if (disponibles.includes(MONEDA_INICIAL) || disponibles.length === 0) return MONEDA_INICIAL;
  return disponibles[0];
}

export interface ParamsFinanzas {
  vista?: Vista;
  mes?: string;
  moneda?: Moneda;
}

/** Arma la URL omitiendo los valores por defecto; `mes` y `moneda` se conservan. */
export function hrefFinanzas({ vista, mes, moneda }: ParamsFinanzas): string {
  const qs = new URLSearchParams();
  if (vista && vista !== VISTA_INICIAL) qs.set("vista", vista);
  if (mes) qs.set("mes", mes);
  if (moneda && moneda !== MONEDA_INICIAL) qs.set("moneda", moneda);
  const texto = qs.toString();
  return texto ? `?${texto}` : "?";
}
