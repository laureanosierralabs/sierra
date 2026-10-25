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

const { calcularResultados, visitasPorDia, rangoAnterior, diasEntre, variacionPorcentual, ingresosPorMoneda } = await import(
  "../lib/lanzamientos/resultados.ts"
);
const { construirPromptIA } = await import("../lib/lanzamientos/prompt-ia.ts");

// 23/10/2026 12:00 en Buenos Aires.
const AHORA = new Date("2026-10-23T15:00:00Z");
const HOY = "2026-10-23";

const pagina = (id, extra = {}) => ({ id, name: `Landing ${id}`, kind: "registro", site_id: "s1", path: `/${id}`, ...extra });
let n = 0;
const reg = (dia, extra = {}) => ({
  id: String(++n),
  page_id: "p1",
  email: `persona${n}@secreto.com`,
  name: `Nombre Secreto ${n}`,
  phone: null,
  utm_source: "ig",
  utm_medium: null,
  utm_campaign: "camp-A",
  utm_content: "ad-1",
  registered_at: `${dia}T15:00:00Z`,
  extra: null,
  ...extra,
});

const detalle = (extra = {}) => ({
  lanzamiento: {
    id: "l1",
    name: "Lanzamiento Octubre",
    status: "activo",
    starts_on: "2026-10-20",
    ends_on: "2026-10-29",
    goal_registrations: 100,
  },
  paginas: [pagina("p1")],
  registros: [
    reg("2026-10-22"),
    reg("2026-10-22"),
    reg("2026-10-21", { utm_source: null, utm_campaign: null, utm_content: null }),
    reg("2026-10-12"),
  ],
  visitas: [
    { page_id: "p1", day: "2026-10-22", utm_source: "ig", visitors: 20 },
    { page_id: "p1", day: "2026-10-21", utm_source: "fb", visitors: 30 },
    { page_id: "p1", day: "2026-10-21", utm_source: null, visitors: 10 },
    { page_id: "p1", day: "2026-10-12", utm_source: "ig", visitors: 20 },
  ],
  referrers: [{ page_id: "p1", day: "2026-10-21", referrer_host: "l.instagram.com", visitors: 10 }],
  compras: [],
  listas: [],
  despues: null,
  truncado: false,
  ...extra,
});

test("visitasPorDia suma las fuentes de cada día y ordena", () => {
  const d = visitasPorDia(detalle().visitas);
  assert.deepEqual(d, [
    { dia: "2026-10-12", visitantes: 20 },
    { dia: "2026-10-21", visitantes: 40 },
    { dia: "2026-10-22", visitantes: 20 },
  ]);
});

test("rangoAnterior es el tramo de igual largo justo antes", () => {
  assert.deepEqual(rangoAnterior({ desde: "2026-10-17", hasta: "2026-10-23", dias: 7 }), {
    desde: "2026-10-10",
    hasta: "2026-10-16",
    dias: 7,
  });
  assert.equal(diasEntre("2026-10-30", "2026-11-02").join(","), "2026-10-30,2026-10-31,2026-11-01,2026-11-02");
});

test("variacionPorcentual no inventa una base", () => {
  assert.equal(variacionPorcentual(15, 10), 50);
  assert.equal(variacionPorcentual(5, 10), -50);
  assert.equal(variacionPorcentual(5, 0), null);
  assert.equal(variacionPorcentual(null, 10), null);
});

test("ingresosPorMoneda no mezcla monedas ni cuenta montos vacíos", () => {
  assert.deepEqual(
    ingresosPorMoneda([
      { amount: 10, currency: "USD" },
      { amount: 5, currency: "USD" },
      { amount: 1000, currency: "ARS" },
      { amount: null, currency: "ARS" },
    ]),
    [
      ["USD", 15],
      ["ARS", 1000],
    ],
  );
});

test("todo el lanzamiento: totales, serie sin huecos y sin comparación", () => {
  const r = calcularResultados(detalle(), { periodo: "todo", landingId: null, ahora: AHORA });
  assert.equal(r.actual.visitantes, 80);
  assert.equal(r.actual.registros, 4);
  assert.equal(r.actual.conversion, 5);
  assert.equal(r.anterior, null);
  assert.equal(r.serie[0].dia, "2026-10-12");
  assert.equal(r.serie.at(-1).dia, "2026-10-23");
  assert.equal(r.serie.length, 12);
  const dia21 = r.serie.find((d) => d.dia === "2026-10-21");
  assert.deepEqual([dia21.visitantes, dia21.registros], [40, 1]);
  assert.equal(r.serie.at(-1).acumulado, 4);
  assert.equal(r.meta.porcentaje, 4);
});

