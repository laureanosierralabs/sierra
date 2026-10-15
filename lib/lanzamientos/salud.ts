/**
 * Salud de las landings de un lanzamiento: qué se revisa y cómo se lee el
 * resultado. Lógica pura (testeable); los pedidos HTTP viven en
 * lib/sitios/pedir-seguro.ts y las consultas, en la server action.
 */

export type EstadoChequeo = "ok" | "aviso" | "error";

export interface Chequeo {
  id: string;
  etiqueta: string;
  estado: EstadoChequeo;
  detalle: string;
}

export interface SaludLanding {
  id: string;
  name: string;
  url: string | null;
  chequeos: Chequeo[];
}

const PESO: Record<EstadoChequeo, number> = { ok: 0, aviso: 1, error: 2 };

/** El peor estado manda: una landing con un error está en rojo. */
export function estadoGeneral(chequeos: Pick<Chequeo, "estado">[]): EstadoChequeo {
  return chequeos.reduce<EstadoChequeo>((peor, c) => (PESO[c.estado] > PESO[peor] ? c.estado : peor), "ok");
}

export interface LecturaHtml {
  /** Tiene el script suelto de visitas (/t.js) con la clave de ESTA landing. */
  scriptVisitas: boolean;
  titulo: string | null;
  /** Imagen para compartir (og:image) declarada. */
  imagen: boolean;
}

/** Lo que se analiza del HTML: alcanza con el <head>, y con tope (el HTML lo escribe un tercero). */
const MAX_ANALISIS = 300_000;

/**
 * `content` de un <meta property|name="…">. Recorre las etiquetas una por una
 * con regex acotadas: una expresión sobre todo el documento es cuadrática con
 * un HTML armado a propósito (`<meta <meta <meta…`) y trabaría el servidor.
 */
function metaContenido(html: string, propiedad: string): string | null {
  for (const [etiqueta] of html.matchAll(/<meta\b[^>]{0,1000}>/gi)) {
    const clave = etiqueta.match(/\b(?:property|name)\s*=\s*["']([^"']{0,100})["']/i)?.[1];
    if (clave?.toLowerCase() !== propiedad) continue;
    const contenido = etiqueta.match(/\bcontent\s*=\s*["']([^"']{0,2000})["']/i)?.[1]?.trim();
    if (contenido) return contenido;
  }
  return null;
}

/** Lo que se puede saber de una landing mirando su HTML (sin ejecutar JavaScript). */
export function leerHtml(documento: string, trackKey: string | null): LecturaHtml {
  const html = documento.slice(0, MAX_ANALISIS);
  const titulo =
    metaContenido(html, "og:title") ?? html.match(/<title\b[^>]{0,200}>([^<]{0,500})<\/title>/i)?.[1]?.trim() ?? null;
  return {
    scriptVisitas: Boolean(trackKey) && html.includes("/t.js") && html.includes(String(trackKey)),
    titulo: titulo || null,
    imagen: Boolean(metaContenido(html, "og:image")),
  };
}

/* ───────────── Red ───────────── */

function ipv4Privada(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

/** IPv6 a sus 8 grupos de 16 bits (acepta la IPv4 final en puntos). Null si no es válida. */
function gruposIpv6(ip: string): number[] | null {
  let v = ip;
  const v4 = v.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const p = v4.slice(1).map(Number);
    if (p.some((n) => n > 255)) return null;
    const hex = (alto: number, bajo: number) => ((alto << 8) | bajo).toString(16);
    v = `${v.slice(0, -v4[0].length)}${hex(p[0], p[1])}:${hex(p[2], p[3])}`;
  }
  const partes = v.split("::");
  if (partes.length > 2) return null;
  const leer = (t: string) => (t ? t.split(":").map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN)) : []);
  const izq = leer(partes[0]);
  const der = partes.length === 2 ? leer(partes[1]) : [];
  const faltan = 8 - izq.length - der.length;
  if (partes.length === 1 ? faltan !== 0 : faltan < 1) return null;
  const grupos = [...izq, ...Array(partes.length === 2 ? faltan : 0).fill(0), ...der];
  return grupos.every((x) => Number.isInteger(x)) ? grupos : null;
}

const v4De = (alto: number, bajo: number) => `${alto >> 8}.${alto & 255}.${bajo >> 8}.${bajo & 255}`;

/**
 * IP a la que el panel no debe pedir nada: red interna, loopback, link-local
 * (metadatos de la nube), multicast, y cualquier IPv6 que lleve adentro una
 * IPv4 interna (mapeada, compatible, NAT64, 6to4). Ante la duda, true.
 */
export function ipPrivada(ip: string): boolean {
  const v = ip.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v)) return ipv4Privada(v);
  if (!v.includes(":")) return true;
  const g = gruposIpv6(v);
  if (!g) return true;

  const ceros = (desde: number, hasta: number) => g.slice(desde, hasta).every((x) => x === 0);
  // ::/128, ::1, ::ffff:a.b.c.d (mapeada), ::a.b.c.d (compatible).
  if (ceros(0, 5) && (g[5] === 0xffff || g[5] === 0)) {
    if (g[5] === 0 && g[6] === 0) return true; // :: y ::1 (y ::x chicos)
    return ipv4Privada(v4De(g[6], g[7]));
  }
  // 64:ff9b::/96 (NAT64): la IPv4 va al final.
  if (g[0] === 0x64 && g[1] === 0xff9b && ceros(2, 6)) return ipv4Privada(v4De(g[6], g[7]));
  // 2002::/16 (6to4): la IPv4 va en los grupos 1 y 2.
  if (g[0] === 0x2002) return ipv4Privada(v4De(g[1], g[2]));
  // fc00::/7 (privadas), fe80::/10 (link-local), fec0::/10 (site-local), ff00::/8 (multicast).
  return (
    (g[0] & 0xfe00) === 0xfc00 || (g[0] & 0xffc0) === 0xfe80 || (g[0] & 0xffc0) === 0xfec0 || (g[0] & 0xff00) === 0xff00
  );
}
