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

const { reporteLanzamientoEmail, leerDestinatarios, urlBaseApp } = await import("../lib/lanzamientos/reporte-diario.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const HOY = "2026-10-23";
const pagina = (id, kind = "registro") => ({ id, name: id, kind, site_id: "s1", path: `/${id}` });
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
  paginas: [pagina("p1")],
  registros: [reg(1, "2026-10-22"), reg(2, "2026-10-22"), reg(3, "2026-10-21", { utm_campaign: "camp-B", utm_content: null })],
  visitas: [
    { page_id: "p1", day: "2026-10-22", utm_source: "ig", visitors: 20 },
    { page_id: "p1", day: "2026-10-21", utm_source: "fb", visitors: 30 },
    { page_id: "p1", day: "2026-10-21", utm_source: null, visitors: 10 },
  ],
  referrers: [{ page_id: "p1", day: "2026-10-21", referrer_host: "l.instagram.com", visitors: 10 }],
  compras: [],
  despues: null,
  ...extra,
});

const entrada = (extra = {}) => ({
  tipo: "diario",
  nombre: "Lanzamiento Octubre",
  detalle: detalle(),
  hoy: HOY,
  urlPanel: "https://app.ejemplo.com/portal/pilar/lanzamientos/abc",
  urlReporte: "https://app.ejemplo.com/portal/pilar/lanzamientos/abc/reporte",
  ...extra,
});

test("el asunto lleva el lanzamiento y el día resumido (ayer)", () => {
  const { subject } = reporteLanzamientoEmail(entrada());
  assert.equal(subject, "Lanzamiento Octubre · resumen del 22/10/2026");
});

test("el diario compara ayer con el acumulado", () => {
  const { html, text } = reporteLanzamientoEmail(entrada());
  // Ayer: 20 visitantes, 2 registros. Acumulado: 60 visitantes, 3 registros.
  assert.match(text, /Visitantes: 20 \/ 60/);
  assert.match(text, /Registros: 2 \/ 3/);
  assert.match(text, /Conversión: 10 % \/ 5 %/);
  assert.ok(html.includes("Ayer (22/10/2026)"));
  assert.ok(html.includes("Acumulado"));
});

test("muestra top de fuentes, campañas, anuncios y origen sin UTM", () => {
  const { text } = reporteLanzamientoEmail(entrada());
  assert.match(text, /- fb: 30 visitantes/);
  assert.match(text, /- camp-A: 2 registros/);
  assert.match(text, /- ad-1: 2 registros/);
  assert.match(text, /- Instagram: 10 visitantes/);
});

test("el top se corta en 3", () => {
  const registros = ["a", "b", "c", "d", "e"].map((c, i) => reg(i, "2026-10-22", { utm_campaign: c }));
  const { text } = reporteLanzamientoEmail(entrada({ detalle: detalle({ registros }) }));
  const campanas = text.split("CAMPAÑAS (POR REGISTROS)")[1].split("\n\n")[0];
  assert.equal(campanas.split("\n").filter((l) => l.startsWith("- ")).length, 3);
});

test("sin ventas no hay filas de ventas; con ventas se rotula el precio de lista", () => {
  assert.doesNotMatch(reporteLanzamientoEmail(entrada()).text, /Ventas/);
  const compras = [
    { id: "c1", page_id: "p1", amount: 100, currency: "USD", occurred_at: "2026-10-22T15:00:00Z", list_price: true },
    { id: "c2", page_id: "p1", amount: 50, currency: "USD", occurred_at: "2026-10-20T15:00:00Z", list_price: true },
  ];
  const { text, html } = reporteLanzamientoEmail(entrada({ detalle: detalle({ compras }) }));
  assert.match(text, /Ventas: 1 \/ 2/);
  assert.match(text, /Ingresos \(precio de lista\)/);
  assert.ok(html.includes("sin cupones ni reembolsos"));
});

test("WhatsApp y webinar aparecen como N de M cuando hay datos", () => {
  const despues = {
    eventos: [{ site_id: "s1", kind: "whatsapp_click", path: "/p1", email: "p1@x.com", target: null, day: "2026-10-22" }],
    webinar: [
      { email: "p1@x.com", day: "2026-10-22" },
      { email: "p2@x.com", day: "2026-10-22" },
    ],
  };
  const { text } = reporteLanzamientoEmail(entrada({ detalle: detalle({ despues }) }));
  assert.match(text, /Entraron al grupo de WhatsApp: 1 de 3/);
  assert.match(text, /Se conectaron al webinar: 2 de 3/);
  assert.doesNotMatch(reporteLanzamientoEmail(entrada()).text, /DESPUÉS DEL REGISTRO/);
});

