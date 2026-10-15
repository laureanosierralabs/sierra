/**
 * Importación de registros desde un CSV (exportado de la Supabase del
 * cliente, de MailerLite, de un Google Sheet). Lógica pura: corre en el
 * navegador para armar la vista previa y el servidor vuelve a validar cada
 * fila antes de guardarla.
 */

/** Tope por importación: lo que entra cómodo en una server action (1 MB). */
export const TOPE_IMPORTACION = 3000;
/** Tamaño máximo del envío (los datos extra pueden pesar más que las filas). */
export const TOPE_ENVIO_BYTES = 900_000;
/** Archivo más grande que esto ni se lee: congelaría el navegador. */
export const TOPE_ARCHIVO_BYTES = 5 * 1024 * 1024;

export interface RegistroImportado {
  email: string;
  name: string | null;
  phone: string | null;
  /** ISO; null si el CSV no trae fecha (se usa la del momento de importar). */
  registered_at: string | null;
  utm_source: string | null;
  /** Columnas del CSV que no son las conocidas (respuestas de un formulario, etc.). */
  extra: Record<string, string>;
}

type CampoBase = Exclude<keyof RegistroImportado, "extra">;

/**
 * CSV a filas. Soporta comillas (con "" adentro), saltos de línea dentro de
 * comillas, BOM, CRLF y separador "," o ";" (Excel en español usa ";").
 */
export function parsearCsv(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, "");
  // Separador: el que más aparece en el encabezado, fuera de comillas.
  const primera = (limpio.split(/\r?\n/, 1)[0] ?? "").replace(/"[^"]*"/g, "");
  const cuenta = (c: string) => primera.split(c).length - 1;
  const sep = [",", ";", "\t"].reduce((mejor, c) => (cuenta(c) > cuenta(mejor) ? c : mejor), ",");

  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let comillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (comillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        comillas = false;
      } else {
        campo += c;
      }
    } else if (c === '"') {
      comillas = true;
    } else if (c === sep) {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((v) => v.trim() !== ""));
}

/* Por campo, patrones en orden de preferencia: gana el primero que encuentra columna. */
const COLUMNAS: Record<CampoBase, RegExp[]> = {
  email: [/^(e-?mail|correo|mail)/],
  name: [/^(name|nombre|full.?name|nombre.?completo|first.?name)/],
  phone: [/(phone|tel[eé]fono|telefono|celular|whats.?app|movil|m[oó]vil)/],
  registered_at: [
    /^(created|registr|subscribed|fecha_de_registro|fecha_registro|signup)/,
    /^(fecha|date|timestamp|marca_temporal)/,
  ],
  utm_source: [/^utm.?source/],
};
/** "updated_at" o "unsubscribed_at" no son la fecha de registro. */
const NO_ES_FECHA_DE_REGISTRO = /(updated|unsubscribed|deleted|nacimiento|birth)/;

const normalizarEncabezado = (h: string) =>
  h.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_");

/** Columna del CSV para cada campo (-1 si no está). La primera que coincide gana. */
export function detectarColumnas(encabezados: string[]): Record<CampoBase, number> {
  const norm = encabezados.map(normalizarEncabezado);
  const indice = (patrones: RegExp[], excluir: number[] = [], descartar?: RegExp) => {
    for (const re of patrones) {
      const i = norm.findIndex((h, j) => !excluir.includes(j) && re.test(h) && !descartar?.test(h));
      if (i >= 0) return i;
    }
    return -1;
  };
  const email = indice(COLUMNAS.email);
  return {
    email,
    name: indice(COLUMNAS.name, [email]),
    phone: indice(COLUMNAS.phone, [email]),
    registered_at: indice(COLUMNAS.registered_at, [email], NO_ES_FECHA_DE_REGISTRO),
    utm_source: indice(COLUMNAS.utm_source),
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fecha a ISO. Acepta ISO ("2026-09-14T10:00:00Z", "2026-09-14 10:00:00") y
 * día/mes/año ("14/09/2026 10:00"), que es como la exporta Sheets en español.
 * Sin zona horaria se toma la de Buenos Aires.
 */
export function fechaImportada(valor: string): string | null {
  const v = valor.trim();
  if (!v) return null;
  let iso: string | null = null;
  const dma = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dma) {
    const [, d, m, a, hh = "0", mm = "0", ss = "0"] = dma;
    // Un día que no existe (31/02) no se corre al mes siguiente: se descarta.
    const mediodia = new Date(Date.UTC(Number(a), Number(m) - 1, Number(d), 12));
    if (mediodia.getUTCMonth() !== Number(m) - 1 || mediodia.getUTCDate() !== Number(d)) return null;
    iso = `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:${ss.padStart(2, "0")}-03:00`;
  } else if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    // Postgres exporta "2026-09-14 10:00:00.123+00": la zona va como "+00:00".
    const base = v.replace(" ", "T").replace(/(:\d{2}(?:\.\d+)?[+-]\d{2})$/, "$1:00");
    iso = /T/.test(base) ? (/(Z|[+-]\d{2}:?\d{2})$/.test(base) ? base : `${base}-03:00`) : `${base}T00:00:00-03:00`;
  }
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  // Fuera de rango razonable: probablemente día y mes invertidos o basura.
  if (t < Date.parse("2015-01-01") || t > Date.now() + 86_400_000) return null;
  return new Date(t).toISOString();
}

