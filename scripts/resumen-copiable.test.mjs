import test from "node:test";
import assert from "node:assert/strict";
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

const { resumenCopiable } = await import("../lib/lanzamientos/resumen-copiable.ts");

const HOY = "2026-10-23";
const pagina = (id, extra = {}) => ({ id, name: "Registro", kind: "registro", path: "/registro", site_id: "s1", ...extra });
let n = 0;
const reg = (dia, utm_source, extra = {}) => ({
  id: String(++n),
  page_id: "p1",
  email: `p${n}@x.com`,
  name: null,
  phone: null,
  utm_source,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  registered_at: `${dia}T15:00:00Z`,
  extra: null,
  ...extra,
});
const muchos = (k, dia, fuente, extra) => Array.from({ length: k }, () => reg(dia, fuente, extra));

const detalle = (extra = {}) => ({
  lanzamiento: { name: "Lanzamiento Octubre" },
  paginas: [pagina("p1")],
  registros: [
    ...muchos(6, "2026-10-22", null),
    ...muchos(3, "2026-10-22", "ig", { utm_campaign: "120A", utm_content: "ad-1" }),
    ...muchos(1, "2026-10-21", "fb", { utm_campaign: "120B", utm_content: "ad-2" }),
  ],
  visitas: [
    { page_id: "p1", day: "2026-10-17", utm_source: null, visitors: 120 },
    { page_id: "p1", day: "2026-10-21", utm_source: "ig", visitors: 300 },
    { page_id: "p1", day: "2026-10-21", utm_source: "fb", visitors: 10 },
  ],
  referrers: [
    { page_id: "p1", day: "2026-10-17", referrer_host: "m.youtube.com", visitors: 90 },
    { page_id: "p1", day: "2026-10-17", referrer_host: null, visitors: 30 },
  ],
  compras: [],
  despues: null,
  truncado: false,
  ...extra,
});

test("encabezado con la landing, su ruta y el período", () => {
  const t = resumenCopiable(detalle(), HOY);
  assert.match(t, /^Métricas de la landing Registro \(\/registro\), del 17\/10 al 22\/10:/);
  assert.match(resumenCopiable(detalle(), "2026-10-22"), /del 17\/10 a hoy:/);
});

test("totales con la misma conversión que el reporte", () => {
  const t = resumenCopiable(detalle(), HOY);
  assert.match(t, /\* 430 visitantes únicos/);
  assert.match(t, /\* 10 registros/);
  assert.match(t, /Conversión general: 2,3 %/);
  assert.doesNotMatch(t, /ventas/);
});

test("fuentes por leads, con porcentaje, conversión y origen del tráfico sin UTM", () => {
  const t = resumenCopiable(detalle(), HOY);
  const fuentes = t.split("De dónde vienen los leads\n")[1].split("\n\n")[0].split("\n");
  assert.equal(fuentes[0], "Sin UTM (orgánico / directo): 6 leads (60 %), con 5 % de conversión. Por origen: YouTube (90 visitantes), Directo (sin referrer) (30 visitantes).");
  assert.equal(fuentes[1], "ig: 3 leads (30 %), con 1 % de conversión.");
  assert.equal(fuentes[2], "fb: 1 lead (10 %), con 10 % de conversión.");
});

test("campañas y anuncios solo con valor", () => {
  const t = resumenCopiable(detalle(), HOY);
  assert.match(t, /Campañas que más traen\n\* Campaña 120A: 3 leads\n\* Campaña 120B: 1 lead/);
  assert.match(t, /Anuncios top\n\* ad-1: 3 leads\n\* ad-2: 1 lead/);
  assert.doesNotMatch(resumenCopiable(detalle({ registros: muchos(2, "2026-10-22", "ig") }), HOY), /Campañas/);
});

test("por día marca el mejor", () => {
  assert.match(resumenCopiable(detalle(), HOY), /Por día\n21\/10: 1 · 22\/10: 9 \(el mejor día\)/);
});

test("la lectura rápida solo compara fuentes con tráfico suficiente", () => {
  const t = resumenCopiable(detalle(), HOY);
  // fb convierte 10 % pero con 10 visitantes no es comparable: gana Sin UTM (5 %) sobre ig (1 %).
  assert.match(t, /Lectura rápida: La fuente que más leads trae es Sin UTM \(orgánico \/ directo\)\. También es la que mejor convierte\./);
});

test("varias landings: título del lanzamiento y desglose por landing", () => {
  const paginas = [pagina("p1"), pagina("p2", { name: "Ventas", kind: "venta", path: "/ventas" })];
  const visitas = [...detalle().visitas, { page_id: "p2", day: "2026-10-22", utm_source: null, visitors: 50 }];
  const compras = [{ id: "c1", page_id: "p2", amount: 44, currency: "EUR", occurred_at: "2026-10-22T10:00:00Z", list_price: true }];
  const t = resumenCopiable(detalle({ paginas, visitas, compras }), HOY);
  assert.match(t, /^Métricas del lanzamiento Lanzamiento Octubre,/);
  assert.match(t, /Por landing\n\* Registro \(\/registro\): 430 visitantes · 10 registros · 2,3 %\n\* Ventas \(\/ventas\): 50 visitantes/);
  assert.match(t, /\* 1 venta\n\* Ingresos \(precio de lista\): /);
});

test("sin datos lo dice y no inventa secciones", () => {
  const t = resumenCopiable(detalle({ registros: [], visitas: [], referrers: [] }), HOY);
  assert.match(t, /todavía sin datos\./);
  assert.doesNotMatch(t, /De dónde|Por día|Lectura rápida/);
});

test("avisa cuando los totales son parciales", () => {
  assert.match(resumenCopiable(detalle({ truncado: true }), HOY), /los totales son parciales/);
});
