/**
 * Cálculo de la vista "Resultados" del portal: una sola función pura que, dado
 * el detalle del lanzamiento, un período y una landing, devuelve todo lo que
 * se muestra (KPIs, series diarias, embudo, orígenes, ventas...). La usan la
 * interfaz y el prompt para IA, así los números nunca se contradicen.
 *
 * Solo afirma lo que sale de los datos: lo que no se puede medir queda en
 * `null` (la interfaz lo muestra como "—"), nunca como 0 inventado.
 */
import type { DetalleLanzamiento } from "@/lib/lanzamientos/datos";
import { cruzarRegistrados, resumirCheckout, type ResumenCheckout } from "@/lib/lanzamientos/despues";
import {
  rankingUtm,
  resumirOrigenes,
  type OrigenSinUtm,
  type RankingUtm,
} from "@/lib/lanzamientos/origen";
import {
  compararVariantes,
  conversion,
  diaDe,
  resumirRegistros,
  resumirVisitas,
  ritmoHaciaMeta,
  type Compra,
  type PaginaLanzamiento,
  type Ritmo,
  type TipoLanding,
  type VisitaAgregada,
} from "@/lib/lanzamientos/tipos";
import {
  filtrarPorLanding,
  filtrarPorPeriodo,
  rangoDePeriodo,
  type DatosVista,
  type Periodo,
  type Rango,
} from "@/lib/lanzamientos/vista";

/* ───────────── Período ───────────── */

export type PeriodoResultados = Extract<Periodo, "hoy" | "7d" | "30d" | "todo">;

export const OPCIONES_PERIODO: { valor: PeriodoResultados; etiqueta: string; largo: string }[] = [
  { valor: "hoy", etiqueta: "Hoy", largo: "hoy" },
  { valor: "7d", etiqueta: "7 días", largo: "los últimos 7 días" },
  { valor: "30d", etiqueta: "30 días", largo: "los últimos 30 días" },
  { valor: "todo", etiqueta: "Todo", largo: "todo el lanzamiento" },
];

const DIA_MS = 86_400_000;
const aUtc = (dia: string) => Date.parse(`${dia}T00:00:00Z`);
const sumarDias = (dia: string, n: number) => new Date(aUtc(dia) + n * DIA_MS).toISOString().slice(0, 10);

/** Todos los días entre dos fechas (inclusive). */
export function diasEntre(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  for (let d = desde; d <= hasta && dias.length < 800; d = sumarDias(d, 1)) dias.push(d);
  return dias;
}

/** El tramo de igual largo justo antes del rango. */
export function rangoAnterior(rango: Rango): Rango {
  const hasta = sumarDias(rango.desde, -1);
  return { desde: sumarDias(hasta, -(rango.dias - 1)), hasta, dias: rango.dias };
}

/* ───────────── Helpers de series ───────────── */

/** Visitantes únicos sumados por día (todas las landings y fuentes), de más viejo a más nuevo. */
export function visitasPorDia(visitas: Pick<VisitaAgregada, "day" | "visitors">[]): { dia: string; visitantes: number }[] {
  const dias = new Map<string, number>();
  for (const v of visitas) dias.set(v.day, (dias.get(v.day) ?? 0) + Number(v.visitors));
  return [...dias.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dia, visitantes]) => ({ dia, visitantes }));
}

/** Ingresos por moneda: sumar USD con ARS daría un número sin sentido. */
export function ingresosPorMoneda(compras: Pick<Compra, "amount" | "currency">[]): [string, number][] {
  const total = new Map<string, number>();
  for (const c of compras) {
    if (c.amount === null) continue;
    const moneda = c.currency ?? "—";
    total.set(moneda, (total.get(moneda) ?? 0) + c.amount);
  }
  return [...total.entries()];
}

/** Variación porcentual contra el período anterior. Null si no hay base para comparar. */
export function variacionPorcentual(actual: number | null, anterior: number | null): number | null {
  if (actual === null || anterior === null || anterior <= 0) return null;
  return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}

