import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Cliente, Proyecto, Recurso, Unidad } from "./types";

const RAIZ = path.join(process.cwd(), "..", "contexto");

const NOMBRES_UNIDAD: Record<string, string> = {
  "synous-ai": "Synous AI",
  "landing-pages": "Landing Pages",
  "wonder-digital": "Wonder Digital",
  "marca-personal": "Marca Personal",
};

/**
 * Extrae el cuerpo de una sección `## Titulo` hasta el siguiente `##`.
 * El corte final usa `$(?![\s\S])` — `\z` no existe en JavaScript y hacía
 * que las secciones al final del archivo no matchearan nunca.
 */
function seccion(md: string, titulo: string): string {
  const re = new RegExp(
    `^## ${titulo}\\s*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`,
    "im",
  );
  const m = md.match(re);
  if (!m) return "";
  return m[1]
    .split("\n")
    .filter((l) => !l.trim().startsWith("<!--"))
    .join("\n")
    .trim();
}

/** Líneas no vacías de una sección, sin viñetas. */
function lineas(md: string, titulo: string): string[] {
  return seccion(md, titulo)
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

/** Filas de una tabla Markdown dentro de una sección. Ignora vacías. */
function tabla(md: string, titulo: string): Recurso[] {
  return seccion(md, titulo)
    .split("\n")
    .filter((l) => l.trim().startsWith("|"))
    .map((l) => l.split("|").map((c) => c.trim()))
    .filter((c) => c.length >= 4 && !/^-+$/.test(c[2]))
    .slice(1)
    .map((c) => ({ que: c[1], donde: c[2] }))
    .filter((r) => r.que && r.donde);
}

/**
 * YAML convierte `2026-07-31` en un Date UTC. Formatearlo en una zona
 * negativa (Argentina, UTC-3) corre el día hacia atrás, así que se leen
 * los componentes UTC explícitamente.
 */
function fechaISO(v: unknown): string | undefined {
  if (!v) return undefined;
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(v).slice(0, 10);
}

function leerArchivos(
  dir: string,
): { slug: string; raw: string; rel: string }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => ({
      slug: f.replace(/\.md$/, ""),
      raw: fs.readFileSync(path.join(dir, f), "utf8"),
      rel: path.relative(RAIZ, path.join(dir, f)).split(path.sep).join("/"),
    }));
}

function parseProyecto(slug: string, raw: string, rel: string): Proyecto {
  const { data, content } = matter(raw);
  return {
    slug,
    archivo: rel,
    nombre: data.nombre ?? slug,
    unidad: data.unidad ?? "",
    cliente: data.cliente ?? "",
    estado: data.estado ?? "activo",
    prioridad: data.prioridad ?? "media",
    responsables: Array.isArray(data.responsables) ? data.responsables : [],
    entrega: fechaISO(data.entrega),
    actualizado: fechaISO(data.actualizado),
    proximoPaso: seccion(content, "Próximo paso") || undefined,
    bloqueos: lineas(content, "Bloqueos"),
    estadoActual: seccion(content, "Estado actual") || undefined,
    recursos: tabla(content, "Recursos"),
    decisiones: lineas(content, "Decisiones"),
    bitacora: lineas(content, "Bitácora"),
    notas: seccion(content, "Notas") || undefined,
  };
}

function parseCliente(slug: string, raw: string, rel: string): Cliente {
  const { data, content } = matter(raw);
  return {
    slug,
    archivo: rel,
    nombre: data.nombre ?? slug,
    unidad: data.unidad ?? "",
    estado: data.estado ?? "activo",
    canal: data.canal || undefined,
    contexto: seccion(content, "Contexto") || undefined,
    esperandoRespuesta: lineas(content, "Esperando respuesta"),
    recursos: tabla(content, "Recursos"),
  };
}

export function getUnidades(): Unidad[] {
  if (!fs.existsSync(RAIZ)) return [];

  return fs
    .readdirSync(RAIZ, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const base = path.join(RAIZ, d.name);
      const fichaPath = path.join(base, "_unidad.md");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ficha: { data: Record<string, any>; content: string } =
        fs.existsSync(fichaPath)
          ? matter(fs.readFileSync(fichaPath, "utf8"))
          : { data: {}, content: "" };

      return {
        slug: d.name,
        nombre: ficha.data.nombre ?? NOMBRES_UNIDAD[d.name] ?? d.name,
        estado: ficha.data.estado ?? "activa",
        queEs: seccion(ficha.content, "Qué es") || undefined,
        comoSeOpera: seccion(ficha.content, "Cómo se opera") || undefined,
        recursos: tabla(ficha.content, "Recursos"),
        proyectos: leerArchivos(path.join(base, "proyectos")).map((f) =>
          parseProyecto(f.slug, f.raw, f.rel),
        ),
        clientes: leerArchivos(path.join(base, "clientes")).map((f) =>
          parseCliente(f.slug, f.raw, f.rel),
        ),
      };
    });
}

export function getProyectos(): Proyecto[] {
  return getUnidades().flatMap((u) => u.proyectos);
}

export function getProyecto(slug: string): Proyecto | undefined {
  return getProyectos().find((p) => p.slug === slug);
}

export function getUnidad(slug: string): Unidad | undefined {
  return getUnidades().find((u) => u.slug === slug);
}
