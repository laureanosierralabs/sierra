/**
 * Tabla de horas: cálculo, validación y exportación. Lógica pura (sin I/O):
 * se prueba en node. Las columnas exportadas son las de la planilla de Wonder
 * Digital (Dia · Hora de comienzo · Hora de finalización · Horas trabajadas ·
 * Comentarios sobre lo trabajado).
 */

export interface EntradaHora {
  id: string;
  user_id: string;
  user_name: string;
  client_id: string | null;
  /** AAAA-MM-DD */
  work_date: string;
  /** HH:MM (Postgres devuelve HH:MM:SS; se recorta al leer). */
  start_time: string;
  end_time: string;
  minutes: number;
  notes: string;
}

export const MAX_NOTAS = 2000;

const HORA = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** "HH:MM" de una hora; null si no es válida. Acepta HH:MM:SS (como la guarda Postgres). */
export function horaValida(valor: string): string | null {
  const m = HORA.exec(valor.trim());
  return m ? `${m[1]}:${m[2]}` : null;
}

export function fechaValida(valor: string): string | null {
  const v = valor.trim();
  if (!FECHA.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v;
}

/** Minutos entre dos horas del mismo día; null si el fin no es posterior al inicio. */
export function minutosEntre(inicio: string, fin: string): number | null {
  const a = horaValida(inicio);
  const b = horaValida(fin);
  if (!a || !b) return null;
  const min = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
  const diff = min(b) - min(a);
  return diff > 0 ? diff : null;
}

/** Horas con dos decimales y coma, como la planilla: 90 → "1,50". */
export function horasTexto(minutos: number): string {
  return (minutos / 60).toFixed(2).replace(".", ",");
}

/** "2 h 30 min" para mostrar en pantalla. */
export function duracionTexto(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export const totalMinutos = (entradas: Pick<EntradaHora, "minutes">[]) =>
  entradas.reduce((t, e) => t + e.minutes, 0);

/** Primer y último día del mes de `hoy` (AAAA-MM-DD). */
export function mesDe(hoy: string): { desde: string; hasta: string } {
  const [a, m] = hoy.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { desde: `${a}-${mm}-01`, hasta: `${a}-${mm}-${String(ultimo).padStart(2, "0")}` };
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/** "AAAA-MM" válido, o null. */
export function mesValido(valor: string): string | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(valor.trim());
  return m ? `${m[1]}-${m[2]}` : null;
}

/** Mes corrido `delta` meses ("AAAA-MM"). */
export function correrMes(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const indice = a * 12 + (m - 1) + delta;
  return `${Math.floor(indice / 12)}-${String((indice % 12) + 1).padStart(2, "0")}`;
}

/** "2026-10" → "Octubre 2026". */
export function etiquetaMes(mes: string): string {
  const [a, m] = mes.split("-");
  return `${MESES[Number(m) - 1] ?? m} ${a}`;
}

const diaPlanilla = (fecha: string) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(0, 4)}`;

export const COLUMNAS_PLANILLA = [
  "Dia",
  "Hora de comienzo",
  "Hora de finalización",
  "Horas trabajadas",
  "Comentarios sobre lo trabajado",
] as const;

/**
 * Una celda que empieza con = + - @ (o tab / retorno) se ejecutaría como
 * fórmula al pegarla o abrirla: se le antepone un apóstrofo para que quede texto.
 */
const sinFormula = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

/** Del más viejo al más nuevo, como se completa la planilla. */
function filasPlanilla(entradas: EntradaHora[]): string[][] {
  return [...entradas]
    .sort((a, b) => a.work_date.localeCompare(b.work_date) || a.start_time.localeCompare(b.start_time))
    .map((e) => [
      diaPlanilla(e.work_date),
      horaValida(e.start_time) ?? e.start_time,
      horaValida(e.end_time) ?? e.end_time,
      horasTexto(e.minutes),
      e.notes,
    ]);
}

/**
 * Filas separadas por tabulaciones, sin encabezado: se pegan directo en la
 * planilla de Google Sheets parado en la primera celda libre de "Dia".
 */
export function paraPegarEnSheets(entradas: EntradaHora[]): string {
  return filasPlanilla(entradas)
    .map((fila) => fila.map((c) => sinFormula(c.replace(/[\t\r\n]+/g, " ").trim())).join("\t"))
    .join("\n");
}

/** CSV con encabezado (UTF-8 con BOM, para que Excel respete los acentos). */
export function csvPlanilla(entradas: EntradaHora[], conPersona: boolean): string {
  const celda = (v: string) => {
    const segura = sinFormula(v);
    return /[",\n\r]/.test(segura) ? `"${segura.replace(/"/g, '""')}"` : segura;
  };
  const orden = [...entradas].sort(
    (a, b) => a.work_date.localeCompare(b.work_date) || a.start_time.localeCompare(b.start_time),
  );
  const encabezado = conPersona ? ["Persona", ...COLUMNAS_PLANILLA] : [...COLUMNAS_PLANILLA];
  const filas = filasPlanilla(orden).map((f, i) => (conPersona ? [orden[i].user_name, ...f] : f));
  return `﻿${[encabezado, ...filas].map((f) => f.map(celda).join(",")).join("\r\n")}\r\n`;
}