/* ───────────── Resultado ───────────── */

export interface PuntoDia {
  dia: string;
  visitantes: number;
  registros: number;
  ventas: number;
  /** Ingresos del día en texto ("USD 40 · ARS 1.000"), para el tooltip. */
  ingresos: string;
  /** Conversión del día; null si no se puede medir. */
  conversion: number | null;
  /** Registros acumulados de todo el lanzamiento hasta ese día. */
  acumulado: number;
}

export interface Metricas {
  visitantes: number;
  registros: number;
  ventas: number;
  /** Conversión principal (a registro, o a venta si solo hay landings de venta). */
  conversion: number | null;
  tipoConversion: TipoLanding;
}

export interface PasoEmbudo {
  id: "visitantes" | "registros" | "whatsapp" | "webinar" | "compras";
  etiqueta: string;
  cantidad: number;
  /** Porcentaje contra el paso anterior; null en el primero o si no se puede medir. */
  porcentaje: number | null;
}

export interface FuenteTrafico {
  /** "" = sin UTM. */
  fuente: string;
  etiqueta: string;
  visitantes: number;
  registros: number;
  conversion: number | null;
}

export interface FilaLanding {
  id: string;
  name: string;
  kind: TipoLanding;
  visitantes: number;
  conversiones: number;
  cvr: number | null;
}

export interface ComparacionLanding {
  tipo: TipoLanding;
  mejor: string;
  segunda: string;
  significativa: boolean;
}

export interface ResultadosVista {
  periodo: PeriodoResultados;
  periodoLargo: string;
  rango: Rango | null;
  landing: PaginaLanzamiento | null;
  /** Serie diaria que se grafica. */
  serie: PuntoDia[];
  /** En "Hoy" la serie muestra los últimos 7 días para dar contexto. */
  serieAmpliada: boolean;
  actual: Metricas;
  /** Período anterior de igual largo; null si no hay con qué comparar. */
  anterior: Metricas | null;
  hayVisitas: boolean;
  ingresos: [string, number][];
  precioLista: boolean;
  ventasSinFecha: number;
  /** La meta es del lanzamiento entero, no del período. */
  meta: { objetivo: number; registros: number; porcentaje: number; ritmo: Ritmo | null } | null;
  embudo: PasoEmbudo[];
  listas: { id: string; name: string; cantidad: number; porcentaje: number | null }[];
  fuentes: FuenteTrafico[];
  /** Qué mide el donut: visitas o, si no hay visitas, registros. */
  baseFuentes: "visitantes" | "registros";
  campanas: RankingUtm;
  anuncios: RankingUtm;
  origenesSinUtm: OrigenSinUtm[];
  porLanding: FilaLanding[];
  comparaciones: ComparacionLanding[];
  registrosQueCompraron: number | null;
  checkout: ResumenCheckout | null;
  /** Hay más registros de los que se leyeron: los totales son parciales. */
  truncado: boolean;
  /** Datos ya filtrados (para exportar la tabla). */
  datos: DatosVista;
}

const TOPE_FUENTES = 6;

/** Visitantes y registros de las landings de registro con visitas medidas (para no mezclar peras con manzanas). */
function conversionRegistro(datos: DatosVista) {
  const trafico = resumirVisitas(datos.visitas);
  const registros = resumirRegistros(datos.registros);
  const medidas = datos.paginas.filter((p) => p.kind !== "venta" && (trafico.porPagina[p.id] ?? 0) > 0);
  return {
    registros: medidas.reduce((t, p) => t + (registros.porPagina[p.id] ?? 0), 0),
    visitantes: medidas.reduce((t, p) => t + (trafico.porPagina[p.id] ?? 0), 0),
  };
}

