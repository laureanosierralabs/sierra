/**
 * Agregaciones puras para Inicio. Sin I/O ni React: reciben las filas que ya
 * cargaron `lib/landing/datos`, `balance` y `personal-finance-server`, y
 * devuelven lo que la pantalla necesita para decidir el día.
 *
 * Reglas que no se rompen acá:
 * - Las monedas no se convierten ni se suman entre sí.
 * - Una fecha ausente es "sin fecha", nunca se estima.
 */

import type { Balance, PorMoneda } from "@/lib/landing/balance";
import {
  MONEDAS,
  codigoCotizacion,
  esCuentaPorCobrar,
  esProyectoActivo,
  esTareaAbierta,
  formatearMonto,
  pendienteDeCobro,
  type Cotizacion,
  type Proyecto,
  type Tarea,
} from "@/lib/landing/tipos";
import { money, type FinanceData } from "@/lib/personal-finance";
import {
  commitmentDate,
  defaultPaymentAmount,
  isIncoming,
  monthShortLabel,
  shiftMonth,
  upcomingCommitments,
} from "@/lib/personal-finance-stats";

const ZONA = "America/Argentina/Buenos_Aires";
const DIA_MS = 86_400_000;

/* ───────────── Fechas (zona Buenos Aires) ───────────── */

export function saludo(ahora: Date = new Date()): string {
  const hora = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: ZONA }).format(
      ahora,
    ),
  );
  if (hora < 6) return "Buenas noches";
  if (hora < 13) return "Buen día";
  if (hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** "Jueves 8 de octubre". */
export function fechaLarga(ahora: Date = new Date()): string {
  const texto = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: ZONA,
  }).format(ahora);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Días de `hoy` a `fecha` (AAAA-MM-DD). Negativo = ya pasó. */
