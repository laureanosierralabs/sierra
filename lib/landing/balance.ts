import "server-only";

import {
  listarAcuerdos,
  listarClientes,
  listarCotizaciones,
  listarGastosFijos,
  listarPagos,
  listarPagosEquipo,
  listarProyectos,
} from "@/lib/landing/datos";
import {
  costoEnMes,
  costoMensual,
  gastoVigente,
  type AcuerdoEquipo,
  type Cotizacion,
  type GastoFijo,
  type Moneda,
  type PagoCotizacion,
  type PagoEquipo,
} from "@/lib/landing/tipos";

export type PorMoneda = Record<Moneda, number>;

export function vacio(): PorMoneda {
  return { USD: 0, ARS: 0, EUR: 0 };
}

export interface Mes {
  mes: string;
  ingresos: PorMoneda;
  costosEquipo: PorMoneda;
  gastos: PorMoneda;
  /** Caja del mes: solo lo que realmente entró y salió. */
  resultado: PorMoneda;
}

/** Margen de un proyecto. Null en ingreso = sin allocated_amount asignado. */
export interface MargenProyecto {
  id: string;
  nombre: string;
  cliente: string | null;
  ingreso: number | null;
  costo: number;
  margen: number | null;
  margenPct: number | null;
  currency: Moneda;
}

export interface MargenCliente {
  cliente: string;
  ingreso: number;
  costo: number;
  margen: number;
  margenPct: number | null;
  currency: Moneda;
}

export interface Balance {
  meses: Mes[];
  mesesDisponibles: string[];
  cobrado: PorMoneda;
  porCobrar: PorMoneda;
  prevision: PorMoneda;
  porPagar: PorMoneda;
  gastoMensual: PorMoneda;
  /** Caja real acumulada: cobrado − pagado al equipo − gastos. */
  resultadoReal: PorMoneda;
  /** Suma lo aprobado sin cobrar y resta lo comprometido sin pagar. */
  resultadoProyectado: PorMoneda;
  margenes: MargenProyecto[];
  margenesCliente: MargenCliente[];
}

function sumar(acc: PorMoneda, moneda: Moneda, monto: number) {
  acc[moneda] += monto;
}

function restar(acc: PorMoneda, moneda: Moneda, monto: number) {
  acc[moneda] -= monto;
}

function mesDe(fecha: string): string {
  return fecha.slice(0, 7);
}

export interface DatosFinanzas {
  cotizaciones: Cotizacion[];
  acuerdos: AcuerdoEquipo[];
  gastos: GastoFijo[];
  cobros: { q: Cotizacion; pagos: PagoCotizacion[] }[];
  pagosEquipo: { a: AcuerdoEquipo; pagos: PagoEquipo[] }[];
  balance: Balance;
}

/**
 * Todo lo que Finanzas necesita, en una sola pasada. Lo exportan también el
 * CSV, el JSON y el informe, para que los tres digan exactamente lo mismo
 * que la pantalla.
 */
export async function cargarFinanzas(mesFiltro?: string): Promise<DatosFinanzas> {
  const [cotizaciones, acuerdos, gastos, proyectos, clientes] = await Promise.all([
    listarCotizaciones(),
    listarAcuerdos(),
    listarGastosFijos(),
    listarProyectos(),
    listarClientes(),
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
        gastos: vacio(),
        resultado: vacio(),
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
      sumar(m.resultado, q.currency, Number(p.amount));
      sumar(cobrado, q.currency, Number(p.amount));
    }

    const resta = Math.max((q.total_amount ?? 0) - q.amount_paid, 0);
    // Solo lo aprobado es exigible; un borrador todavía no lo aceptó nadie.
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
      restar(m.resultado, a.currency, Number(p.amount));
    }

    const resta = Math.max((a.total_amount ?? 0) - a.amount_paid, 0);
    if (resta > 0) sumar(porPagar, a.currency, resta);
  }

  const hoy = new Date().toISOString().slice(0, 7);
  for (const g of gastos) {
    if (gastoVigente(g, hoy)) sumar(gastoMensual, g.currency, costoMensual(g));

    // Un gasto único vive en su propio mes aunque no haya otro movimiento.
    if (g.period === "once") mes(g.active_from.slice(0, 7));

    for (const m of porMes.values()) {
      const monto = costoEnMes(g, m.mes);
      if (monto === 0) continue;
      sumar(m.gastos, g.currency, monto);
      restar(m.resultado, g.currency, monto);
    }
  }

  // Caja real: la suma de los resultados mensuales, que solo contienen
  // movimientos efectivos. Lo comprometido no entra acá.
  const resultadoReal = vacio();
  for (const m of porMes.values()) {
    for (const k of Object.keys(m.resultado) as Moneda[]) {
      resultadoReal[k] += m.resultado[k];
    }
  }

  const resultadoProyectado = vacio();
  for (const k of Object.keys(resultadoReal) as Moneda[]) {
    resultadoProyectado[k] = resultadoReal[k] + porCobrar[k] - porPagar[k];
  }

  const todos = [...porMes.values()].sort((a, b) => b.mes.localeCompare(a.mes));
  const mesesDisponibles = todos.map((m) => m.mes);
  const meses = mesFiltro ? todos.filter((m) => m.mes === mesFiltro) : todos;

  const { margenes, margenesCliente } = calcularMargenes(
    cotizaciones,
    acuerdos,
    proyectos,
    clientes,
  );

  return {
    cotizaciones,
    acuerdos,
    gastos,
    cobros,
    pagosEquipo,
    balance: {
      meses,
      mesesDisponibles,
      cobrado,
      porCobrar,
      prevision,
      porPagar,
      gastoMensual,
      resultadoReal,
      resultadoProyectado,
      margenes,
      margenesCliente,
    },
  };
}