function metricas(datos: DatosVista): Metricas {
  const trafico = resumirVisitas(datos.visitas);
  const soloVenta = datos.paginas.length > 0 && datos.paginas.every((p) => p.kind === "venta");
  if (soloVenta) {
    return {
      visitantes: trafico.total,
      registros: datos.registros.length,
      ventas: datos.compras.length,
      conversion: conversion(datos.compras.length, trafico.total),
      tipoConversion: "venta",
    };
  }
  const c = conversionRegistro(datos);
  return {
    visitantes: trafico.total,
    registros: datos.registros.length,
    ventas: datos.compras.length,
    conversion: conversion(c.registros, c.visitantes),
    tipoConversion: "registro",
  };
}

const textoIngresos = (compras: Pick<Compra, "amount" | "currency">[]) =>
  ingresosPorMoneda(compras)
    .map(([moneda, total]) => `${moneda} ${total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`)
    .join(" · ");

function construirSerie(datos: DatosVista, desde: string | null, hasta: string, todos: DatosVista): PuntoDia[] {
  const visitas = new Map(visitasPorDia(datos.visitas).map((v) => [v.dia, v.visitantes]));
  const registros = new Map(resumirRegistros(datos.registros).porDia.map((r) => [r.dia, r.registros]));
  const comprasDia = new Map<string, Compra[]>();
  for (const c of datos.compras) {
    if (c.occurred_at === null) continue;
    const dia = diaDe(c.occurred_at);
    comprasDia.set(dia, [...(comprasDia.get(dia) ?? []), c]);
  }

  let inicio = desde;
  if (!inicio) {
    const conDatos = [...visitas.keys(), ...registros.keys(), ...comprasDia.keys()].sort();
    if (conDatos.length === 0) return [];
    inicio = conDatos[0];
    hasta = conDatos[conDatos.length - 1] > hasta ? conDatos[conDatos.length - 1] : hasta;
  }
  // Un lanzamiento largo no necesita 800 puntos: los últimos 90 días se leen bien.
  const dias = diasEntre(inicio, hasta).slice(-90);

  // Acumulado de todo el lanzamiento (todas las landings): sirve para la meta.
  const porDiaTodos = resumirRegistros(todos.registros).porDia;
  let acumulado = porDiaTodos.filter((d) => d.dia < dias[0]).reduce((t, d) => t + d.registros, 0);
  const deTodos = new Map(porDiaTodos.map((d) => [d.dia, d.registros]));

  return dias.map((dia) => {
    acumulado += deTodos.get(dia) ?? 0;
    const visitantes = visitas.get(dia) ?? 0;
    const regs = registros.get(dia) ?? 0;
    const compras = comprasDia.get(dia) ?? [];
    return {
      dia,
      visitantes,
      registros: regs,
      ventas: compras.length,
      ingresos: textoIngresos(compras),
      conversion: conversion(regs, visitantes),
      acumulado,
    };
  });
}