test("7 días compara contra los 7 anteriores", () => {
  const r = calcularResultados(detalle(), { periodo: "7d", landingId: null, ahora: AHORA });
  assert.equal(r.serie.length, 7);
  assert.equal(r.actual.registros, 3);
  assert.equal(r.actual.visitantes, 60);
  assert.equal(r.anterior.registros, 1);
  assert.equal(r.anterior.visitantes, 20);
});

test("hoy no compara y el gráfico muestra 7 días de contexto", () => {
  const r = calcularResultados(detalle(), { periodo: "hoy", landingId: null, ahora: AHORA });
  assert.equal(r.anterior, null);
  assert.equal(r.serieAmpliada, true);
  assert.equal(r.serie.length, 7);
  assert.equal(r.actual.registros, 0);
});

test("fuentes: registros y conversión por utm_source; el donut cae a registros sin visitas", () => {
  const r = calcularResultados(detalle(), { periodo: "todo", landingId: null, ahora: AHORA });
  const ig = r.fuentes.find((f) => f.fuente === "ig");
  assert.deepEqual([ig.visitantes, ig.registros, ig.conversion], [40, 3, 7.5]);
  assert.equal(r.fuentes.find((f) => f.fuente === "").etiqueta, "Sin UTM");

  const sinVisitas = calcularResultados(detalle({ visitas: [], referrers: [] }), {
    periodo: "todo",
    landingId: null,
    ahora: AHORA,
  });
  assert.equal(sinVisitas.baseFuentes, "registros");
  assert.equal(sinVisitas.hayVisitas, false);
  assert.equal(sinVisitas.actual.conversion, null);
});

test("embudo: solo pasos con datos, porcentaje contra el anterior y cruce por email", () => {
  const registros = [reg("2026-10-22"), reg("2026-10-22"), reg("2026-10-22"), reg("2026-10-22")];
  const click = (email) => ({ site_id: "s1", kind: "whatsapp_click", path: "/p1", email, target: null, day: "2026-10-22" });
  const d = detalle({
    registros,
    visitas: [{ page_id: "p1", day: "2026-10-22", utm_source: "ig", visitors: 100 }],
    despues: {
      eventos: [click(registros[0].email.toUpperCase()), click(registros[1].email), click("otro@x.com")],
      webinar: [],
    },
    compras: [{ id: "c1", page_id: "p1", amount: 10, currency: "USD", occurred_at: "2026-10-22T15:00:00Z" }],
  });
  const r = calcularResultados(d, { periodo: "todo", landingId: null, ahora: AHORA });
  assert.deepEqual(
    r.embudo.map((p) => [p.id, p.cantidad, p.porcentaje]),
    [
      ["visitantes", 100, null],
      ["registros", 4, 4],
      ["whatsapp", 2, 50],
      ["compras", 1, 50],
    ],
  );
});

test("por landing: comparación A/B y filtro por landing", () => {
  const d = detalle({
    paginas: [pagina("p1"), pagina("p2")],
    registros: [reg("2026-10-22"), reg("2026-10-22", { page_id: "p2" })],
    visitas: [
      { page_id: "p1", day: "2026-10-22", utm_source: null, visitors: 50 },
      { page_id: "p2", day: "2026-10-22", utm_source: null, visitors: 50 },
    ],
  });
  const r = calcularResultados(d, { periodo: "todo", landingId: null, ahora: AHORA });
  assert.equal(r.porLanding.length, 2);
  assert.equal(r.comparaciones[0].significativa, false);

  const solo = calcularResultados(d, { periodo: "todo", landingId: "p2", ahora: AHORA });
  assert.equal(solo.landing.id, "p2");
  assert.equal(solo.actual.registros, 1);
  assert.equal(solo.actual.visitantes, 50);
  // La meta es del lanzamiento entero.
  assert.equal(solo.meta.registros, 2);
});

