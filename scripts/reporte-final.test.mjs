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

const { metricasParaAnalisis } = await import("../lib/lanzamientos/analisis-metricas.ts");
const { reporteLanzamientoEmail, analisisHtml } = await import("../lib/lanzamientos/reporte-diario.ts");
const { avisoBorradorEmail, avisoMetaEmail, metaAlcanzada } = await import("../lib/lanzamientos/avisos.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const reg = (i, dia, extra = {}) => ({
  id: String(i),
  page_id: "p1",
  email: `p${i}@x.com`,
  name: null,
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
  lanzamiento: { name: "Lanzamiento Octubre", status: "cerrado", starts_on: "2026-10-20", ends_on: "2026-10-22", goal_registrations: 100 },
  paginas: [
    { id: "p1", name: "Registro A", kind: "registro", site_id: "s1", path: "/a" },
    { id: "p2", name: "Venta", kind: "venta", site_id: "s1", path: "/venta" },
  ],
  registros: [reg(1, "2026-10-22"), reg(2, "2026-10-22"), reg(3, "2026-10-21", { utm_campaign: "camp-B", utm_content: null })],
  visitas: [
    { page_id: "p1", day: "2026-10-22", utm_source: "ig", visitors: 20 },
    { page_id: "p1", day: "2026-10-21", utm_source: "fb", visitors: 30 },
    { page_id: "p1", day: "2026-10-21", utm_source: null, visitors: 10 },
  ],
  referrers: [{ page_id: "p1", day: "2026-10-21", referrer_host: "l.instagram.com", visitors: 10 }],
  compras: [{ id: "c1", page_id: "p2", amount: 100, currency: "USD", occurred_at: null, list_price: true }],
  despues: null,
  ...extra,
});

test("las métricas para la IA salen de los mismos cálculos del reporte", () => {
  const m = metricasParaAnalisis(detalle());
  assert.deepEqual(m.lanzamiento, {
    nombre: "Lanzamiento Octubre",
    estado: "cerrado",
    inicio: "2026-10-20",
    fin: "2026-10-22",
    meta_registros: 100,
  });
  assert.equal(m.totales.visitantes, 60);
  assert.equal(m.totales.registros, 3);
  assert.equal(m.totales.conversion_pct, 5);
  assert.equal(m.totales.ventas, 1);
  assert.deepEqual(m.totales.ingresos, [{ moneda: "USD", total: 100 }]);
  assert.equal(m.totales.ingresos_son_precio_de_lista, true);
  assert.deepEqual(m.por_landing[0], { nombre: "Registro A", tipo: "registro", visitantes: 60, registros: 3, conversion_pct: 5 });
  assert.equal(m.por_landing[1].conversion_pct, null);
});

test("las métricas traen rankings, pico diario y avisan qué no se mide", () => {
  const m = metricasParaAnalisis(detalle());
  assert.deepEqual(m.fuentes_de_trafico[0], { fuente: "fb", visitantes: 30 });
  assert.deepEqual(m.campanas_por_registros[0], { campana: "camp-A", registros: 2 });
  assert.deepEqual(m.anuncios_por_registros, [{ anuncio: "ad-1", registros: 2 }]);
  assert.deepEqual(m.trafico_sin_utm_por_origen, [{ origen: "Instagram", visitantes: 10 }]);
  assert.deepEqual(m.pico_diario, { dia: "2026-10-22", registros: 2 });
  assert.equal(m.despues_del_registro.whatsapp, null);
  assert.equal(m.despues_del_registro.clics_al_checkout, null);
  // Nunca hay gasto publicitario: la IA tiene que decirlo.
  assert.ok(m.datos_no_disponibles.some((d) => d.includes("gasto en publicidad")));
  assert.ok(m.datos_no_disponibles.some((d) => d.includes("pasos posteriores")));
});