const recortar = (v: string | undefined, max: number) => {
  const t = (v ?? "").trim();
  return t ? t.slice(0, max) : null;
};

/** Columnas extra (fuera de las conocidas) que se guardan por registro. */
export const EXTRA_MAX_CLAVES = 30;
const EXTRA_MAX_CLAVE = 60;
const EXTRA_MAX_VALOR = 500;

/** Deja solo pares texto → texto, con tope de cantidad y largo. */
export function extraValido(valor: unknown): Record<string, string> {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  const extra: Record<string, string> = {};
  for (const [clave, v] of Object.entries(valor as Record<string, unknown>)) {
    if (Object.keys(extra).length >= EXTRA_MAX_CLAVES) break;
    const k = clave.trim().slice(0, EXTRA_MAX_CLAVE);
    if (!k || k === "__proto__" || typeof v !== "string" || !v.trim()) continue;
    extra[k] = v.trim().slice(0, EXTRA_MAX_VALOR);
  }
  return extra;
}

/** Valida y normaliza una fila ya mapeada. Null si no sirve (sin email válido). */
export function registroValido(
  r: Partial<Record<CampoBase, unknown>> & { extra?: unknown },
): RegistroImportado | null {
  const email = typeof r.email === "string" ? r.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) return null;
  const texto = (v: unknown, max: number) => (typeof v === "string" ? recortar(v, max) : null);
  return {
    email,
    name: texto(r.name, 200),
    phone: texto(r.phone, 50),
    registered_at: typeof r.registered_at === "string" ? fechaImportada(r.registered_at) : null,
    utm_source: texto(r.utm_source, 100),
    extra: extraValido(r.extra),
  };
}

export interface ResultadoImportacion {
  registros: RegistroImportado[];
  columnas: Record<CampoBase, number>;
  encabezados: string[];
  /** Columnas que no son de las conocidas: se guardan como datos extra. */
  extras: string[];
  /** Filas sin email válido. */
  descartadas: number;
  /** Emails repetidos dentro del archivo (cuenta la primera aparición). */
  repetidos: number;
  /** Filas con fecha que no se pudo leer: quedan con la fecha de la importación. */
  sinFecha: number;
}

/* Columnas técnicas de una base que no le sirven a nadie al exportar. */
const NO_EXTRA = /^(id|uuid|updated_at|deleted_at|user_id|client_id)$/;

/** CSV completo a registros listos para importar. */
export function leerRegistros(texto: string): ResultadoImportacion {
  const [encabezados = [], ...filas] = parsearCsv(texto);
  const columnas = detectarColumnas(encabezados);
  const usadas = new Set(Object.values(columnas));
  const extras = encabezados
    .map((h, i) => ({ h: h.trim(), i }))
    .filter(({ h, i }) => h && !usadas.has(i) && !NO_EXTRA.test(normalizarEncabezado(h)))
    .slice(0, EXTRA_MAX_CLAVES);

  const vistos = new Set<string>();
  const registros: RegistroImportado[] = [];
  let descartadas = 0;
  let repetidos = 0;
  let sinFecha = 0;
  const celda = (fila: string[], i: number) => (i >= 0 ? fila[i] : undefined);
  for (const fila of filas) {
    const r = registroValido({
      email: celda(fila, columnas.email),
      name: celda(fila, columnas.name),
      phone: celda(fila, columnas.phone),
      registered_at: celda(fila, columnas.registered_at),
      utm_source: celda(fila, columnas.utm_source),
      extra: Object.fromEntries(extras.map(({ h, i }) => [h, fila[i] ?? ""])),
    });
    if (!r) {
      descartadas++;
      continue;
    }
    if (vistos.has(r.email)) {
      repetidos++;
      continue;
    }
    vistos.add(r.email);
    if (columnas.registered_at >= 0 && !r.registered_at) sinFecha++;
    registros.push(r);
  }
  return { registros, columnas, encabezados, extras: extras.map((e) => e.h), descartadas, repetidos, sinFecha };
}
