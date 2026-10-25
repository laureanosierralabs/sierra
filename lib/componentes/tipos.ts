/**
 * Biblioteca de componentes para landings: tipos, categorías y validación.
 *
 * Módulo puro (sin server-only ni acceso a datos) para poder usarlo desde el
 * cliente, las acciones y los tests.
 */

export const CATEGORIAS = [
  { slug: "botones", label: "Botones" },
  { slug: "hero", label: "Hero / portada" },
  { slug: "testimonios", label: "Testimonios" },
  { slug: "prueba-social", label: "Prueba social" },
  { slug: "formularios", label: "Formularios" },
  { slug: "precios", label: "Precios y ofertas" },
  { slug: "faq", label: "FAQ" },
  { slug: "cta", label: "Llamados a la acción" },
  { slug: "navegacion", label: "Navegación" },
  { slug: "footer", label: "Footer" },
  { slug: "tarjetas", label: "Tarjetas" },
  { slug: "listas", label: "Listas" },
  { slug: "contadores", label: "Contadores y timers" },
  { slug: "media", label: "Imágenes y video" },
  { slug: "fondos", label: "Fondos y efectos" },
  { slug: "animaciones", label: "Animaciones" },
  { slug: "otros", label: "Otros" },
] as const;

export type CategoriaComponente = (typeof CATEGORIAS)[number]["slug"];

export const SLUGS_CATEGORIA: readonly CategoriaComponente[] = CATEGORIAS.map((c) => c.slug);

export const LABEL_CATEGORIA: Record<CategoriaComponente, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c.slug, c.label]),
) as Record<CategoriaComponente, string>;

export const LENGUAJES = ["tsx", "jsx", "html", "css", "js", "otro"] as const;
export type LenguajeCodigo = (typeof LENGUAJES)[number];

export const LABEL_LENGUAJE: Record<LenguajeCodigo, string> = {
  tsx: "TSX",
  jsx: "JSX",
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
  otro: "Otro",
};

/** Topes de largo: el código es lo único grande. */
export const MAX_TITULO = 120;
export const MAX_DESCRIPCION = 2000;
export const MAX_CODIGO = 200_000;
export const MAX_PROMPT = 20_000;
export const MAX_COMANDO = 500;
export const MAX_URL = 2000;
export const MAX_TAGS = 12;
export const MAX_TAG = 30;

