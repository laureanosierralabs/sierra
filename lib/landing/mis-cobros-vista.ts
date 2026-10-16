/**
 * Filtros y totales de "Mis cobros". Lógica pura: corre en el navegador
 * sobre los acuerdos que ya son de la persona (ver lib/landing/mis-cobros.ts).
 */
import type { Moneda } from "@/lib/landing/tipos";
import type { MiAcuerdo } from "@/lib/landing/mis-cobros";

export const ESTADOS_FILTRO = [
  { valor: "pendientes", etiqueta: "Con saldo pendiente" },
  { valor: "pagados", etiqueta: "Pagados" },
] as const;
export type EstadoFiltro = (typeof ESTADOS_FILTRO)[number]["valor"] | "todos";

export interface Filtros {
  estado: EstadoFiltro;
  /** Id de proyecto, o "todos". */
  proyecto: string;
  /** Año del acuerdo (AAAA), o "todos". */
  anio: string;
}

export const SIN_FILTROS: Filtros = { estado: "todos", proyecto: "todos", anio: "todos" };

/** Cuánto falta cobrar de un acuerdo (nunca negativo). */
export const pendienteDe = (a: Pick<MiAcuerdo, "total_amount" | "amount_paid">) =>
  Math.max((a.total_amount ?? 0) - a.amount_paid, 0);

export function filtrarAcuerdos(acuerdos: MiAcuerdo[], f: Filtros): MiAcuerdo[] {
  return acuerdos.filter((a) => {
    if (f.estado === "pendientes" && pendienteDe(a) <= 0) return false;
    if (f.estado === "pagados" && pendienteDe(a) > 0) return false;
    if (f.proyecto !== "todos" && !a.proyectos.some((p) => p.id === f.proyecto)) return false;
    if (f.anio !== "todos" && a.agreed_on?.slice(0, 4) !== f.anio) return false;
    return true;
  });
}

/** Opciones de los filtros: solo lo que existe en los acuerdos de la persona. */
export function opcionesDeFiltro(acuerdos: MiAcuerdo[]) {
  const proyectos = new Map<string, string>();
  const anios = new Set<string>();
  for (const a of acuerdos) {
    for (const p of a.proyectos) proyectos.set(p.id, p.name);
    if (a.agreed_on) anios.add(a.agreed_on.slice(0, 4));
  }
  return {
    proyectos: [...proyectos.entries()]
      .map(([valor, etiqueta]) => ({ valor, etiqueta }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, "es")),
    anios: [...anios].sort().reverse().map((a) => ({ valor: a, etiqueta: a })),
  };
}

export interface TotalPorMoneda {
  moneda: Moneda;
  acordado: number;
  cobrado: number;
  pendiente: number;
}

/** Totales separados por moneda: sumar USD con ARS daría un número sin sentido. */
export function totalesPorMoneda(acuerdos: MiAcuerdo[]): TotalPorMoneda[] {
  const porMoneda = new Map<Moneda, TotalPorMoneda>();
  for (const a of acuerdos) {
    const t = porMoneda.get(a.currency) ?? { moneda: a.currency, acordado: 0, cobrado: 0, pendiente: 0 };
    t.acordado += a.total_amount ?? 0;
    t.cobrado += a.amount_paid;
    t.pendiente += pendienteDe(a);
    porMoneda.set(a.currency, t);
  }
  return [...porMoneda.values()];
}