export function diasEntre(hoy: string, fecha: string): number {
  return Math.round((Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / DIA_MS);
}

export function textoDias(dias: number): string {
  if (dias < 0) return `Venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`;
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}

/* ───────────── Ítems de lista ───────────── */

export type TonoItem = "error" | "warning" | "gray";

export interface ItemInicio {
  /** Estable entre listas: sirve para no repetir un ítem en dos secciones. */
  key: string;
  titulo: string;
  detalle: string;
  href: string;
  etiqueta: string;
  tono: TonoItem;
  /** Días hasta la fecha; null cuando el ítem no tiene fecha. */
  dias: number | null;
}

function tonoPorDias(dias: number): TonoItem {
  return dias < 0 ? "error" : dias <= 1 ? "warning" : "gray";
}

function unir(...partes: (string | null | undefined)[]): string {
  return partes.filter(Boolean).join(" · ");
}

/* ───────────── Necesita atención ───────────── */

const MAX_ATENCION = 8;
const DIAS_PROYECTO_CERCA = 7;
const DIAS_COMPROMISO_CERCA = 7;
const MAX_COBROS = 2;
/** Los sin fecha van después de todo lo que sí tiene fecha. */
const SIN_FECHA = 1000;

function tareasVencidas(
  tareas: Tarea[],
  proyectoPor: Map<string, string>,
  hoy: string,
): ItemInicio[] {
  const items: ItemInicio[] = [];
  for (const t of tareas) {
    if (!esTareaAbierta(t.status) || !t.due_date) continue;
    const dias = diasEntre(hoy, t.due_date);
    if (dias > 0) continue;
    items.push({
      key: `tarea:${t.id}`,
      titulo: t.title,
      detalle: unir("Tarea", t.project_id ? proyectoPor.get(t.project_id) : null),
      href: `/landing-pages/tasks/${t.id}`,
      etiqueta: textoDias(dias),
      tono: tonoPorDias(dias),
      dias,
    });
  }
  return items;
}

function proyectosEnRiesgo(
  proyectos: Proyecto[],
  clientePor: Map<string, string>,
  hoy: string,
): ItemInicio[] {
  const items: ItemInicio[] = [];
  for (const p of proyectos) {
    if (!esProyectoActivo(p.status)) continue;
    const cliente = (p.client_id ? clientePor.get(p.client_id) : null) ?? p.client_name;
    const espera = p.status === "esperando-cliente";
    const dias = p.due_date ? diasEntre(hoy, p.due_date) : null;

    if (dias !== null && dias <= DIAS_PROYECTO_CERCA) {
      items.push({
        key: `proyecto:${p.id}`,
        titulo: p.name,
        detalle: unir("Entrega", cliente, espera ? "Esperando cliente" : null),
        href: `/landing-pages/projects/${p.id}`,
        etiqueta: textoDias(dias),
        tono: tonoPorDias(dias),
        dias,
      });
    } else if (espera) {
      items.push({
        key: `proyecto:${p.id}`,
        titulo: p.name,
        detalle: unir("Proyecto", cliente),
        href: `/landing-pages/projects/${p.id}`,
        etiqueta: "Esperando cliente",
        tono: "warning",
        dias: null,
      });
    }
  }
  return items;
}

/**
 * Las cotizaciones no tienen fecha de vencimiento: no se inventa una. Se
 * muestran las de mayor saldo, ordenadas por moneda para no comparar USD con ARS.
 */
function cobrosPendientes(cotizaciones: Cotizacion[], clientePor: Map<string, string>): ItemInicio[] {
  return cotizaciones
    .filter(esCuentaPorCobrar)
    .sort(
      (a, b) =>
        MONEDAS.indexOf(a.currency) - MONEDAS.indexOf(b.currency) ||
        pendienteDeCobro(b) - pendienteDeCobro(a),
    )
    .slice(0, MAX_COBROS)
    .map((q) => ({
      key: `cotizacion:${q.id}`,
      titulo: `${codigoCotizacion(q.numero)} · ${q.title}`,
      detalle: unir("Por cobrar", q.client_id ? clientePor.get(q.client_id) : null),
      href: `/landing-pages/quotes/${q.id}`,
      etiqueta: formatearMonto(pendienteDeCobro(q), q.currency),
      tono: "warning" as const,
      dias: null,
    }));
}

/** Solo compromisos con día exacto: uno con "mes objetivo" no dice si es hoy. */
function compromisosCercanos(data: FinanceData, hoy: string): ItemInicio[] {
  const items: ItemInicio[] = [];
  for (const { row, entity } of upcomingCommitments(data)) {
    const fecha = commitmentDate(row);
    if (!fecha || fecha.length !== 10) continue;
    const dias = diasEntre(hoy, fecha);
    if (dias > DIAS_COMPROMISO_CERCA) continue;

    const monto = defaultPaymentAmount(row, entity, data);
    const entra = isIncoming(row);
    items.push({
      key: `compromiso:${entity}:${row.id}`,
      titulo: String(row.name ?? row.counterparty ?? "Compromiso"),
      detalle: unir(
        entra ? "Cobro personal" : "Pago personal",
        monto === null ? "Monto pendiente de completar" : money(monto, row.currency),
      ),
      href: "/finanzas/personal",
      etiqueta: textoDias(dias),
      tono: dias < 0 && !entra ? "error" : tonoPorDias(dias),
      dias,
    });
  }
  return items;
}

export interface EntradaAtencion {
  tareas: Tarea[];
  proyectos: Proyecto[];
  cotizaciones: Cotizacion[];
  clientes: Map<string, string>;
  proyectoNombre: Map<string, string>;
  /** Solo el owner: sin este dato no se muestran compromisos personales. */
  personal: FinanceData | null;
  hoy: string;
}

/** Lista única priorizada: lo más vencido primero, lo que no tiene fecha al final. */
export function armarAtencion(e: EntradaAtencion): ItemInicio[] {
  return [
    ...tareasVencidas(e.tareas, e.proyectoNombre, e.hoy),
    ...proyectosEnRiesgo(e.proyectos, e.clientes, e.hoy),
    ...(e.personal ? compromisosCercanos(e.personal, e.hoy) : []),
    ...cobrosPendientes(e.cotizaciones, e.clientes),
  ]
    .sort((a, b) => (a.dias ?? SIN_FECHA) - (b.dias ?? SIN_FECHA))
    .slice(0, MAX_ATENCION);
}

/* ───────────── Próximas entregas ───────────── */

const MAX_ENTREGAS = 8;
const VENTANA_ENTREGAS = 14;

/** Mañana en adelante, hasta 14 días. Lo de hoy o vencido ya está en atención. */
export function proximasEntregas(
  e: Pick<EntradaAtencion, "tareas" | "proyectos" | "clientes" | "proyectoNombre" | "hoy">,
  yaMostrados: Set<string>,
): ItemInicio[] {
  const items: ItemInicio[] = [];
  const dentro = (fecha: string | null): number | null => {
    if (!fecha) return null;
    const dias = diasEntre(e.hoy, fecha);
    return dias >= 1 && dias <= VENTANA_ENTREGAS ? dias : null;
  };

  for (const t of e.tareas) {
    const dias = esTareaAbierta(t.status) ? dentro(t.due_date) : null;
    if (dias === null) continue;
    items.push({
      key: `tarea:${t.id}`,
      titulo: t.title,
      detalle: unir("Tarea", t.project_id ? e.proyectoNombre.get(t.project_id) : null),
      href: `/landing-pages/tasks/${t.id}`,
      etiqueta: textoDias(dias),
      tono: "gray",
      dias,
    });
  }
  for (const p of e.proyectos) {
    const dias = esProyectoActivo(p.status) ? dentro(p.due_date) : null;
    if (dias === null) continue;
    items.push({
      key: `proyecto:${p.id}`,
      titulo: p.name,
      detalle: unir("Entrega", (p.client_id ? e.clientes.get(p.client_id) : null) ?? p.client_name),
      href: `/landing-pages/projects/${p.id}`,
      etiqueta: textoDias(dias),
      tono: "gray",
      dias,
    });
  }

  return items
    .filter((i) => !yaMostrados.has(i.key))
    .sort((a, b) => (a.dias ?? SIN_FECHA) - (b.dias ?? SIN_FECHA))
    .slice(0, MAX_ENTREGAS);
}

/* ───────────── KPIs ───────────── */

export function resumenTareas(tareas: Tarea[], hoy: string) {
  let vencidas = 0;
  let paraHoy = 0;
  for (const t of tareas) {
    if (!esTareaAbierta(t.status) || !t.due_date) continue;
    const dias = diasEntre(hoy, t.due_date);
    if (dias < 0) vencidas++;
    else if (dias === 0) paraHoy++;
  }
  return { vencidas, paraHoy };
}

/** "ARS 120.000 · EUR 50": lo que hay en monedas distintas de USD, o null. */
export function otrasMonedas(valores: PorMoneda): string | null {
  const partes = MONEDAS.filter((m) => m !== "USD" && valores[m] > 0).map((m) =>
    formatearMonto(valores[m], m),
  );
  return partes.length > 0 ? partes.join(" · ") : null;
}

export type PuntoCobrado = { mes: string; etiqueta: string; cobrado: number };

/** Cobrado en USD por mes, de los últimos `meses` meses corridos (con ceros). */
export function serieCobrado(balance: Balance, mesActual: string, meses = 6): PuntoCobrado[] {
  const porMes = new Map(balance.meses.map((m) => [m.mes, m.ingresos.USD]));
  return Array.from({ length: meses }, (_, i) => {
    const mes = shiftMonth(mesActual, i - (meses - 1));
    return { mes, etiqueta: monthShortLabel(mes), cobrado: porMes.get(mes) ?? 0 };
  });
}
