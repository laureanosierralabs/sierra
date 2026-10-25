import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

// Node no conoce el alias "@/" de Next: se traduce a la ruta del archivo .ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return { url: new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const {
  CATEGORIAS,
  LABEL_CATEGORIA,
  MAX_CODIGO,
  MAX_PROMPT,
  categoriasEnUso,
  esCategoria,
  filtrarComponentes,
  parsearTags,
  primerasLineas,
  tipoPreview,
  urlHttp,
  validarComponente,
} = await import("../lib/componentes/tipos.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const valido = (extra = {}) => ({ title: "Hero", category: "hero", ...extra });

test("las 17 categorías son las acordadas y están en la migración", () => {
  assert.equal(CATEGORIAS.length, 17);
  assert.equal(LABEL_CATEGORIA["prueba-social"], "Prueba social");
  assert.equal(LABEL_CATEGORIA.cta, "Llamados a la acción");
  assert.ok(esCategoria("contadores"));
  assert.ok(!esCategoria("inventada"));
  const sql = leer("../supabase/migrations/20261109000000_ui_components.sql");
  for (const c of CATEGORIAS) assert.ok(sql.includes(`'${c.slug}'`), `falta ${c.slug} en el check`);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /-- Rollback:/);
});

test("urlHttp solo acepta http y https", () => {
  assert.equal(urlHttp("https://ui.shadcn.com/"), "https://ui.shadcn.com/");
  assert.equal(urlHttp("  http://a.com/x.png "), "http://a.com/x.png");
  assert.equal(urlHttp("javascript:alert(1)"), null);
  assert.equal(urlHttp("data:text/html,<script>1</script>"), null);
  assert.equal(urlHttp("file:///etc/passwd"), null);
  assert.equal(urlHttp("no es url"), null);
  assert.equal(urlHttp(null), null);
});

test("parsearTags normaliza, quita repetidos y tope", () => {
  assert.deepEqual(parsearTags("Hero, dark ,hero,  , Animado  Suave"), ["hero", "dark", "animado suave"]);
  assert.deepEqual(parsearTags(""), []);
  assert.equal(parsearTags(Array.from({ length: 30 }, (_, i) => `t${i}`).join(",")).length, 12);
});

test("validarComponente exige título y categoría, y normaliza", () => {
  assert.deepEqual(validarComponente({ category: "hero" }), { ok: false, error: "El título es obligatorio" });
  assert.equal(validarComponente(valido({ category: "nada" })).ok, false);
  assert.equal(validarComponente(valido({ code_language: "php" })).ok, false);

  const r = validarComponente(valido({ title: "  Hero  ", description: "  ", tags: "A, b", code: "\n<div/>\n" }));
  assert.ok(r.ok);
  assert.equal(r.datos.title, "Hero");
  assert.equal(r.datos.description, null);
  assert.equal(r.datos.code, "<div/>");
  assert.equal(r.datos.code_language, "tsx");
  assert.deepEqual(r.datos.tags, ["a", "b"]);
});

test("validarComponente aplica los topes de código y prompt", () => {
  assert.ok(validarComponente(valido({ code: "x".repeat(MAX_CODIGO) })).ok);
  assert.equal(validarComponente(valido({ code: "x".repeat(MAX_CODIGO + 1) })).ok, false);
  assert.ok(validarComponente(valido({ prompt: "x".repeat(MAX_PROMPT) })).ok);
  assert.equal(validarComponente(valido({ prompt: "x".repeat(MAX_PROMPT + 1) })).ok, false);
  assert.equal(validarComponente(valido({ title: "x".repeat(121) })).ok, false);
});

test("validarComponente rechaza URLs que no son http(s)", () => {
  assert.equal(validarComponente(valido({ reference_url: "javascript:alert(1)" })).ok, false);
  assert.equal(validarComponente(valido({ preview_url: "ftp://x.com/a.png" })).ok, false);
  const r = validarComponente(valido({ reference_url: "https://ui.shadcn.com", preview_url: "" }));
  assert.ok(r.ok);
  assert.equal(r.datos.reference_url, "https://ui.shadcn.com/");
  assert.equal(r.datos.preview_url, null);
});

const lista = [
  { id: "1", title: "Task list (rare-ui)", description: "Lista animada", tags: ["shadcn"], category: "listas" },
  { id: "2", title: "Hero con video", description: null, tags: ["oscuro", "video"], category: "hero" },
  { id: "3", title: "Botón magnético", description: "Animación al hover", tags: [], category: "botones" },
];

test("filtrarComponentes busca por título, descripción, tags y categoría sin acentos", () => {
  const ids = (f) => filtrarComponentes(lista, f).map((c) => c.id);
  assert.deepEqual(ids({}), ["1", "2", "3"]);
  assert.deepEqual(ids({ texto: "TASK" }), ["1"]);
  assert.deepEqual(ids({ texto: "shadcn" }), ["1"]);
  assert.deepEqual(ids({ texto: "boton" }), ["3"]);
  assert.deepEqual(ids({ texto: "animacion" }), ["3"]);
  assert.deepEqual(ids({ texto: "portada" }), ["2"]);
  assert.deepEqual(ids({ texto: "hero oscuro" }), ["2"]);
  assert.deepEqual(ids({ texto: "hero rare" }), []);
  assert.deepEqual(ids({ categoria: "listas" }), ["1"]);
  assert.deepEqual(ids({ texto: "video", categoria: "listas" }), []);
});

test("categoriasEnUso cuenta solo las usadas, en el orden fijo", () => {
  const en = categoriasEnUso([...lista, { category: "hero" }]);
  assert.deepEqual(
    en.map((c) => [c.slug, c.cantidad]),
    [
      ["botones", 1],
      ["hero", 2],
      ["listas", 1],
    ],
  );
});

test("tipoPreview distingue video de imagen y primerasLineas recorta", () => {
  assert.equal(tipoPreview("https://x.com/a.mp4"), "video");
  assert.equal(tipoPreview("https://x.com/a.WEBM?t=1"), "video");
  assert.equal(tipoPreview("https://x.com/a.png"), "imagen");
  assert.equal(tipoPreview("https://x.com/video"), "imagen");
  assert.equal(primerasLineas("a\nb\nc\nd", 2), "a\nb");
  assert.equal(primerasLineas("x".repeat(100), 1, 10), `${"x".repeat(10)}…`);
});

test("el código pegado solo se interpreta dentro de un iframe con sandbox vacío", () => {
  const vista = leer("../components/componentes/vista-previa.tsx");
  assert.match(vista, /<iframe[\s\S]*?sandbox=""/);
  assert.ok(!/sandbox="[^"]+"/.test(vista), "el sandbox no puede tener permisos");
  assert.ok(!/allow-scripts|allow-same-origin/.test(vista.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")));
  // Ningún componente de la biblioteca inyecta HTML crudo.
  for (const f of ["vista-previa", "bloque-codigo", "biblioteca-componentes", "componente-form"]) {
    assert.ok(!leer(`../components/componentes/${f}.tsx`).includes("dangerouslySetInnerHTML"), f);
  }
});

test("la sección está en el sidebar de landing-pages para todo el equipo y borrar es del owner", () => {
  const unidades = leer("../lib/unidades.ts");
  assert.match(unidades, /href: "\/landing-pages\/componentes", label: "Componentes", icono: "Components" \}/);
  const acciones = leer("../app/landing-pages/componentes-acciones.ts");
  assert.match(acciones, /esOwner\) return \{ error: "Solo el owner puede borrar/);
});