test("las métricas cuentan WhatsApp, webinar y clics al checkout sobre los registrados", () => {
  const m = metricasParaAnalisis(
    detalle({
      despues: {
        eventos: [
          { site_id: "s1", kind: "whatsapp_click", path: "/a", email: "p1@x.com", target: null, day: "2026-10-21" },
          { site_id: "s1", kind: "checkout_click", path: "/venta", email: null, target: "btn", day: "2026-10-22" },
          { site_id: "s1", kind: "checkout_click", path: "/otra", email: null, target: "btn", day: "2026-10-22" },
        ],
        webinar: [{ email: "p2@x.com", day: "2026-10-22" }],
      },
    }),
  );
  assert.deepEqual(m.despues_del_registro.whatsapp, { entraron: 1, de: 3 });
  assert.deepEqual(m.despues_del_registro.webinar, { entraron: 1, de: 3 });
  // Solo cuentan los clics de rutas del lanzamiento.
  assert.equal(m.despues_del_registro.clics_al_checkout, 1);
});

test("sin visitas las métricas lo marcan como dato no disponible", () => {
  const m = metricasParaAnalisis(detalle({ visitas: [], referrers: [] }));
  assert.equal(m.totales.visitantes, 0);
  assert.equal(m.totales.conversion_pct, null);
  assert.ok(m.datos_no_disponibles.some((d) => d.startsWith("visitantes")));
});

const entradaFinal = (extra = {}) => ({
  tipo: "final",
  nombre: "Lanzamiento Octubre",
  detalle: detalle(),
  hoy: "2026-10-23",
  urlPanel: null,
  urlReporte: "https://app.ejemplo.com/portal/pilar/lanzamientos/abc/reporte",
  ...extra,
});

test("el mail final incluye el análisis aprobado, escapado y en párrafos", () => {
  const { html, text } = reporteLanzamientoEmail(
    entradaFinal({ analisis: "Qué funcionó\nLa landing <b>A</b> convirtió 5 %.\n\nQué no funcionó\nFaltan datos." }),
  );
  assert.ok(html.includes("Análisis del lanzamiento"));
  assert.ok(html.includes("&lt;b&gt;A&lt;/b&gt;"));
  assert.ok(!html.includes("<b>A</b>"));
  assert.ok(html.includes("<strong"));
  assert.match(text, /ANÁLISIS DEL LANZAMIENTO\nQué funcionó/);
  assert.match(text, /Visitantes: 60/);
});

test("sin análisis el final sale como antes, y el diario nunca lo lleva", () => {
  const sin = reporteLanzamientoEmail(entradaFinal());
  assert.ok(!sin.html.includes("Análisis del lanzamiento"));
  const diario = reporteLanzamientoEmail(entradaFinal({ tipo: "diario", urlPanel: null, analisis: "texto" }));
  assert.ok(!diario.html.includes("Análisis del lanzamiento"));
});

test("analisisHtml separa párrafos por línea en blanco y escapa todo", () => {
  const h = analisisHtml("uno\r\ndos\r\n\r\n<script>");
  assert.equal(h.match(/<p /g).length, 2);
  assert.ok(h.includes("uno<br>dos"));
  assert.ok(h.includes("&lt;script&gt;"));
});

test("el aviso del borrador va al panel del lanzamiento", () => {
  const a = avisoBorradorEmail({ nombre: "Lanzamiento\nOctubre", url: "https://app.ejemplo.com/landing-pages/launches/abc" });
  assert.equal(a.subject, "El reporte final de Lanzamiento Octubre está listo para revisar");
  assert.ok(a.html.includes('href="https://app.ejemplo.com/landing-pages/launches/abc"'));
  assert.match(a.text, /https:\/\/app\.ejemplo\.com\/landing-pages\/launches\/abc/);
  assert.ok(!avisoBorradorEmail({ nombre: "X", url: null }).html.includes("href="));
});

