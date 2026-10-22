/**
 * Lo que se le entrega al cliente en su portal: los entregables de cada
 * landing y los videos de soporte. Lógica pura (validación y forma), la usan
 * el panel (que carga) y el portal (que muestra).
 */

/** Versiones de la página en PDF, por dispositivo. */
export const VERSIONES_PDF = [
  { clave: "pdf_desktop", etiqueta: "Ordenador" },
  { clave: "pdf_mobile", etiqueta: "Celular" },
  { clave: "pdf_tablet", etiqueta: "Tablet" },
] as const;

/** Recursos descargables de siempre. */
export const RECURSOS = [
  { clave: "copy", etiqueta: "Copy" },
  { clave: "archivos", etiqueta: "Archivos utilizados" },
  { clave: "tipografias", etiqueta: "Tipografías" },
  { clave: "sello", etiqueta: "Sello de la página" },
] as const;

type ClaveFija = (typeof VERSIONES_PDF)[number]["clave"] | (typeof RECURSOS)[number]["clave"];

export type Entregables = Partial<Record<ClaveFija, string>> & {
  /** Recursos extra con su nombre ("Banco de imágenes", "Guía de marca"). */
  extras?: { etiqueta: string; url: string }[];
};

const CLAVES: ClaveFija[] = [...VERSIONES_PDF.map((v) => v.clave), ...RECURSOS.map((r) => r.clave)];
const MAX_EXTRAS = 8;

/** Link http(s) válido y normalizado, o null. */
function link(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  try {
    const u = new URL(valor.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Solo links http(s) en las claves conocidas, y extras con nombre. */
export function validarEntregables(crudo: unknown): Entregables {
  if (!crudo || typeof crudo !== "object" || Array.isArray(crudo)) return {};
  const fila = crudo as Record<string, unknown>;
  const e: Entregables = {};
  for (const clave of CLAVES) {
    const url = link(fila[clave]);
    if (url) e[clave] = url;
  }
  if (Array.isArray(fila.extras)) {
    const extras = fila.extras
      .map((x) => {
        const f = (x ?? {}) as Record<string, unknown>;
        const etiqueta = typeof f.etiqueta === "string" ? f.etiqueta.trim().slice(0, 40) : "";
        const url = link(f.url);
        return etiqueta && url ? { etiqueta, url } : null;
      })
      .filter((x): x is { etiqueta: string; url: string } => x !== null)
      .slice(0, MAX_EXTRAS);
    if (extras.length) e.extras = extras;
  }
  return e;
}

export const tieneEntregables = (e: Entregables) =>
  CLAVES.some((c) => Boolean(e[c])) || (e.extras?.length ?? 0) > 0;

/* ───────────── Videos de soporte ───────────── */

export interface VideoSoporte {
  id: string;
  title: string;
  url: string;
  position: number;
}

/** Id de un video de YouTube (watch, youtu.be, shorts, embed), o null. */
export function idYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com") {
      id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null;
    }
    return id && /^[\w-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Miniatura del video si es de YouTube; si no, la tarjeta va sin imagen. */
export function miniaturaVideo(url: string): string | null {
  const id = idYoutube(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
