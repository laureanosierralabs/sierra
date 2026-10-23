/**
 * Lo que pasa después del registro y cerca de la venta: clic al grupo de
 * WhatsApp, ingreso al webinar con el link personal y clics al checkout.
 * Lógica pura (sin I/O): la usan el endpoint público, la lectura de datos y
 * el panel, que también lo ve el cliente en el portal.
 */
import { normalizarEmail } from "@/lib/lanzamientos/listas";
import { conversion, type PaginaLanzamiento, type Registro } from "@/lib/lanzamientos/tipos";
import type { Rango } from "@/lib/lanzamientos/vista";
import { normalizarRuta } from "@/lib/sitios/tipos";

/* ───────────── Evento que manda la landing (POST /api/e) ───────────── */

export const TIPOS_EVENTO_SITIO = ["whatsapp_click", "checkout_click"] as const;
export type TipoEventoSitio = (typeof TIPOS_EVENTO_SITIO)[number];

export interface EventoSitioEntrante {
  kind: TipoEventoSitio;
  path: string;
  email: string | null;
  target: string | null;
  utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null };
}

/** Texto libre que manda el navegador: se limpia y se recorta. */
export function textoCorto(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const limpio = v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  return limpio === "" ? null : limpio;
}

/** UTM: letras, números y separadores comunes (igual que el conteo de visitas). */
const utm = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const limpio = v
    .replace(/[^\p{L}\p{N} _.\-|]/gu, "")
    .trim()
    .slice(0, 80);
  return limpio === "" ? null : limpio;
};

/**
 * Valida y normaliza el cuerpo del aviso. Null si no sirve (tipo desconocido,
 * ruta inválida): el endpoint lo descarta sin avisar. El email es opcional;
 * uno mal escrito se ignora, no invalida el evento.
 */
export function validarEventoSitio(datos: unknown): EventoSitioEntrante | null {
  const d = (datos ?? {}) as Record<string, unknown>;
  if (!TIPOS_EVENTO_SITIO.includes(d.k as TipoEventoSitio)) return null;
  const path = normalizarRuta(d.p);
  if (!path) return null;
  const u = (d.u ?? {}) as Record<string, unknown>;
  return {
    kind: d.k as TipoEventoSitio,
    path,
    email: normalizarEmail(d.e),
    target: textoCorto(d.t, 120),
    utm: { source: utm(u.utm_source), medium: utm(u.utm_medium), campaign: utm(u.utm_campaign), content: utm(u.utm_content) },
  };
}

/* ───────────── Datos leídos para el panel ───────────── */

export interface EventoSitio {
  site_id: string;
  kind: TipoEventoSitio;
  path: string;
  email: string | null;
  target: string | null;
  day: string;
}

export interface EventoWebinar {
  email: string;
  day: string;
}

/** Lo que leyó la base. Si falta la migración, el lanzamiento trae `null` y no se muestra nada. */
export interface DatosDespues {
  eventos: EventoSitio[];
  webinar: EventoWebinar[];
}

/* ───────────── Cruce con los registros ───────────── */

export interface Cruce {
  /** Personas distintas registradas (por email). */
  total: number;
  /** De ellas, cuántas hicieron la acción. */
  cruzan: number;
  /** Porcentaje con un decimal; null si no hay registrados. */
  porcentaje: number | null;
  /** Una fila por registrado (el más antiguo) que NO hizo la acción. */
  faltan: Registro[];
}

/**
 * Cruza los registrados con los emails de un evento. Cada persona cuenta una
 * vez aunque se haya registrado en varias landings o el email venga con otra
 * capitalización. Un evento de alguien que no está registrado no suma.
 */
export function cruzarRegistrados(registros: Registro[], emailsEvento: Iterable<string | null>): Cruce {
  const hicieron = new Set<string>();
  for (const e of emailsEvento) {
    const n = normalizarEmail(e);
    if (n) hicieron.add(n);
  }

  const vistos = new Set<string>();
  const faltan: Registro[] = [];
  let cruzan = 0;
  // Del más antiguo al más nuevo: la fila que queda es la del primer registro.
  const orden = [...registros].sort((a, b) => a.registered_at.localeCompare(b.registered_at));
  for (const r of orden) {
    const email = normalizarEmail(r.email);
    if (!email || vistos.has(email)) continue;
    vistos.add(email);
    if (hicieron.has(email)) cruzan++;
    else faltan.push(r);
  }
  return { total: vistos.size, cruzan, porcentaje: conversion(cruzan, vistos.size), faltan };
}

/* ───────────── Clics al checkout ───────────── */

export interface ResumenCheckout {
  total: number;
  /** Por botón o destino, de más a menos clics. `null` = el clic no dijo cuál. */
  porTarget: { target: string | null; clics: number }[];
  /** Compras medidas en el mismo recorte. */
  compras: number;
  /** Compras sobre clics; null si no hay compras ni clics para medirlo. */
  tasaCompra: number | null;
}

/**
 * Clics al checkout de las landings pedidas, dentro del período. Solo cuentan
 * los de rutas de landings del lanzamiento (`sitio|ruta`): el proyecto puede
 * tener otras páginas de venta que no son de este lanzamiento.
 */
export function resumirCheckout(
  eventos: EventoSitio[],
  paginas: Pick<PaginaLanzamiento, "site_id" | "path">[],
  rango: Rango | null,
  compras: number,
): ResumenCheckout {
  const rutas = new Set(paginas.filter((p) => p.site_id && p.path).map((p) => `${p.site_id}|${p.path}`));
  const clics = eventos.filter(
    (e) =>
      e.kind === "checkout_click" &&
      rutas.has(`${e.site_id}|${e.path}`) &&
      (!rango || (e.day >= rango.desde && e.day <= rango.hasta)),
  );

  const porTarget = new Map<string | null, number>();
  for (const c of clics) porTarget.set(c.target, (porTarget.get(c.target) ?? 0) + 1);

  return {
    total: clics.length,
    porTarget: [...porTarget.entries()]
      .map(([target, n]) => ({ target, clics: n }))
      // A igual cantidad, por nombre y con "sin botón" al final.
      .sort(
        (a, b) =>
          b.clics - a.clics ||
          Number(a.target === null) - Number(b.target === null) ||
          (a.target ?? "").localeCompare(b.target ?? "", "es"),
      ),
    compras,
    tasaCompra: compras > 0 ? conversion(compras, clics.length) : null,
  };
}
