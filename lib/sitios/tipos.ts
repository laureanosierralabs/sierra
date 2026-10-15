import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Proyectos conectados: tipos y reglas puras (sin base), compartidas por el
 * endpoint de ingesta, el de visitas, el panel y el kit.
 */

export interface SitioConectado {
  id: string;
  client_id: string;
  name: string;
  domain: string | null;
  site_key: string;
  last_event_at: string | null;
  created_at: string;
}

export interface RutaDescubierta {
  path: string;
  last_seen: string | null;
  visitors: number;
  conversions: number;
}

/* ───────────── Rutas ───────────── */

/**
 * Lleva una ruta a su forma canónica para que /registro, /registro/ y
 * /registro?utm_source=x cuenten como la misma landing. Acepta también una
 * URL completa (se queda con la ruta). Null si no es una ruta válida.
 */
export function normalizarRuta(entrada: unknown): string | null {
  if (typeof entrada !== "string") return null;
  let ruta = entrada.trim();
  if (ruta === "") return null;
  if (/^https?:\/\//i.test(ruta)) {
    try {
      ruta = new URL(ruta).pathname;
    } catch {
      return null;
    }
  }
  ruta = ruta.split(/[?#]/)[0].replace(/\/{2,}/g, "/");
  if (!ruta.startsWith("/")) return null;
  if (ruta.length > 1) ruta = ruta.replace(/\/+$/, "");
  if (ruta.length > 200 || /[\s<>"'`]/.test(ruta)) return null;
  return ruta || "/";
}

/* ───────────── Landing de lanzamiento desde un proyecto ───────────── */

/** Hostname sin "www." ni punto final; acepta un dominio pelado o una URL. */
function host(valor: string): string | null {
  const v = valor.trim();
  try {
    return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return null;
  }
}

/** URL http(s) válida y normalizada, o null (mismo criterio que los links cargados a mano). */
function urlValida(valor: string | null): string | null {
  if (!valor?.trim()) return null;
  try {
    const u = new URL(valor.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export interface LandingSugerida {
  name: string;
  url: string | null;
  site_id: string | null;
  path: string | null;
}

/**
 * Arma la landing de un lanzamiento a partir de un proyecto ya cargado: el
 * nombre sin el sufijo del cliente ("Activación v1 | Aida Qui" → "Activación
 * v1") y, si su URL cae en el dominio de un proyecto conectado, ese proyecto y
 * la ruta. Si el proyecto conectado no tiene dominio cargado, se usa solo
 * cuando ya registró visitas en esa misma ruta: nunca se adivina, porque una
 * landing mal asignada mostraría números de otra. Lo demás se completa a mano.
 */
export function landingDesdeProyecto(
  proyecto: { name: string; site_url: string | null },
  sitios: { id: string; domain: string | null; rutas?: string[] }[],
): LandingSugerida {
  const name = proyecto.name.split(" | ")[0].trim() || proyecto.name.trim();
  const url = urlValida(proyecto.site_url);
  if (!url) return { name, url: null, site_id: null, path: null };

  const dominio = host(url);
  const path = normalizarRuta(url);
  const sitio =
    sitios.find((s) => s.domain && host(s.domain) === dominio) ??
    sitios.find((s) => !s.domain && path && s.rutas?.includes(path));
  return { name, url, site_id: sitio && path ? sitio.id : null, path: sitio && path ? path : null };
}

/* ───────────── Firma de las conversiones ───────────── */

/** Antigüedad máxima aceptada de una conversión firmada (contra reenvíos). */
export const VENTANA_FIRMA_MS = 5 * 60_000;

/**
 * Firma del kit: HMAC-SHA256 en hex de `${timestamp}.${cuerpo}` con el secreto
 * del proyecto. El timestamp entra en la firma: un pedido capturado no se
 * puede reenviar más tarde con otra fecha.
 */
export function firmarIngesta(secreto: string, timestamp: string, cuerpo: string): string {
  return createHmac("sha256", secreto).update(`${timestamp}.${cuerpo}`).digest("hex");
}

export function firmaIngestaValida(
  secreto: string,
  timestamp: string | null,
  cuerpo: string,
  recibida: string | null,
  ahora: number = Date.now(),
): boolean {
  if (!timestamp || !recibida || !/^\d{10,13}$/.test(timestamp)) return false;
  const ms = timestamp.length === 13 ? Number(timestamp) : Number(timestamp) * 1000;
  if (Math.abs(ahora - ms) > VENTANA_FIRMA_MS) return false;
  const esperada = Buffer.from(firmarIngesta(secreto, timestamp, cuerpo));
  const dada = Buffer.from(recibida);
  return esperada.length === dada.length && timingSafeEqual(esperada, dada);
}

/* ───────────── Validación de lo que manda el proyecto ───────────── */

export const TIPOS_CONVERSION = ["lead", "purchase"] as const;
export type TipoConversion = (typeof TIPOS_CONVERSION)[number];

export interface ConversionEntrante {
  kind: TipoConversion;
  eventId: string;
  path: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  amount: number | null;
  currency: string | null;
  occurredAt: string;
  utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null };
}

const corto = (v: unknown, max: number): string | null => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = String(v).trim().slice(0, max);
  return s === "" ? null : s;
};

/* Mismo saneado que las visitas: el UTM lo escribe quien arma el link. */
const utm = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const limpio = v.replace(/[^\p{L}\p{N} _.\-|]/gu, "").trim().slice(0, 80);
  return limpio === "" ? null : limpio;
};

/**
 * Valida y normaliza una conversión. Devuelve el motivo si no sirve: el
 * proyecto lo recibe en la respuesta y queda en su log, que es donde hace
 * falta para corregir la integración.
 */
export function validarConversion(
  datos: unknown,
  ahora: Date = new Date(),
): { ok: true; conversion: ConversionEntrante } | { ok: false; motivo: string } {
  if (!datos || typeof datos !== "object") return { ok: false, motivo: "El cuerpo tiene que ser un objeto JSON" };
  const d = datos as Record<string, unknown>;

  if (!TIPOS_CONVERSION.includes(d.type as TipoConversion)) {
    return { ok: false, motivo: 'type tiene que ser "lead" o "purchase"' };
  }
  const kind = d.type as TipoConversion;

  const eventId = corto(d.id, 120);
  if (!eventId) return { ok: false, motivo: "Falta id (único por envío: un reintento con el mismo id no duplica)" };

  const email = corto(d.email, 254)?.toLowerCase() ?? null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, motivo: "email inválido" };
  if (kind === "lead" && !email) return { ok: false, motivo: "Un lead necesita email" };

  let amount: number | null = null;
  if (d.amount !== undefined && d.amount !== null && d.amount !== "") {
    amount = Number(d.amount);
    if (!Number.isFinite(amount) || amount < 0) return { ok: false, motivo: "amount inválido" };
    amount = Math.round(amount * 100) / 100;
  }
  if (kind === "purchase" && amount === null) return { ok: false, motivo: "Una compra necesita amount" };

  // Se valida el valor entero antes de normalizar: recortar primero haría
  // pasar "dolares" como "DOL".
  const currency = corto(d.currency, 40)?.toUpperCase() ?? null;
  if (currency && !/^[A-Z]{3}$/.test(currency)) return { ok: false, motivo: "currency tiene que ser un código de 3 letras" };

  // occurred_at opcional: si no viene o es absurda, cuenta el momento de llegada.
  let occurredAt = ahora.toISOString();
  if (typeof d.occurred_at === "string") {
    const f = new Date(d.occurred_at);
    const desfase = ahora.getTime() - f.getTime();
    if (!Number.isNaN(f.getTime()) && desfase > -5 * 60_000 && desfase < 30 * 86_400_000) {
      occurredAt = f.toISOString();
    }
  }

  const u = (d.utm ?? {}) as Record<string, unknown>;
  return {
    ok: true,
    conversion: {
      kind,
      eventId,
      path: normalizarRuta(d.path),
      email,
      name: corto(d.name, 160),
      phone: corto(d.phone, 40),
      amount,
      currency,
      occurredAt,
      utm: {
        source: utm(u.utm_source ?? u.source),
        medium: utm(u.utm_medium ?? u.medium),
        campaign: utm(u.utm_campaign ?? u.campaign),
        content: utm(u.utm_content ?? u.content),
      },
    },
  };
}