test("el aviso de meta lleva los totales y el link al portal", () => {
  const a = avisoMetaEmail({
    nombre: "Lanzamiento Octubre",
    meta: 1000,
    registros: 1012,
    visitantes: 20000,
    conversion: 5.1,
    urlPortal: "https://app.ejemplo.com/portal/pilar/lanzamientos/abc",
  });
  assert.equal(a.subject, "🎯 Lanzamiento Octubre llegó a la meta de 1.000 registros");
  assert.match(a.text, /Ya hay 1\.012 registros: la meta era de 1\.000\./);
  assert.match(a.text, /20\.000 visitantes, con una conversión de 5,1 %/);
  assert.ok(a.html.includes("portal/pilar/lanzamientos/abc"));
  const sinVisitas = avisoMetaEmail({ nombre: "X", meta: 10, registros: 10, visitantes: null, conversion: null, urlPortal: null });
  assert.ok(!sinVisitas.text.includes("visitantes"));
});

test("la meta solo se avisa una vez, en activos y al llegar o pasar el objetivo", () => {
  const base = { goal_registrations: 100, status: "activo", goal_notified_at: null, registros: 100 };
  assert.equal(metaAlcanzada(base), true);
  assert.equal(metaAlcanzada({ ...base, registros: 99 }), false);
  assert.equal(metaAlcanzada({ ...base, registros: 250 }), true);
  assert.equal(metaAlcanzada({ ...base, goal_notified_at: "2026-10-22T12:00:00Z" }), false);
  assert.equal(metaAlcanzada({ ...base, status: "cerrado" }), false);
  assert.equal(metaAlcanzada({ ...base, goal_registrations: null }), false);
});

test("la IA se llama con la forma exacta de la guía y sin parámetros prohibidos", () => {
  const ia = leer("../lib/lanzamientos/analisis-ia.ts");
  assert.match(ia, /import "server-only"/);
  assert.match(ia, /client\.beta\.messages\.create\(/);
  assert.match(ia, /model: "claude-opus-5-5"/);
  assert.match(ia, /max_tokens: 16000/);
  assert.match(ia, /betas: \["server-side-fallback-2026-07-01"\]/);
  assert.match(ia, /fallbacks: "default"/);
  assert.match(ia, /output_config: \{ effort: "medium" \}/);
  assert.doesNotMatch(ia, /temperature|top_p|thinking|prefill/);
  assert.match(ia, /stop_reason === "refusal"/);
  assert.match(ia, /block\.type === "text"/);
  assert.match(ia, /Anthropic\.RateLimitError/);
  assert.match(ia, /Anthropic\.APIError/);
  // Sin clave devuelve un error claro en vez de lanzar.
  assert.match(ia, /ANTHROPIC_API_KEY/);
});

test("el borrador y la meta son datos del owner: no están en las columnas del portal", () => {
  const datos = leer("../lib/lanzamientos/datos.ts");
  const columnas = datos.slice(datos.indexOf("const COLUMNAS_LANZAMIENTO"), datos.indexOf("const COLUMNAS_PAGINA"));
  assert.doesNotMatch(columnas, /final_draft|goal_notified_at/);
  const sql = leer("../supabase/migrations/20261103000000_final_report_draft.sql");
  for (const c of ["final_draft text", "final_draft_at timestamptz", "goal_notified_at timestamptz"]) assert.ok(sql.includes(c), c);
  assert.match(sql, /Rollback:/);
});

test("el cron ya no manda el final solo: genera borrador, avisa al owner y reserva el aviso de meta", () => {
  const cron = leer("../app/api/cron/reportes/route.ts");
  assert.doesNotMatch(cron, /enviar\(fila, "final"\)/);
  assert.doesNotMatch(cron, /final_report_sent_at: new Date/);
  assert.match(cron, /\.is\("final_draft", null\)/);
  assert.match(cron, /borradorDeAnalisis\(/);
  assert.match(cron, /avisoBorradorEmail\(/);
  assert.match(cron, /\.is\("goal_notified_at", null\)/);
  assert.match(cron, /goal_notified_at: null/);
});
