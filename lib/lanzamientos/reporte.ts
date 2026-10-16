/**
 * Reporte de cierre de un lanzamiento: los números que el cliente quiere ver
 * al terminar, calculados de los mismos datos que el panel. Lógica pura.
 */
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import {
  compararVariantes,
  conversion,
  resumirRegistros,
  resumirVisitas,
  type TipoLanding,
} from "@/lib/lanzamientos/tipos";
import { estaCerrado, type Pedido } from "@/lib/pedidos/tipos";

export interface FilaLanding {
  id: string;
  name: string;
  kind: TipoLanding;
  visitantes: number;
  conversiones: number;
  cvr: number | null;
}

export interface ResultadoTest {
  tipo: TipoLanding;
  mejor: string;
  segunda: string;
  significativa: boolean;
}

export interface Reporte {
  dias: number | null;
  /** Se leyó hasta el tope de registros: los totales quedan cortos. */
  incompleto: boolean;
  visitantes: number;
  registros: number;
  ventas: number;
  /** Ingresos por moneda (no se suman monedas distintas). */
  ingresos: { moneda: string; total: number }[];
  /** Registros sobre visitantes de las landings de registro con visitas medidas. */
  conversionRegistro: number | null;
  /** Ventas sobre visitantes de las landings de venta con visitas medidas. */
  conversionVenta: number | null;
  /** Ventas sobre registros: cuántos de los anotados compraron. */
  registrosQueCompraron: number | null;
  meta: { objetivo: number; logrado: number } | null;
  pico: { dia: string; registros: number } | null;
  porLanding: FilaLanding[];
  /** Pasos después del registro (listas cruzadas): cuántos registrados siguieron. */
  embudo: { name: string; cruzan: number; porcentaje: number | null }[];
  tests: ResultadoTest[];
  fuentes: { fuente: string; visitantes: number; registros: number }[];
  pedidos: {
    total: number;
    incidencias: number;
    cambios: number;
    aprobaciones: number;
    cerrados: number;
    /** Mediana de horas entre que se abre y se cierra un pedido. */
    horasResolucion: number | null;
  };
}

const DIA_MS = 86_400_000;

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export function armarReporte(detalle: DetalleLanzamiento, pedidos: Pedido[]): Reporte {
  const { lanzamiento, paginas, registros, visitas, compras } = detalle;
  const resumen = resumirRegistros(registros);
  const trafico = resumirVisitas(visitas);

  const comprasPorPagina = new Map<string, number>();
  for (const c of compras) {
    if (c.page_id) comprasPorPagina.set(c.page_id, (comprasPorPagina.get(c.page_id) ?? 0) + 1);
  }

  const porLanding: FilaLanding[] = paginas.map((p) => {
    const visitantes = trafico.porPagina[p.id] ?? 0;
    const conversiones = p.kind === "venta" ? (comprasPorPagina.get(p.id) ?? 0) : (resumen.porPagina[p.id] ?? 0);
    return { id: p.id, name: p.name, kind: p.kind, visitantes, conversiones, cvr: conversion(conversiones, visitantes) };
  });

  // Conversión de cada tipo, solo con landings que midieron visitas.
  const tasa = (tipo: TipoLanding) => {
    const medidas = porLanding.filter((f) => f.kind === tipo && f.visitantes > 0);
    return conversion(
      medidas.reduce((t, f) => t + f.conversiones, 0),
      medidas.reduce((t, f) => t + f.visitantes, 0),
    );
  };

  const nombre = new Map(paginas.map((p) => [p.id, p.name]));
  const tests = (["registro", "venta"] as const).flatMap((tipo) => {
    const c = compararVariantes(
      porLanding
        .filter((f) => f.kind === tipo)
        .map((f) => ({ id: f.id, visitantes: f.visitantes, registros: f.conversiones })),
    );
    return c
      ? [{ tipo, mejor: nombre.get(c.mejor) ?? "—", segunda: nombre.get(c.segunda) ?? "—", significativa: c.significativa }]
      : [];
  });

  const registrosPorFuente = new Map<string, number>();
  for (const r of registros) {
    const f = r.utm_source ?? "";
    registrosPorFuente.set(f, (registrosPorFuente.get(f) ?? 0) + 1);
  }

  const ingresos = new Map<string, number>();
  for (const c of compras) {
    if (c.amount === null) continue;
    const moneda = c.currency ?? "—";
    ingresos.set(moneda, (ingresos.get(moneda) ?? 0) + c.amount);
  }

  const pico = resumen.porDia.reduce<{ dia: string; registros: number } | null>(
    (mejor, d) => (!mejor || d.registros > mejor.registros ? d : mejor),
    null,
  );

  const cerrados = pedidos.filter((p) => estaCerrado(p.status) && p.closed_at);
  const objetivo = lanzamiento.goal_registrations;

  const dias =
    lanzamiento.starts_on && lanzamiento.ends_on
      ? Math.round((Date.parse(lanzamiento.ends_on) - Date.parse(lanzamiento.starts_on)) / DIA_MS) + 1
      : null;

  return {
    // Fechas invertidas: mejor no mostrar duración que una negativa.
    dias: dias && dias > 0 ? dias : null,
    incompleto: detalle.truncado,
    visitantes: trafico.total,
    registros: resumen.total,
    ventas: compras.length,
    ingresos: [...ingresos.entries()].map(([moneda, total]) => ({ moneda, total })),
    conversionRegistro: tasa("registro"),
    conversionVenta: tasa("venta"),
    registrosQueCompraron: compras.length > 0 ? conversion(compras.length, resumen.total) : null,
    meta: objetivo ? { objetivo, logrado: Math.round((resumen.total / objetivo) * 100) } : null,
    pico,
    porLanding,
    embudo: detalle.listas.map((l) => ({
      name: l.name,
      cruzan: l.cruzan,
      porcentaje: conversion(l.cruzan, resumen.total),
    })),
    tests,
    fuentes: trafico.porFuente.slice(0, 6).map((f) => ({
      fuente: f.fuente,
      visitantes: f.visitantes,
      registros: registrosPorFuente.get(f.fuente) ?? 0,
    })),
    pedidos: {
      total: pedidos.length,
      incidencias: pedidos.filter((p) => p.kind === "incidencia").length,
      cambios: pedidos.filter((p) => p.kind === "cambio").length,
      aprobaciones: pedidos.filter((p) => p.kind === "aprobacion").length,
      cerrados: cerrados.length,
      horasResolucion: mediana(
        cerrados.map((p) => (Date.parse(p.closed_at as string) - Date.parse(p.created_at)) / 3_600_000),
      ),
    },
  };
}