test("el botón lleva al panel; sin portal no hay botón", () => {
  const { html, text } = reporteLanzamientoEmail(entrada());
  assert.ok(html.includes('href="https://app.ejemplo.com/portal/pilar/lanzamientos/abc"'));
  assert.ok(html.includes("Ver el panel completo"));
  assert.ok(text.includes("https://app.ejemplo.com/portal/pilar/lanzamientos/abc"));
  const sin = reporteLanzamientoEmail(entrada({ urlPanel: null }));
  assert.ok(!sin.html.includes("Ver el panel completo"));
});

test("el final usa todo el lanzamiento y apunta al reporte de cierre", () => {
  const { subject, html, text } = reporteLanzamientoEmail(entrada({ tipo: "final" }));
  assert.equal(subject, "Lanzamiento Octubre · resumen final");
  assert.match(text, /Visitantes: 60/);
  assert.doesNotMatch(text, /Ayer/);
  assert.ok(html.includes('href="https://app.ejemplo.com/portal/pilar/lanzamientos/abc/reporte"'));
  assert.ok(html.includes("Ver el reporte de cierre"));
});

test("escapa todo lo dinámico en el HTML", () => {
  const registros = [reg(1, "2026-10-22", { utm_campaign: `<img src=x onerror=1>`, utm_content: `"><script>` })];
  const { html, subject } = reporteLanzamientoEmail(
    entrada({ nombre: `<b>Hola</b> & "Co"`, detalle: detalle({ registros }), urlPanel: `https://x.com/?a=1&b="2"` }),
  );
  assert.ok(!html.includes("<b>Hola</b>"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;b&gt;Hola&lt;/b&gt; &amp; &quot;Co&quot;"));
  assert.ok(html.includes('href="https://x.com/?a=1&amp;b=&quot;2&quot;"'));
  assert.ok(subject.includes("<b>Hola</b>"));
});

test("leerDestinatarios normaliza, deduplica y valida", () => {
  assert.deepEqual(leerDestinatarios(" Ana@X.com, ana@x.com;\nbob@y.org  "), { emails: ["ana@x.com", "bob@y.org"] });
  assert.deepEqual(leerDestinatarios(""), { emails: [] });
  assert.ok("error" in leerDestinatarios("ana@x.com, nope"));
  const once = Array.from({ length: 11 }, (_, i) => `u${i}@x.com`).join(",");
  assert.ok("error" in leerDestinatarios(once));
  assert.equal(leerDestinatarios(Array.from({ length: 10 }, (_, i) => `u${i}@x.com`).join(",")).emails.length, 10);
});

test("urlBaseApp prefiere APP_URL y cae a la URL de producción de Vercel", () => {
  assert.equal(urlBaseApp({ APP_URL: "https://panel.ejemplo.com/" }), "https://panel.ejemplo.com");
  assert.equal(urlBaseApp({ VERCEL_PROJECT_PRODUCTION_URL: "mi-app.vercel.app" }), "https://mi-app.vercel.app");
  assert.equal(urlBaseApp({}), "");
});

test("el cron exige el secreto, es público en el proxy y está agendado", () => {
  const ruta = leer("../app/api/cron/reportes/route.ts");
  assert.match(ruta, /if \(!secreto\) return false/);
  assert.match(ruta, /Bearer \$\{secreto\}/);
  assert.match(ruta, /status: 401/);
  assert.match(leer("../proxy.ts"), /"\/api\/cron\/\(\.\*\)"/);
  const vercel = JSON.parse(leer("../vercel.json"));
  assert.deepEqual(vercel.crons, [{ path: "/api/cron/reportes", schedule: "0 12 * * *" }]);
});

test("las columnas del reporte no salen en las lecturas del portal", () => {
  const datos = leer("../lib/lanzamientos/datos.ts");
  assert.doesNotMatch(datos, /daily_report|report_recipients|last_daily_report_on|final_report_sent_at/);
  assert.match(leer("../lib/lanzamientos/reporte-diario-datos.ts"), /daily_report, report_recipients/);
  const sql = leer("../supabase/migrations/20261102000000_launch_reports.sql");
  for (const c of ["daily_report", "report_recipients", "last_daily_report_on", "final_report_sent_at"]) {
    assert.match(sql, new RegExp(`add column if not exists ${c}`));
  }
});
