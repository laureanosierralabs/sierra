import type { Balance } from "@/lib/landing/balance";
import {
  LABEL_CATEGORIA_GASTO,
  LABEL_ESTADO_COTIZACION,
  costoMensual,
  gastoVigente,
  type AcuerdoEquipo,
  type Cliente,
  type Cotizacion,
  type GastoFijo,
  type Moneda,
  type Proyecto,
} from "@/lib/landing/tipos";

/*
 * Todo se filtra por UNA moneda: no hay conversión, así que sumar monedas
 * distintas daría un número sin sentido.
 */

export type PuntoMensual = {
  mes: string;
  etiqueta: string;
  ingresos: number;
  costos: number;
  gastos: number;
  resultado: number;
  /** Caja acumulada desde el primer movimiento, no solo de la ventana. */
  acumulado: number;
};

export interface Porcion {
  name: string;
  value: number;
}

const MESES_VISIBLES = 12;
const ABREVIATURA = new Intl.DateTimeFormat("es-AR", { month: "short", year: "2-digit" });

function etiquetaMes(mes: string): string {
  const [anio, m] = mes.split("-").map(Number);
  return ABREVIATURA.format(new Date(anio, m - 1, 1)).replace(".", "");
}

/** Últimos 12 meses con movimientos, de más viejo a más nuevo. */
export function serieMensual(balance: Balance, moneda: Moneda): PuntoMensual[] {
  let acumulado = 0;
  const puntos = [...balance.meses].reverse().map((m): PuntoMensual => {
    acumulado += m.resultado[moneda];
    return {
      mes: m.mes,
      etiqueta: etiquetaMes(m.mes),
      ingresos: m.ingresos[moneda],
      costos: m.costosEquipo[moneda],
      gastos: m.gastos[moneda],
      resultado: m.resultado[moneda],
      acumulado,
    };
  });
  return puntos.slice(-MESES_VISIBLES);
}

function cuentaCotizacion(q: Cotizacion): boolean {
  return q.commercial_status !== "rejected" && q.commercial_status !== "cancelled";
}

/**
 * Margen por proyecto en UNA moneda, desde las filas crudas: mismas reglas
 * que balance.ts (ingreso asignado, o el total si la cotización cubre un solo
 * proyecto; el costo del acuerdo se reparte en partes iguales).
 */
export function margenPorProyecto(
  cotizaciones: Cotizacion[],
  acuerdos: AcuerdoEquipo[],
  proyectos: Proyecto[],
  moneda: Moneda,
  limite = 8,
): Porcion[] {
  const ingreso = new Map<string, number>();
  for (const q of cotizaciones) {
    if (q.currency !== moneda || !cuentaCotizacion(q)) continue;
    const unico = q.project_ids.length === 1;
    for (const pid of q.project_ids) {
      const valor = q.allocated?.[pid] ?? (unico ? (q.total_amount ?? 0) : null);
      if (valor !== null) ingreso.set(pid, (ingreso.get(pid) ?? 0) + valor);
    }
  }

  const costo = new Map<string, number>();
  for (const a of acuerdos) {
    if (a.currency !== moneda || a.project_ids.length === 0) continue;
    const parte = (a.total_amount ?? 0) / a.project_ids.length;
    for (const pid of a.project_ids) costo.set(pid, (costo.get(pid) ?? 0) + parte);
  }

  return proyectos
    .filter((p) => ingreso.has(p.id))
    .map((p) => ({ name: p.name, value: (ingreso.get(p.id) ?? 0) - (costo.get(p.id) ?? 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limite);
}

/** Los `limite` clientes con más cotizado en la moneda y el resto en "Otros". */
export function ingresosPorCliente(
  cotizaciones: Cotizacion[],
  clientes: Cliente[],
  moneda: Moneda,
  limite = 6,
): Porcion[] {
  const nombrePor = new Map(clientes.map((c) => [c.id, c.company ?? c.name]));
  const total = new Map<string, number>();
  for (const q of cotizaciones) {
    if (q.currency !== moneda || !cuentaCotizacion(q) || !q.total_amount) continue;
    const nombre = (q.client_id && nombrePor.get(q.client_id)) || "Sin cliente";
    total.set(nombre, (total.get(nombre) ?? 0) + q.total_amount);
  }
  const filas = [...total]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const top = filas.slice(0, limite);
  const otros = filas.slice(limite).reduce((t, f) => t + f.value, 0);
  return otros > 0 ? [...top, { name: "Otros", value: otros }] : top;
}

export function cotizadoPorEstado(cotizaciones: Cotizacion[], moneda: Moneda): Porcion[] {
  const total = new Map<string, number>();
  for (const q of cotizaciones) {
    if (q.currency !== moneda || !q.total_amount) continue;
    const nombre = LABEL_ESTADO_COTIZACION[q.commercial_status];
    total.set(nombre, (total.get(nombre) ?? 0) + q.total_amount);
  }
  return [...total].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function comprometidoPorMiembro(acuerdos: AcuerdoEquipo[], moneda: Moneda): Porcion[] {
  const total = new Map<string, number>();
  for (const a of acuerdos) {
    if (a.currency !== moneda || !a.total_amount) continue;
    total.set(a.member_name, (total.get(a.member_name) ?? 0) + a.total_amount);
  }
  return [...total]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

/** Gasto mensual vigente hoy, por categoría (los gastos únicos no entran). */
export function gastoPorCategoria(gastos: GastoFijo[], moneda: Moneda): Porcion[] {
  const hoy = new Date().toISOString().slice(0, 7);
  const total = new Map<string, number>();
  for (const g of gastos) {
    if (g.currency !== moneda || !gastoVigente(g, hoy)) continue;
    const monto = costoMensual(g);
    if (monto === 0) continue;
    const nombre = LABEL_CATEGORIA_GASTO[g.category];
    total.set(nombre, (total.get(nombre) ?? 0) + monto);
  }
  return [...total].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function sumar(porciones: Porcion[]): number {
  return porciones.reduce((t, p) => t + p.value, 0);
}