export interface ComponenteUI {
  id: string;
  title: string;
  category: CategoriaComponente;
  description: string | null;
  code: string | null;
  code_language: LenguajeCodigo;
  prompt: string | null;
  install_command: string | null;
  reference_url: string | null;
  preview_url: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function esCategoria(valor: unknown): valor is CategoriaComponente {
  return typeof valor === "string" && (SLUGS_CATEGORIA as readonly string[]).includes(valor);
}

export function esLenguaje(valor: unknown): valor is LenguajeCodigo {
  return typeof valor === "string" && (LENGUAJES as readonly string[]).includes(valor);
}

/** Solo http/https: cualquier otro esquema (javascript:, data:, file:) se descarta. */
export function urlHttp(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  try {
    const u = new URL(valor.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** "Hero, dark ,hero,  " -> ["hero", "dark"]: minúsculas, sin repetidos ni vacíos. */
export function parsearTags(valor: unknown): string[] {
  if (typeof valor !== "string") return [];
  const vistos = new Set<string>();
  for (const crudo of valor.split(",")) {
    const tag = crudo.trim().toLowerCase().replace(/\s+/g, " ");
    if (tag) vistos.add(tag.slice(0, MAX_TAG));
  }
  return [...vistos].slice(0, MAX_TAGS);
}

export interface DatosComponente {
  title: string;
  category: CategoriaComponente;
  description: string | null;
  code: string | null;
  code_language: LenguajeCodigo;
  prompt: string | null;
  install_command: string | null;
  reference_url: string | null;
  preview_url: string | null;
  tags: string[];
}

export type ResultadoValidacion = { ok: true; datos: DatosComponente } | { ok: false; error: string };

type Crudo = Record<string, unknown>;

const recortado = (valor: unknown) => (typeof valor === "string" ? valor.trim() : "");
const opcional = (valor: unknown) => recortado(valor) || null;

/**
 * Valida y normaliza lo que llega del formulario. El código y el prompt se
 * recortan en los extremos pero conservan sus saltos de línea internos.
 */
export function validarComponente(crudo: Crudo): ResultadoValidacion {
  const title = recortado(crudo.title);
  if (!title) return { ok: false, error: "El título es obligatorio" };
  if (title.length > MAX_TITULO) return { ok: false, error: `El título no puede pasar de ${MAX_TITULO} caracteres` };

  const category = recortado(crudo.category);
  if (!esCategoria(category)) return { ok: false, error: "Elegí una categoría" };

  const lenguajeCrudo = recortado(crudo.code_language) || "tsx";
  if (!esLenguaje(lenguajeCrudo)) return { ok: false, error: "Lenguaje inválido" };

  const description = opcional(crudo.description);
  if (description && description.length > MAX_DESCRIPCION)
    return { ok: false, error: `La descripción no puede pasar de ${MAX_DESCRIPCION} caracteres` };

  const code = opcional(crudo.code);
  if (code && code.length > MAX_CODIGO)
    return { ok: false, error: `El código no puede pasar de ${MAX_CODIGO.toLocaleString("es-AR")} caracteres` };

  const prompt = opcional(crudo.prompt);
  if (prompt && prompt.length > MAX_PROMPT)
    return { ok: false, error: `El prompt no puede pasar de ${MAX_PROMPT.toLocaleString("es-AR")} caracteres` };

  const install_command = opcional(crudo.install_command);
  if (install_command && install_command.length > MAX_COMANDO)
    return { ok: false, error: `El comando no puede pasar de ${MAX_COMANDO} caracteres` };

  const urls: Record<"reference_url" | "preview_url", string | null> = { reference_url: null, preview_url: null };
  for (const [campo, etiqueta] of [
    ["reference_url", "El link de referencia"],
    ["preview_url", "El link de la vista previa"],
  ] as const) {
    const valor = opcional(crudo[campo]);
    if (!valor) continue;
    const url = valor.length <= MAX_URL ? urlHttp(valor) : null;
    if (!url) return { ok: false, error: `${etiqueta} tiene que ser una URL http o https válida` };
    urls[campo] = url;
  }

  return {
    ok: true,
    datos: {
      title,
      category,
      description,
      code,
      code_language: lenguajeCrudo,
      prompt,
      install_command,
      ...urls,
      tags: parsearTags(crudo.tags),
    },
  };
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Texto sobre el que busca el buscador: título, descripción, tags y nombre de la categoría. */
export function textoBuscable(c: Pick<ComponenteUI, "title" | "description" | "tags" | "category">): string {
  return sinAcentos([c.title, c.description ?? "", c.tags.join(" "), LABEL_CATEGORIA[c.category] ?? c.category].join(" "));
}

/**
 * Filtro del buscador: todas las palabras escritas tienen que aparecer (sin
 * importar mayúsculas ni acentos) y, si hay categoría, coincidir con ella.
 */
export function filtrarComponentes<T extends Pick<ComponenteUI, "title" | "description" | "tags" | "category">>(
  lista: readonly T[],
  { texto = "", categoria = null }: { texto?: string; categoria?: CategoriaComponente | null },
): T[] {
  const palabras = sinAcentos(texto).split(/\s+/).filter(Boolean);
  return lista.filter((c) => {
    if (categoria && c.category !== categoria) return false;
    if (palabras.length === 0) return true;
    const buscable = textoBuscable(c);
    return palabras.every((p) => buscable.includes(p));
  });
}

/** Categorías en uso con su cantidad, en el orden fijo de CATEGORIAS. */
export function categoriasEnUso(lista: readonly Pick<ComponenteUI, "category">[]) {
  const cuenta = new Map<CategoriaComponente, number>();
  for (const c of lista) cuenta.set(c.category, (cuenta.get(c.category) ?? 0) + 1);
  return CATEGORIAS.filter((c) => cuenta.has(c.slug)).map((c) => ({
    slug: c.slug,
    label: c.label,
    cantidad: cuenta.get(c.slug) ?? 0,
  }));
}

const EXT_VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/** Una vista previa es video si la URL termina en una extensión de video; si no, imagen. */
export function tipoPreview(url: string): "video" | "imagen" {
  try {
    return EXT_VIDEO.test(new URL(url).pathname + new URL(url).search) ? "video" : "imagen";
  } catch {
    return "imagen";
  }
}

/** Primeras líneas del código para la miniatura de la tarjeta. */
export function primerasLineas(codigo: string, lineas = 8, ancho = 80): string {
  return codigo
    .replace(/\r\n/g, "\n")
    .split("\n")
    .slice(0, lineas)
    .map((l) => (l.length > ancho ? `${l.slice(0, ancho)}…` : l))
    .join("\n");
}
