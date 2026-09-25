/**
 * Migra contexto/*.md y finanzas/movimientos.json a Supabase.
 * Se corre una sola vez: después la fuente de verdad es la base.
 *
 *   node scripts/migrar-contexto.mjs
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const RAIZ = path.join(process.cwd(), "contexto");
const FINANZAS = path.join(process.cwd(), "finanzas", "movimientos.json");

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

// REST directo: el cliente de supabase-js arrastra realtime, que necesita
// WebSocket y en Node 20 no está disponible.
const API = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const NOMBRES = {
  "synous-ai": "Synous AI",
  "landing-pages": "Landing Pages",
  "wonder-digital": "Wonder Digital",
  "marca-personal": "Marca Personal",
};

function seccion(md, titulo) {
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

function lineas(md, titulo) {
  return seccion(md, titulo)
    .split("\n")
    .map((l) => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function recursos(md) {
  return lineas(md, "Recursos")
    .map((l) => {
      const m = l.match(/^(.+?)\s*[—:-]\s*(.+)$/);
      return m ? { que: m[1].trim(), donde: m[2].trim() } : null;
    })
    .filter(Boolean);
}

function fecha(v) {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function leerDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => {
      const { data, content } = matter(
        fs.readFileSync(path.join(dir, f), "utf8"),
      );
      return { slug: f.replace(/\.md$/, ""), data, md: content };
    });
}

const unidades = [];
const proyectos = [];
const clientes = [];

for (const slug of fs.readdirSync(RAIZ)) {
  const dir = path.join(RAIZ, slug);
  if (!fs.statSync(dir).isDirectory()) continue;

  const fichaPath = path.join(dir, "_unidad.md");
  const ficha = fs.existsSync(fichaPath)
    ? matter(fs.readFileSync(fichaPath, "utf8"))
    : { data: {}, content: "" };

  unidades.push({
    slug,
    nombre: ficha.data.nombre ?? NOMBRES[slug] ?? slug,
    estado: ficha.data.estado ?? null,
    que_es: seccion(ficha.content, "Qué es") || null,
    como_se_opera: seccion(ficha.content, "Cómo se opera") || null,
    recursos: recursos(ficha.content),
  });

  for (const p of leerDir(path.join(dir, "proyectos"))) {
    proyectos.push({
      slug: p.slug,
      unidad: slug,
      nombre: p.data.nombre ?? p.slug,
      cliente: p.data.cliente ?? null,
      estado: p.data.estado ?? "activo",
      prioridad: p.data.prioridad ?? "media",
      responsables: Array.isArray(p.data.responsables)
        ? p.data.responsables
        : p.data.responsables
          ? [p.data.responsables]
          : [],
      entrega: fecha(p.data.entrega),
      actualizado: fecha(p.data.actualizado),
      proximo_paso: seccion(p.md, "Próximo paso") || null,
      bloqueos: lineas(p.md, "Bloqueos"),
      estado_actual: seccion(p.md, "Estado actual") || null,
      recursos: recursos(p.md),
      decisiones: lineas(p.md, "Decisiones"),
      bitacora: lineas(p.md, "Bitácora"),
      notas: seccion(p.md, "Notas") || null,
    });
  }

  for (const c of leerDir(path.join(dir, "clientes"))) {
    clientes.push({
      slug: c.slug,
      unidad: slug,
      nombre: c.data.nombre ?? c.slug,
      estado: c.data.estado ?? null,
      canal: c.data.canal ?? null,
      contexto: seccion(c.md, "Contexto") || null,
      esperando_respuesta: lineas(c.md, "Esperando respuesta"),
      recursos: recursos(c.md),
    });
  }
}

const movimientos = fs.existsSync(FINANZAS)
  ? (JSON.parse(fs.readFileSync(FINANZAS, "utf8")).movimientos ?? [])
  : [];

async function subir(tabla, filas) {
  if (filas.length === 0) {
    console.log(`${tabla}: nada que migrar`);
    return;
  }

  const r = await fetch(`${API}/${tabla}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(filas),
  });

  if (!r.ok) {
    console.error(`${tabla}: ERROR — ${(await r.text()).slice(0, 200)}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${tabla}: ${filas.length} filas`);
}

// El orden importa: proyectos y clientes referencian unidades.
await subir("context_units", unidades);
await subir("context_projects", proyectos);
await subir("context_clients", clientes);
await subir("movements", movimientos);

console.log("Migración terminada.");