/**
 * El ingreso de un proyecto sale de allocated_amount, o del total cuando la
 * cotización cubre un solo proyecto. Si cubre varios y no hay asignación, el
 * ingreso queda en null: repartir por promedio sería inventar un número.
 */
function calcularMargenes(
  cotizaciones: Cotizacion[],
  acuerdos: AcuerdoEquipo[],
  proyectos: Awaited<ReturnType<typeof listarProyectos>>,
  clientes: Awaited<ReturnType<typeof listarClientes>>,
) {
  const ingresoPorProyecto = new Map<string, number | null>();
  const monedaPorProyecto = new Map<string, Moneda>();

  for (const q of cotizaciones) {
    if (q.commercial_status === "rejected" || q.commercial_status === "cancelled") {
      continue;
    }
    const unico = q.project_ids.length === 1;

    for (const pid of q.project_ids) {
      monedaPorProyecto.set(pid, q.currency);
      const asignado = q.allocated?.[pid] ?? null;
      const valor = asignado ?? (unico ? (q.total_amount ?? 0) : null);

      if (valor === null) {
        // Marcado explícitamente como no asignable.
        if (!ingresoPorProyecto.has(pid)) ingresoPorProyecto.set(pid, null);
        continue;
      }
      const previo = ingresoPorProyecto.get(pid);
      ingresoPorProyecto.set(pid, (previo ?? 0) + valor);
    }
  }

  const costoPorProyecto = new Map<string, number>();
  for (const a of acuerdos) {
    if (a.project_ids.length === 0) continue;
    // Un acuerdo que cubre varios proyectos se reparte en partes iguales:
    // acá sí es defendible, porque es un costo propio, no una venta.
    const parte = (a.total_amount ?? 0) / a.project_ids.length;
    for (const pid of a.project_ids) {
      costoPorProyecto.set(pid, (costoPorProyecto.get(pid) ?? 0) + parte);
    }
  }

  const clientePor = new Map(clientes.map((c) => [c.id, c]));

  const margenes: MargenProyecto[] = proyectos
    .filter((p) => ingresoPorProyecto.has(p.id) || costoPorProyecto.has(p.id))
    .map((p) => {
      const ingreso = ingresoPorProyecto.get(p.id) ?? null;
      const costo = costoPorProyecto.get(p.id) ?? 0;
      const c = p.client_id ? clientePor.get(p.client_id) : null;

      return {
        id: p.id,
        nombre: p.name,
        // La cuenta comercial, no la persona de contacto.
        cliente: c ? (c.company ?? c.name) : null,
        ingreso,
        costo,
        margen: ingreso === null ? null : ingreso - costo,
        margenPct:
          ingreso === null || ingreso === 0
            ? null
            : ((ingreso - costo) / ingreso) * 100,
        currency: monedaPorProyecto.get(p.id) ?? "USD",
      };
    })
    .sort((a, b) => (b.margen ?? -Infinity) - (a.margen ?? -Infinity));

  // Por cliente se puede sumar aunque falten asignaciones: el total de la
  // cotización pertenece al cliente completo, no hace falta repartirlo.
  const porCliente = new Map<string, { ingreso: number; costo: number; currency: Moneda }>();

  for (const q of cotizaciones) {
    if (q.commercial_status === "rejected" || q.commercial_status === "cancelled") {
      continue;
    }
    const c = q.client_id ? clientePor.get(q.client_id) : null;
    const nombre = c ? (c.company ?? c.name) : "Sin cliente";
    const actual = porCliente.get(nombre) ?? { ingreso: 0, costo: 0, currency: q.currency };
    actual.ingreso += q.total_amount ?? 0;
    porCliente.set(nombre, actual);
  }

  const proyectoPor = new Map(proyectos.map((p) => [p.id, p]));
  for (const a of acuerdos) {
    for (const pid of a.project_ids) {
      const p = proyectoPor.get(pid);
      const c = p?.client_id ? clientePor.get(p.client_id) : null;
      const nombre = c ? (c.company ?? c.name) : "Sin cliente";
      const actual = porCliente.get(nombre) ?? {
        ingreso: 0,
        costo: 0,
        currency: a.currency,
      };
      actual.costo += (a.total_amount ?? 0) / a.project_ids.length;
      porCliente.set(nombre, actual);
    }
  }

  const margenesCliente: MargenCliente[] = [...porCliente.entries()]
    .map(([cliente, v]) => ({
      cliente,
      ingreso: v.ingreso,
      costo: v.costo,
      margen: v.ingreso - v.costo,
      margenPct: v.ingreso === 0 ? null : ((v.ingreso - v.costo) / v.ingreso) * 100,
      currency: v.currency,
    }))
    .sort((a, b) => b.margen - a.margen);

  return { margenes, margenesCliente };
}

/** La pantalla solo necesita el balance; el resto es para los exports. */
export async function calcularBalance(mesFiltro?: string): Promise<Balance> {
  return (await cargarFinanzas(mesFiltro)).balance;
}
