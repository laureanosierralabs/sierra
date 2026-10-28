/**
 * Agrupaciones del panel de lanzamientos que no dependen de la base: el
 * tráfico sin UTM por origen (referrer normalizado a un canal legible) y el
 * ranking de registros por campaña / anuncio. Puras: se prueban en node.
 */
import type { Compra, Registro, VisitaReferrer } from "@/lib/lanzamientos/tipos";

export const ORIGEN_DIRECTO = "Directo (sin referrer)";

const EMAIL_APPS = new Set(["com.google.android.gm", "mail.google.com", "mail.yahoo.com"]);
const BUSCADORES_APPS = new Set([
  "com.google.android.googlequicksearchbox",
  "bing.com",
  "duckduckgo.com",
  "search.brave.com",
  "search.yahoo.com",
  "ecosia.org",
]);

/** `host` es el dominio o `sub.host`. */
const esDominio = (h: string, dominio: string) => h === dominio || h.endsWith(`.${dominio}`);

/**
 * Canal legible de un referrer_host. Vacío = directo; lo que no se reconoce
 * queda como el dominio mismo (sin `www.`).
 */
export function normalizarOrigen(referrer: string | null | undefined): string {
  let h = (referrer ?? "").trim().toLowerCase();
  if (!h) return ORIGEN_DIRECTO;
  // Por si llegara una URL entera: solo importa el dominio.
  h = h.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "");
  if (!h) return ORIGEN_DIRECTO;

  if (esDominio(h, "instagram.com")) return "Instagram";
  if (esDominio(h, "facebook.com")) return "Facebook";
  if (esDominio(h, "youtube.com") || h === "youtu.be") return "YouTube";
  if (esDominio(h, "threads.com") || esDominio(h, "threads.net")) return "Threads";
  if (esDominio(h, "manychat.com")) return "ManyChat";

  // Mail antes que buscadores: mail.google.com también cuelga de google.*.
  if (
    EMAIL_APPS.has(h) ||
    /^outlook\.[a-z.]+$/.test(h) ||
    esDominio(h, "outlook.live.com") ||
    esDominio(h, "outlook.office.com") ||
    esDominio(h, "outlook.office365.com") ||
    /^(webmail|mail)\./.test(h)
  ) {
    return "Email";
  }

  if (BUSCADORES_APPS.has(h) || /^(?:[a-z0-9-]+\.)*google\.[a-z]{2,3}(?:\.[a-z]{2})?$/.test(h)) {
    return "Buscadores";
  }
  return h;
}

export interface OrigenSinUtm {
  origen: string;
  visitantes: number;
}

/** Visitantes por canal, de mayor a menor. Ignora filas sin visitantes. */
export function resumirOrigenes(referrers: Pick<VisitaReferrer, "referrer_host" | "visitors">[]): OrigenSinUtm[] {
  const canales = new Map<string, number>();
  for (const r of referrers) {
    const n = Number(r.visitors);
    if (!(n > 0)) continue;
    const origen = normalizarOrigen(r.referrer_host);
    canales.set(origen, (canales.get(origen) ?? 0) + n);
  }
  return [...canales.entries()]
    .map(([origen, visitantes]) => ({ origen, visitantes }))
    .sort((a, b) => b.visitantes - a.visitantes || a.origen.localeCompare(b.origen, "es"));
}

/* ───────────── Registros por campaña y anuncio ───────────── */

export interface FilaRanking {
  /** Valor tal cual llegó (a menudo un id de Meta); null = sin valor. */
  valor: string | null;
  registros: number;
  /** Del total de registros, con un decimal. */
  porcentaje: number;
}

export interface RankingUtm {
  filas: FilaRanking[];
  /** Algún registro trae valor: si ninguno, el ranking no dice nada. */
  hayValor: boolean;
}

export const TOPE_RANKING = 10;

