import "server-only";

import {
  listarAcuerdos,
  listarCotizaciones,
  listarGastosFijos,
  listarPagos,
  listarPagosEquipo,
} from "@/lib/landing/datos";
import {
  costoMensual,
  gastoVigente,
  type Moneda,
} from "@/lib/landing/tipos";

export type PorMoneda = Record<Moneda, number>;

export function vacio(): PorMoneda {
  return { USD: 0, ARS: 0, EUR: 0 };
}

export interface Mes {
  mes: string;
  ingresos: PorMoneda;
  costosEquipo: PorMoneda;
  gastosFijos: PorMoneda;
  balance: PorMoneda;
}

export interface Balance {
  meses: Mes[];
  /** Los meses con movimiento, para armar el filtro. */
  mesesDisponibles: string[];
  /** Lo que ya entró, histórico. */
  cobrado: PorMoneda;
  /** Aprobado y sin cobrar: exigible. */
  porCobrar: PorMoneda;
  /** Borradores: todavía no lo aceptó nadie. */
  prevision: PorMoneda;
  /** Comprometido con el equipo y todavía impago. */
  porPagar: PorMoneda;
  /** Peso mensual de los gastos fijos vigentes hoy. */
  gastoMensual: PorMoneda;
}

function sumar(acc: PorMoneda, moneda: Moneda, monto: number) {
  acc[moneda] += monto;
}

function mesDe(fecha: string): string {
  return fecha.slice(0, 7);
}

/**
 * El balance se arma con fechas de cobro y de pago reales, no con la fecha
 * en que se cargó el dato: created_at diría que todo pasó el día que se
 * migró la información.
 *
 * Los gastos fijos no tienen movimiento por mes — se declaran una vez — así
 * que se proyectan sobre cada mes en que estuvieron vigentes.
 */
export async function calcularBalance(mesFiltro?: string): Promise<Balance> {
  const [cotizaciones, acuerdos, gastos] = await Promise.all([
    listarCotizaciones(),
    listarAcuerdos(),
    listarGastosFijos(),
  ]);

  const cobros = await Promise.all(
    cotizaciones.map(async (q) => ({ q, pagos: await listarPagos(q.id) })),
  );
  const pagosEquipo = await Promise.all(
    acuerdos.map(async (a) => ({ a, pagos: await listarPagosEquipo(a.id) })),
  );

  const porMes = new Map<string, Mes>();
  const mes = (m: string): Mes => {
    if (!porMes.has(m)) {
      porMes.set(m, {
        mes: m,
        ingresos: vacio(),
        costosEquipo: vacio(),
        gastosFijos: vacio(),
        balance: vacio(),
      });
    }
    return porMes.get(m)!;
  };

  const cobrado = vacio();
  const porCobrar = vacio();
  const prevision = vacio();
  const porPagar = vacio();
  const gastoMensual = vacio();

  for (const { q, pagos } of cobros) {
    for (const p of pagos) {
      const m = mes(mesDe(p.paid_on));
      sumar(m.ingresos, q.currency, Number(p.amount));
      sumar(m.balance, q.currency, Number(p.amount));
      sumar(cobrado, q.currency, Number(p.amount));
    }

    const resta = Math.max((q.total_amount ?? 0) - q.amount_paid, 0);
    if (q.commercial_status === "approved" && resta > 0) {
      sumar(porCobrar, q.currency, resta);
    } else if (q.commercial_status === "draft" || q.commercial_status === "sent") {
      sumar(prevision, q.currency, q.total_amount ?? 0);
    }
  }

  for (const { a, pagos } of pagosEquipo) {
    for (const p of pagos) {
      const m = mes(mesDe(p.paid_on));
      sumar(m.costosEquipo, a.currency, Number(p.amount));
      sumar(m.balance, a.currency, -Number(p.amount));
    }

    const resta = Math.max((a.total_amount ?? 0) - a.amount_paid, 0);
    if (resta > 0) sumar(porPagar, a.currency, resta);
  }

  // Los gastos fijos se proyectan sobre los meses que ya tienen movimiento:
  // inventar meses futuros mostraría un balance de algo que no pasó.
  for (const g of gastos) {
    const mensual = costoMensual(g);
    const hoy = new Date().toISOString().slice(0, 7);
    if (gastoVigente(g, hoy)) sumar(gastoMensual, g.currency, mensual);

    for (const m of porMes.values()) {
      if (!gastoVigente(g, m.mes)) continue;
      sumar(m.gastosFijos, g.currency, mensual);
      sumar(m.balance, g.currency, -mensual);
    }
  }

  const todos = [...porMes.values()].sort((a, b) => b.mes.localeCompare(a.mes));
  const mesesDisponibles = todos.map((m) => m.mes);

  // El filtro acota los meses listados, no los totales de arriba: "por
  // cobrar" es deuda viva, no pertenece a un mes.
  const meses = mesFiltro ? todos.filter((m) => m.mes === mesFiltro) : todos;

  return {
    meses,
    mesesDisponibles,
    cobrado,
    porCobrar,
    prevision,
    porPagar,
    gastoMensual,
  };
}