test("una landing de venta se mide en ventas", () => {
  const d = detalle({
    paginas: [pagina("v1", { kind: "venta" })],
    registros: [],
    visitas: [{ page_id: "v1", day: "2026-10-22", utm_source: null, visitors: 50 }],
    compras: [
      { id: "c1", page_id: "v1", amount: 10, currency: "USD", occurred_at: "2026-10-22T15:00:00Z" },
      { id: "c2", page_id: "v1", amount: null, currency: null, occurred_at: null },
    ],
  });
  const r = calcularResultados(d, { periodo: "todo", landingId: null, ahora: AHORA });
  assert.equal(r.actual.tipoConversion, "venta");
  assert.equal(r.actual.conversion, 4);
  assert.deepEqual(r.ingresos, [["USD", 10]]);
  assert.equal(r.ventasSinFecha, 1);
  assert.equal(r.serie.find((s) => s.dia === "2026-10-22").ventas, 1);
});

test("el prompt para IA lleva instrucciones, datos reales y ningún dato personal", () => {
  const r = calcularResultados(detalle(), { periodo: "todo", landingId: null, ahora: AHORA });
  const prompt = construirPromptIA(r, { lanzamiento: "Lanzamiento Octubre", fechas: "20/10 → 29/10", hoy: HOY });
  assert.match(prompt, /^Actúa como un analista/);
  assert.match(prompt, /Tres acciones concretas/);
  assert.match(prompt, /Lanzamiento: Lanzamiento Octubre/);
  assert.match(prompt, /Período analizado: todo el lanzamiento/);
  assert.match(prompt, /Visitantes únicos: 80/);
  assert.match(prompt, /Registros: 4/);
  assert.match(prompt, /Conversión a registro: 5 %/);
  assert.match(prompt, /\| 21\/10 \| 40 \| 1 \|/);
  assert.match(prompt, /\| ig \| 40 \| 3 \| 7,5 % \|/);
  assert.match(prompt, /- ad-1: 3 registros/);
  assert.match(prompt, /Meta de registros del lanzamiento: 100; lleva 4 \(4 %\)/);
  assert.doesNotMatch(prompt, /secreto/i);
  assert.doesNotMatch(prompt, /@/);
  // Español neutro: sin voseo.
  assert.doesNotMatch(prompt, /\b(sos|tenés|podés|fijate|mirá|pegá)\b/i);
});

test("el prompt omite lo que no tiene datos y avisa lo parcial", () => {
  const r = calcularResultados(detalle({ registros: [], visitas: [], referrers: [], truncado: true }), {
    periodo: "30d",
    landingId: null,
    ahora: AHORA,
  });
  const prompt = construirPromptIA(r, { lanzamiento: "X", fechas: null, hoy: HOY });
  assert.doesNotMatch(prompt, /Evolución por día/);
  assert.doesNotMatch(prompt, /De dónde llega/);
  assert.doesNotMatch(prompt, /Embudo/);
  assert.match(prompt, /sin visitas medidas/);
  assert.match(prompt, /totales son parciales/);
});

test("embudo: el total de los grupos reemplaza al cruce de clics solo si es mayor y sin filtros", async () => {
  const { calcularResultados } = await import("../lib/lanzamientos/resultados.ts");
  const base = {
    lanzamiento: { id: "l1", client_id: "c1", name: "L", status: "activo", starts_on: "2026-10-01", ends_on: "2026-10-31", goal_registrations: null, closing_notes: null, cover_url: null, banner_url: null, created_at: "2026-10-01T00:00:00Z" },
    paginas: [{ id: "p1", name: "R", kind: "registro", position: 0 }],
    registros: [1, 2, 3].map((i) => ({ id: String(i), page_id: "p1", email: `p${i}@x.com`, name: null, phone: null, utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, registered_at: "2026-10-20T10:00:00Z", extra: null })),
    visitas: [{ page_id: "p1", day: "2026-10-20", utm_source: null, visitors: 10 }],
    referrers: [], compras: [], truncado: false, listas: [],
    despues: { eventos: [{ site_id: "s", kind: "whatsapp_click", path: "/g", email: "p1@x.com", target: null, day: "2026-10-20" }], webinar: [] },
    enGrupos: 900,
  };
  const ahora = new Date("2026-10-25T12:00:00Z");
  const todo = calcularResultados(base, { periodo: "todo", landingId: null, ahora });
  const paso = todo.embudo.find((p) => p.id === "whatsapp");
  assert.equal(paso.cantidad, 900);
  assert.ok(paso.nota);
  const conLanding = calcularResultados(base, { periodo: "todo", landingId: "p1", ahora });
  assert.equal(conLanding.embudo.find((p) => p.id === "whatsapp").cantidad, 1);
});
