import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Motor de escritura al disco. Vive solo en el servidor (Next corre local,
 * tiene acceso al filesystem). Misma fuente de verdad que la lectura:
 * escribe los mismos archivos que el dashboard lee.
 */

export const RAIZ_CONTEXTO = path.join(process.cwd(), "..", "contexto");
export const ARCHIVO_FINANZAS = path.join(
  process.cwd(),
  "..",
  "finanzas",
  "movimientos.json",
);

// ─── JSON (finanzas) ────────────────────────────────────────────────

interface DocFinanzas {
  _doc?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  movimientos: any[];
}

export function leerFinanzas(): DocFinanzas {
  const raw = fs.readFileSync(ARCHIVO_FINANZAS, "utf8");
  return JSON.parse(raw) as DocFinanzas;
}

export function escribirFinanzas(doc: DocFinanzas): void {
  fs.writeFileSync(ARCHIVO_FINANZAS, JSON.stringify(doc, null, 2) + "\n", "utf8");
}

// ─── Markdown (contexto) ────────────────────────────────────────────

/**
 * Actualiza SOLO los campos indicados del frontmatter de un .md, dejando
 * intacto todo el cuerpo (bitácora, decisiones, notas escritas a mano).
 * Esta es la parte delicada: nunca reescribe el texto libre.
 */
export function actualizarFrontmatter(
  archivo: string,
  cambios: Record<string, string | string[] | undefined>,
): void {
  const abs = resolverSeguro(archivo);
  const raw = fs.readFileSync(abs, "utf8");
  const parsed = matter(raw);

  for (const [clave, valor] of Object.entries(cambios)) {
    if (valor === undefined) continue;
    parsed.data[clave] = valor;
  }
  parsed.data.actualizado = hoyISO();

  // matter.stringify reserializa el frontmatter y RESPETA el cuerpo tal cual.
  const salida = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(abs, salida, "utf8");
}

/**
 * Reemplaza el contenido de una sección `## Titulo` sin tocar las demás.
 * Para campos como "Próximo paso" o "Estado actual" que son de una línea
 * o un párrafo. NO toca bitácora ni decisiones (esas se agregan, no se pisan).
 */
export function reemplazarSeccion(
  archivo: string,
  titulo: string,
  contenido: string,
): void {
  const abs = resolverSeguro(archivo);
  const raw = fs.readFileSync(abs, "utf8");
  const parsed = matter(raw);

  const re = new RegExp(
    `(^## ${escaparRegex(titulo)}\\s*$)([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`,
    "im",
  );
  const nuevoCuerpo = parsed.content.match(re)
    ? parsed.content.replace(re, `$1\n${contenido.trim()}\n\n`)
    : `${parsed.content.trimEnd()}\n\n## ${titulo}\n${contenido.trim()}\n`;

  parsed.data.actualizado = hoyISO();
  fs.writeFileSync(abs, matter.stringify(nuevoCuerpo, parsed.data), "utf8");
}

/**
 * Agrega una línea al TOPE de una sección de lista (bitácora, decisiones).
 * Nunca borra lo anterior — solo suma arriba, más nuevo primero.
 */
export function anteponerEnSeccion(
  archivo: string,
  titulo: string,
  linea: string,
): void {
  const abs = resolverSeguro(archivo);
  const raw = fs.readFileSync(abs, "utf8");
  const parsed = matter(raw);
  const entrada = `${hoyISO()} — ${linea.trim()}`;

  const re = new RegExp(
    `(^## ${escaparRegex(titulo)}\\s*$\\n)([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`,
    "im",
  );
  const nuevoCuerpo = parsed.content.match(re)
    ? parsed.content.replace(re, `$1${entrada}\n$2`)
    : `${parsed.content.trimEnd()}\n\n## ${titulo}\n${entrada}\n`;

  parsed.data.actualizado = hoyISO();
  fs.writeFileSync(abs, matter.stringify(nuevoCuerpo, parsed.data), "utf8");
}

export function crearArchivoContexto(archivo: string, contenido: string): void {
  const abs = resolverSeguro(archivo);
  if (fs.existsSync(abs)) {
    throw new Error(`Ya existe un archivo en ${archivo}`);
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contenido, "utf8");
}

// ─── Utilidades ─────────────────────────────────────────────────────

/** Impide escapar de la carpeta contexto/ (path traversal). */
function resolverSeguro(archivoRelativo: string): string {
  const abs = path.resolve(RAIZ_CONTEXTO, archivoRelativo);
  if (!abs.startsWith(RAIZ_CONTEXTO)) {
    throw new Error("Ruta fuera de contexto/ — rechazada");
  }
  return abs;
}

export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