/** Registros agrupados por `utm_campaign` o `utm_content`, top N. */
export function rankingUtm(
  registros: Pick<Registro, "utm_campaign" | "utm_content">[],
  campo: "utm_campaign" | "utm_content",
  tope: number = TOPE_RANKING,
): RankingUtm {
  const grupos = new Map<string | null, number>();
  for (const r of registros) {
    const v = r[campo]?.trim() || null;
    grupos.set(v, (grupos.get(v) ?? 0) + 1);
  }
  const total = registros.length;
  const filas = [...grupos.entries()]
    .map(([valor, n]) => ({
      valor,
      registros: n,
      porcentaje: total > 0 ? Math.round((n / total) * 1000) / 10 : 0,
    }))
    // A igual cantidad, lo que no tiene valor va después.
    .sort(
      (a, b) =>
        b.registros - a.registros ||
        Number(a.valor === null) - Number(b.valor === null) ||
        (a.valor ?? "").localeCompare(b.valor ?? ""),
    )
    .slice(0, tope);
  return { filas, hayValor: [...grupos.keys()].some((k) => k !== null) };
}

/* ───────────── Ventas por campaña y anuncio ───────────── */

export type IngresosPorMoneda = [string, number][];

/** Suma por moneda (USD con ARS no se mezclan); ignora ventas sin monto. */
export function sumarPorMoneda(compras: Pick<Compra, "amount" | "currency">[]): IngresosPorMoneda {
  const total = new Map<string, number>();
  for (const c of compras) {
    if (c.amount === null) continue;
    const moneda = c.currency ?? "—";
    total.set(moneda, (total.get(moneda) ?? 0) + c.amount);
  }
  return [...total.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export interface FilaVentas {
  /** Valor tal cual llegó; null = la venta no trae UTM. */
  valor: string | null;
  ventas: number;
  ingresos: IngresosPorMoneda;
  /** Del total de ventas, con un decimal. */
  porcentaje: number;
}

export interface RankingVentas {
  filas: FilaVentas[];
  /** Alguna venta trae valor: si ninguna, el ranking no dice nada. */
  hayValor: boolean;
}

/** Ventas agrupadas por `utm_campaign` o `utm_content`, top N (por cantidad y, a igual cantidad, por ingreso). */
export function rankingVentasUtm(
  compras: Pick<Compra, "amount" | "currency" | "utm_campaign" | "utm_content">[],
  campo: "utm_campaign" | "utm_content",
  tope: number = TOPE_RANKING,
): RankingVentas {
  const grupos = new Map<string | null, typeof compras>();
  for (const c of compras) {
    const v = c[campo]?.trim() || null;
    grupos.set(v, [...(grupos.get(v) ?? []), c]);
  }
  const total = compras.length;
  const suma = (f: { ingresos: IngresosPorMoneda }) => f.ingresos.reduce((t, [, n]) => t + n, 0);
  const filas = [...grupos.entries()]
    .map(([valor, lista]) => ({
      valor,
      ventas: lista.length,
      ingresos: sumarPorMoneda(lista),
      porcentaje: total > 0 ? Math.round((lista.length / total) * 1000) / 10 : 0,
    }))
    .sort(
      (a, b) =>
        b.ventas - a.ventas ||
        Number(a.valor === null) - Number(b.valor === null) ||
        suma(b) - suma(a) ||
        (a.valor ?? "").localeCompare(b.valor ?? ""),
    )
    .slice(0, tope);
  return { filas, hayValor: [...grupos.keys()].some((k) => k !== null) };
}

/**
 * Un `utm_content` de Meta suele ser `Nombre del anuncio|123456789012`: el
 * nombre es lo que se lee y el id (solo dígitos) queda como dato secundario.
 * Sin ese formato, todo el valor es el nombre.
 */
export function partirAnuncio(valor: string): { nombre: string; id: string | null } {
  const i = valor.lastIndexOf("|");
  if (i > 0) {
    const id = valor.slice(i + 1).trim();
    const nombre = valor.slice(0, i).trim();
    if (nombre && /^\d{6,}$/.test(id)) return { nombre, id };
  }
  return { nombre: valor.trim(), id: null };
}
