/**
 * La parte "propuesta" de una cotización: qué incluye el servicio, el tiempo
 * de entrega y las preguntas importantes. Lógica pura: la usan el editor (en
 * el navegador) y las acciones (que vuelven a validar todo).
 */

export interface PreguntaPropuesta {
  /** La pregunta, tal como la lee el cliente. */
  q: string;
  /** La respuesta. Varias líneas se muestran como lista. */
  a: string;
}

export interface ElementoBiblioteca {
  id: string;
  kind: "incluye" | "pregunta";
  title: string;
  body: string | null;
  position: number;
}

export const MAX_INCLUYE = 40;
export const MAX_PREGUNTAS = 15;
const MAX_TEXTO = 300;
const MAX_RESPUESTA = 2000;
const MAX_ENTREGA = 80;

const limpiar = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+\n/g, "\n").slice(0, max) : "");

/** "Este servicio incluye": textos no vacíos, sin repetir, con tope. */
export function validarIncluye(crudo: unknown): string[] {
  if (!Array.isArray(crudo)) return [];
  const vistos = new Set<string>();
  const lista: string[] = [];
  for (const v of crudo) {
    const texto = limpiar(v, MAX_TEXTO).replace(/\n+/g, " ");
    const clave = texto.toLowerCase();
    if (!texto || vistos.has(clave)) continue;
    vistos.add(clave);
    lista.push(texto);
    if (lista.length >= MAX_INCLUYE) break;
  }
  return lista;
}

/** "Importantes": preguntas con respuesta, sin repetir la pregunta, con tope. */
export function validarPreguntas(crudo: unknown): PreguntaPropuesta[] {
  if (!Array.isArray(crudo)) return [];
  const vistas = new Set<string>();
  const lista: PreguntaPropuesta[] = [];
  for (const v of crudo) {
    const fila = (v ?? {}) as Record<string, unknown>;
    const q = limpiar(fila.q, MAX_TEXTO).replace(/\n+/g, " ");
    const a = limpiar(fila.a, MAX_RESPUESTA);
    // Una respuesta hecha solo de viñetas ("-") no dice nada: se descarta.
    if (!q || !a || lineasDeRespuesta(a).length === 0 || vistas.has(q.toLowerCase())) continue;
    vistas.add(q.toLowerCase());
    lista.push({ q, a });
    if (lista.length >= MAX_PREGUNTAS) break;
  }
  return lista;
}

/** "Tiempo de entrega": texto corto o nada. */
export function validarEntrega(crudo: unknown): string | null {
  const t = limpiar(crudo, MAX_ENTREGA).replace(/\n+/g, " ");
  return t || null;
}

/** Una respuesta de varias líneas es una lista; de una sola, un párrafo. */
export function lineasDeRespuesta(a: string): string[] {
  return a
    .split("\n")
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);
}

/* ───────────── Plantillas y portfolio ───────────── */

export interface ItemPlantilla {
  title: string;
  detail: string | null;
  url: string | null;
  amount: number;
  is_extension: boolean;
}

export interface PlantillaCotizacion {
  id: string;
  name: string;
  service: string | null;
  currency: string;
  total_amount: number | null;
  items: ItemPlantilla[];
  includes: string[];
  faq: PreguntaPropuesta[];
  funnel: { tipo: string; etiqueta?: string }[];
  delivery_time: string | null;
  payment_terms: string | null;
}

export interface TrabajoPortfolio {
  id: string;
  title: string;
  image_url: string;
  link: string | null;
  position: number;
}

/** Link http(s) válido y normalizado, o null. */
export function urlHttp(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  try {
    const u = new URL(valor.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
