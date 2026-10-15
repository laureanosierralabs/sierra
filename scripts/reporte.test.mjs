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

const { armarReporte } = await import("../lib/lanzamientos/reporte.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const pagina = (id, name, kind) => ({ id, name, kind, launch_id: "l", url: null, thanks_url: null, whatsapp_url: null, checkout_url: null, project_id: null, mailerlite_group_id: null, track_key: id, site_id: null, path: null, position: 0 });
const registro = (id, page_id, dia, utm_source = null) => ({ id, page_id, email: `${id}@x.com`, name: null, phone: null, utm_source, utm_medium: null, utm_campaign: null, utm_content: null, registered_at: `${dia}T15:00:00Z`, extra: null });

const detalle = {
  lanzamiento: { id: "l", client_id: "c", name: "Octubre", status: "cerrado", starts_on: "2026-10-01", ends_on: "2026-10-10", goal_registrations: 4, closing_notes: null, created_at: "2026-09-20T00:00:00Z" },
  paginas: [pagina("a", "Registro A", "registro"), pagina("b", "Registro B", "registro"), pagina("v", "Venta", "venta")],
  registros: [registro("1", "a", "2026-10-02", "meta"), registro("2", "a", "2026-10-02", "meta"), registro("3", "b", "2026-10-03")],
  visitas: [
    { page_id: "a", day: "2026-10-02", utm_source: "meta", visitors: 20 },
    { page_id: "b", day: "2026-10-03", utm_source: null, visitors: 30 },
    { page_id: "v", day: "2026-10-05", utm_source: "meta", visitors: 10 },
  ],
  compras: [{ id: "x", page_id: "v", amount: 100, currency: "USD", occurred_at: "2026-10-05T12:00:00Z" }],
  truncado: false,
};

test("armarReporte: embudo, conversión por tipo, meta, pico y fuentes", () => {
  const r = armarReporte(detalle, []);
  assert.equal(r.dias, 10);
  assert.equal(r.incompleto, false);
  const invertido = armarReporte({ ...detalle, lanzamiento: { ...detalle.lanzamiento, ends_on: "2026-09-25" } }, []);
  assert.equal(invertido.dias, null);
  assert.equal(r.visitantes, 60);
  assert.equal(r.registros, 3);
  assert.equal(r.ventas, 1);
  // Registro: 3 registros / 50 visitantes de landings de registro (las de venta no diluyen).
  assert.equal(r.conversionRegistro, 6);
  assert.equal(r.conversionVenta, 10);
  assert.deepEqual(r.ingresos, [{ moneda: "USD", total: 100 }]);
  assert.deepEqual(r.meta, { objetivo: 4, logrado: 75 });
  assert.deepEqual(r.pico, { dia: "2026-10-02", registros: 2 });
  assert.deepEqual(r.porLanding.find((f) => f.id === "v"), { id: "v", name: "Venta", kind: "venta", visitantes: 10, conversiones: 1, cvr: 10 });
  assert.deepEqual(r.fuentes[0], { fuente: "meta", visitantes: 30, registros: 2 });
  // El test A/B compara landings del mismo tipo.
  assert.equal(r.tests.length, 1);
  assert.equal(r.tests[0].tipo, "registro");
  assert.equal(r.tests[0].mejor, "Registro A");
});

test("armarReporte: pedidos del lanzamiento con mediana de resolución", () => {
  const p = (kind, status, abierto, cerrado) => ({ kind, status, created_at: abierto, closed_at: cerrado });
  const r = armarReporte(detalle, [
    p("incidencia", "resuelta", "2026-10-02T10:00:00Z", "2026-10-02T12:00:00Z"),
    p("cambio", "resuelta", "2026-10-03T10:00:00Z", "2026-10-03T16:00:00Z"),
    p("aprobacion", "aprobada", "2026-10-04T10:00:00Z", "2026-10-04T11:00:00Z"),
    p("incidencia", "abierta", "2026-10-05T10:00:00Z", null),
  ]);
  assert.deepEqual(r.pedidos, { total: 4, incidencias: 2, cambios: 1, aprobaciones: 1, cerrados: 3, horasResolucion: 2 });
});

test("conclusiones: solo el owner, con tope de largo", () => {
  const acciones = leer("../app/landing-pages/lanzamiento-acciones.ts");
  const fn = acciones.slice(acciones.indexOf("export async function guardarConclusiones("));
  assert.match(fn.slice(0, 200), /\{\n\s*await exigirOwner\(\);/);
  assert.match(fn, /notas\.length > 10_000/);
  assert.match(leer("../supabase/migrations/20261023000000_launch_closing_notes.sql"), /length\(closing_notes\) <= 10000/);
});