export function calcularResultados(
  detalle: DetalleLanzamiento,
  opciones: { periodo: PeriodoResultados; landingId: string | null; ahora: Date },
): ResultadosVista {
  const { periodo, landingId, ahora } = opciones;
  const hoy = diaDe(ahora);
  const rango = rangoDePeriodo(periodo, ahora);
  const landing = detalle.paginas.find((p) => p.id === landingId) ?? null;

  const enPeriodo = filtrarPorPeriodo(detalle, rango);
  const vista: DatosVista = filtrarPorLanding(enPeriodo, landing?.id ?? null);
  const actual = metricas(vista);

  // Contra el período anterior, solo si es comparable: "Hoy" es un día a medias
  // y "Todo" no tiene un antes.
  const rangoPrevio = rango && periodo !== "hoy" ? rangoAnterior(rango) : null;
  const anterior = rangoPrevio
    ? metricas(filtrarPorLanding(filtrarPorPeriodo(detalle, rangoPrevio), landing?.id ?? null))
    : null;

  // Serie: el rango elegido; en "Hoy", los últimos 7 días; en "Todo", desde el primer dato.
  const serieAmpliada = periodo === "hoy";
  const serieRango = serieAmpliada ? rangoDePeriodo("7d", ahora) : rango;
  const serieDatos = serieAmpliada ? filtrarPorLanding(filtrarPorPeriodo(detalle, serieRango), landing?.id ?? null) : vista;
  const serie = construirSerie(serieDatos, serieRango?.desde ?? null, serieRango?.hasta ?? hoy, detalle);

  const trafico = resumirVisitas(vista.visitas);
  const hayVisitas = trafico.total > 0;

  /* Meta: de todo el lanzamiento, sin filtros. */
  const objetivo = detalle.lanzamiento.goal_registrations;
  const totalLanzamiento = detalle.registros.length;
  const meta = objetivo
    ? {
        objetivo,
        registros: totalLanzamiento,
        porcentaje: Math.round((totalLanzamiento / objetivo) * 100),
        ritmo: ritmoHaciaMeta(detalle.lanzamiento, totalLanzamiento, hoy),
      }
    : null;

  /* Embudo */
  const despues = detalle.despues;
  const soloVenta = vista.paginas.length > 0 && vista.paginas.every((p) => p.kind === "venta");
  const visitantesEmbudo = soloVenta ? trafico.total : conversionRegistro(vista).visitantes;
  const whatsapp = despues
    ? cruzarRegistrados(
        vista.registros,
        despues.eventos.filter((e) => e.kind === "whatsapp_click").map((e) => e.email),
      )
    : null;
  const webinar = despues
    ? cruzarRegistrados(
        vista.registros,
        despues.webinar.map((e) => e.email),
      )
    : null;
  const hayWhatsapp = Boolean(despues?.eventos.some((e) => e.kind === "whatsapp_click")) && (whatsapp?.cruzan ?? 0) > 0;
  const hayWebinar = (webinar?.cruzan ?? 0) > 0;

  const crudos: Omit<PasoEmbudo, "porcentaje">[] = [];
  if (visitantesEmbudo > 0) crudos.push({ id: "visitantes", etiqueta: "Visitantes", cantidad: visitantesEmbudo });
  if (vista.registros.length > 0) crudos.push({ id: "registros", etiqueta: "Registros", cantidad: vista.registros.length });
  if (hayWhatsapp && whatsapp) {
    crudos.push({ id: "whatsapp", etiqueta: "Entraron al grupo de WhatsApp", cantidad: whatsapp.cruzan });
  }
  if (hayWebinar && webinar) {
    crudos.push({ id: "webinar", etiqueta: "Se conectaron al webinar", cantidad: webinar.cruzan });
  }
  if (vista.compras.length > 0) crudos.push({ id: "compras", etiqueta: "Compraron", cantidad: vista.compras.length });
  const embudo: PasoEmbudo[] = crudos.map((p, i) => ({
    ...p,
    porcentaje: i === 0 ? null : conversion(p.cantidad, crudos[i - 1].cantidad),
  }));

  // Listas cargadas (Zoom, grupo, compradores): no traen fechas, así que son del lanzamiento entero.
  const listas = detalle.listas.map((l) => {
    const cantidad = landing ? (l.porPagina[landing.id] ?? 0) : l.cruzan;
    return { id: l.id, name: l.name, cantidad, porcentaje: conversion(cantidad, vista.registros.length) };
  });

  /* Origen */
  const hayLandingRegistro = vista.paginas.some((p) => p.kind !== "venta");
  const idsRegistro = new Set(vista.paginas.filter((p) => p.kind !== "venta").map((p) => p.id));
  const visitasOrigen = hayLandingRegistro ? vista.visitas.filter((v) => idsRegistro.has(v.page_id)) : vista.visitas;
  const traficoOrigen = resumirVisitas(visitasOrigen);
  const registrosPorFuente = new Map<string, number>();
  for (const r of vista.registros) {
    const f = r.utm_source?.trim() || "";
    registrosPorFuente.set(f, (registrosPorFuente.get(f) ?? 0) + 1);
  }
  const hayRegistrosConFuente = vista.registros.some((r) => r.utm_source?.trim());

  const baseFuentes: "visitantes" | "registros" = traficoOrigen.total > 0 ? "visitantes" : "registros";
  const todasFuentes: FuenteTrafico[] =
    baseFuentes === "visitantes"
      ? traficoOrigen.porFuente.map((f) => {
          const registros = registrosPorFuente.get(f.fuente) ?? 0;
          return {
            fuente: f.fuente,
            etiqueta: f.fuente || "Sin UTM",
            visitantes: f.visitantes,
            registros,
            conversion: hayRegistrosConFuente ? conversion(registros, f.visitantes) : null,
          };
        })
      : hayRegistrosConFuente
        ? [...registrosPorFuente.entries()]
            .map(([fuente, registros]) => ({
              fuente,
              etiqueta: fuente || "Sin UTM",
              visitantes: 0,
              registros,
              conversion: null,
            }))
            .sort((a, b) => b.registros - a.registros)
        : [];
  const principales = todasFuentes.slice(0, TOPE_FUENTES);
  const resto = todasFuentes.slice(TOPE_FUENTES);
  const fuentes: FuenteTrafico[] =
    resto.length > 0
      ? [
          ...principales,
          {
            fuente: "__otras",
            etiqueta: "Otras fuentes",
            visitantes: resto.reduce((t, f) => t + f.visitantes, 0),
            registros: resto.reduce((t, f) => t + f.registros, 0),
            conversion: null,
          },
        ]
      : principales;

  /* Por landing: siempre todas las del lanzamiento, en el período elegido. */
  const traficoPeriodo = resumirVisitas(enPeriodo.visitas);
  const registrosPeriodo = resumirRegistros(enPeriodo.registros);
  const comprasPorPagina = new Map<string, number>();
  for (const c of enPeriodo.compras) {
    if (c.page_id) comprasPorPagina.set(c.page_id, (comprasPorPagina.get(c.page_id) ?? 0) + 1);
  }
  const porLanding: FilaLanding[] = detalle.paginas.map((p) => {
    const visitantes = traficoPeriodo.porPagina[p.id] ?? 0;
    const conversiones = p.kind === "venta" ? (comprasPorPagina.get(p.id) ?? 0) : (registrosPeriodo.porPagina[p.id] ?? 0);
    return { id: p.id, name: p.name, kind: p.kind, visitantes, conversiones, cvr: conversion(conversiones, visitantes) };
  });
  const comparaciones: ComparacionLanding[] = [];
  for (const tipo of ["registro", "venta"] as const) {
    const c = compararVariantes(
      porLanding.filter((p) => p.kind === tipo).map((p) => ({ id: p.id, visitantes: p.visitantes, registros: p.conversiones })),
    );
    if (c) comparaciones.push({ tipo, ...c });
  }

  const checkout =
    despues && resumirCheckout(despues.eventos, vista.paginas, rango, vista.compras.length).total > 0
      ? resumirCheckout(despues.eventos, vista.paginas, rango, vista.compras.length)
      : null;

  return {
    periodo,
    periodoLargo: OPCIONES_PERIODO.find((o) => o.valor === periodo)?.largo ?? "todo el lanzamiento",
    rango,
    landing,
    serie,
    serieAmpliada,
    actual,
    anterior,
    hayVisitas,
    ingresos: ingresosPorMoneda(vista.compras),
    precioLista: vista.compras.some((c) => c.list_price),
    ventasSinFecha: vista.compras.filter((c) => c.occurred_at === null).length,
    meta,
    embudo,
    listas,
    fuentes,
    baseFuentes,
    campanas: rankingUtm(vista.registros, "utm_campaign", 5),
    anuncios: rankingUtm(vista.registros, "utm_content", 5),
    origenesSinUtm: resumirOrigenes(vista.referrers ?? []),
    porLanding,
    comparaciones,
    registrosQueCompraron: vista.registros.length > 0 ? conversion(vista.compras.length, vista.registros.length) : null,
    checkout,
    truncado: detalle.truncado,
    datos: vista,
  };
}
