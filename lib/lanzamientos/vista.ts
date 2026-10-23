/**
 * Lógica de la vista de resultados de un lanzamiento: filtrar todo por una
 * landing y exportar los registros con las columnas elegidas. Pura: la usan
 * el panel interno y el portal, en el navegador.
 */
import type { Compra, PaginaLanzamiento, Registro, VisitaAgregada } from "@/lib/lanzamientos/tipos";

export interface DatosVista {
  paginas: PaginaLanzamiento[];
  registros: Registro[];
  visitas: VisitaAgregada[];
  compras: Compra[];
}

/** Todo lo del lanzamiento, o solo lo de una landing (null = todas). */
export function filtrarPorLanding(datos: DatosVista, pageId: string | null): DatosVista {
  if (!pageId) return datos;
  return {
    paginas: datos.paginas.filter((p) => p.id === pageId),
    registros: datos.registros.filter((r) => r.page_id === pageId),
    visitas: datos.visitas.filter((v) => v.page_id === pageId),
    compras: datos.compras.filter((c) => c.page_id === pageId),
  };
}

/* ───────────── Período ───────────── */

export const PERIODOS = [
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "ayer", etiqueta: "Ayer" },
  { valor: "7d", etiqueta: "Últimos 7 días" },
  { valor: "30d", etiqueta: "Últimos 30 días" },
] as const;
export type Periodo = (typeof PERIODOS)[number]["valor"] | "todo";

export interface Rango {
  /** Días AAAA-MM-DD, inclusive, en hora de Buenos Aires. */
  desde: string;
  hasta: string;
  dias: number;
}

const DIA_BA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
const diaBA = (instante: string | Date) => DIA_BA.format(typeof instante === "string" ? new Date(instante) : instante);
const restarDias = (dia: string, n: number) => {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

/** Días que cubre un período, contados hacia atrás desde hoy (incluido). Null = todo el lanzamiento. */
export function rangoDePeriodo(periodo: Periodo, ahora: Date = new Date()): Rango | null {
  const hoy = diaBA(ahora);
  switch (periodo) {
    case "hoy":
      return { desde: hoy, hasta: hoy, dias: 1 };
    case "ayer": {
      const ayer = restarDias(hoy, 1);
      return { desde: ayer, hasta: ayer, dias: 1 };
    }
    case "7d":
      return { desde: restarDias(hoy, 6), hasta: hoy, dias: 7 };
    case "30d":
      return { desde: restarDias(hoy, 29), hasta: hoy, dias: 30 };
    default:
      return null;
  }
}

/** Solo lo que pasó dentro del rango. Las landings y el resto de los datos quedan igual. */
export function filtrarPorPeriodo<T extends DatosVista>(datos: T, rango: Rango | null): T {
  if (!rango) return datos;
  const dentro = (dia: string) => dia >= rango.desde && dia <= rango.hasta;
  return {
    ...datos,
    registros: datos.registros.filter((r) => dentro(diaBA(r.registered_at))),
    visitas: datos.visitas.filter((v) => dentro(v.day)),
    // Una venta sin fecha conocida solo cuenta en el lanzamiento entero.
    compras: datos.compras.filter((c) => c.occurred_at !== null && dentro(diaBA(c.occurred_at))),
  };
}

/* ───────────── Exportación ───────────── */

export interface ColumnaExportable {
  id: string;
  etiqueta: string;
}

/** Columnas fijas de un registro, en el orden en que salen en el archivo. */
export const COLUMNAS_BASE: ColumnaExportable[] = [
  { id: "nombre", etiqueta: "Nombre" },
  { id: "email", etiqueta: "Email" },
  { id: "telefono", etiqueta: "Teléfono" },
  { id: "landing", etiqueta: "Landing" },
  { id: "fuente", etiqueta: "Fuente (utm_source)" },
  { id: "medio", etiqueta: "Medio (utm_medium)" },
  { id: "campana", etiqueta: "Campaña (utm_campaign)" },
  { id: "anuncio", etiqueta: "Anuncio (utm_content)" },
  { id: "fecha", etiqueta: "Fecha" },
];

/** Las que vienen marcadas: lo que se pide casi siempre. */
export const COLUMNAS_POR_DEFECTO = ["nombre", "email", "telefono", "landing", "fecha"];

/** Prefijo de las columnas extra (datos importados de otro formulario). */
export const PREFIJO_EXTRA = "extra:";

/** Columnas extra presentes en los registros, ordenadas. */
export function columnasExtra(registros: Pick<Registro, "extra">[]): string[] {
  const claves = new Set<string>();
  for (const r of registros) for (const k of Object.keys(r.extra ?? {})) claves.add(k);
  return [...claves].sort((a, b) => a.localeCompare(b, "es"));
}

/* Fecha y hora de Buenos Aires, legible en una planilla. */
const FECHA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function valor(r: Registro, columna: string, nombrePagina: Map<string, string>): string | null {
  if (columna.startsWith(PREFIJO_EXTRA)) {
    // hasOwn: una columna llamada "constructor" no puede devolver lo heredado.
    const clave = columna.slice(PREFIJO_EXTRA.length);
    return r.extra && Object.hasOwn(r.extra, clave) ? r.extra[clave] : null;
  }
  switch (columna) {
    case "nombre":
      return r.name;
    case "email":
      return r.email;
    case "telefono":
      return r.phone;
    case "landing":
      return r.page_id ? (nombrePagina.get(r.page_id) ?? null) : null;
    case "fuente":
      return r.utm_source;
    case "medio":
      return r.utm_medium;
    case "campana":
      return r.utm_campaign;
    case "anuncio":
      return r.utm_content;
    case "fecha":
      return FECHA.format(new Date(r.registered_at));
    default:
      return null;
  }
}

/** Entre comillas y con las comillas duplicadas: una coma no rompe la fila. */
export function celdaCsv(v: string | null): string {
  let t = v ?? "";
  // Una celda que empieza con = + - @ se ejecuta como fórmula en Excel: lo
  // escribe quien se registra, así que se neutraliza.
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
}

/** CSV con las columnas elegidas, en el orden de la lista. BOM para que Excel lea los acentos. */
export function csvRegistros(
  registros: Registro[],
  columnas: string[],
  paginas: Pick<PaginaLanzamiento, "id" | "name">[],
): string {
  const nombrePagina = new Map(paginas.map((p) => [p.id, p.name]));
  const etiqueta = new Map(COLUMNAS_BASE.map((c) => [c.id, c.etiqueta]));
  const encabezado = columnas.map((c) =>
    c.startsWith(PREFIJO_EXTRA) ? c.slice(PREFIJO_EXTRA.length) : (etiqueta.get(c) ?? c),
  );
  const filas = [encabezado, ...registros.map((r) => columnas.map((c) => valor(r, c, nombrePagina)))];
  return `﻿${filas.map((f) => f.map(celdaCsv).join(",")).join("\r\n")}\r\n`;
}
