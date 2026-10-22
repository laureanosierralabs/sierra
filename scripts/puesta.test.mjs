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

/* ───────────── Listo para compartir ───────────── */

test("listo para compartir: completo cuando no falta nada obligatorio", async () => {
  const { evaluarPuesta, resumenPuesta } = await import("../lib/lanzamientos/puesta.ts");
  const pdfs = { pdf_desktop: "https://a.co/1", pdf_mobile: "https://a.co/2", pdf_tablet: "https://a.co/3", copy: "https://a.co/4" };
  const base = {
    lanzamiento: { starts_on: "2026-10-01", ends_on: "2026-10-30", goal_registrations: 1000, cover_url: "f", banner_url: "b" },
    paginas: [
      { id: "p1", name: "Registro", url: "https://x.co", kind: "registro", site_id: "s", path: "/", deliverables: pdfs },
      { id: "p2", name: "Venta", url: "https://x.co/v", kind: "venta", site_id: "s", path: "/v", deliverables: pdfs },
    ],
    registros: [{ page_id: "p1", registered_at: "2026-10-02T12:00:00Z" }],
    visitas: [
      { page_id: "p1", day: "2026-10-02", utm_source: null, visitors: 10 },
      { page_id: "p2", day: "2026-10-02", utm_source: null, visitors: 4 },
    ],
    compras: [],
    mailerliteConectado: true,
    portal: { habilitado: true, personas: 1, portada: true },
    accesosEnPortal: 2,
  };
  const r = resumenPuesta(evaluarPuesta(base));
  assert.equal(r.listo, true);
  assert.equal(r.faltan, 0);

  // Faltan banner, visitas de una landing, la venta sin kit y alguien con acceso.
  const incompleto = evaluarPuesta({
    ...base,
    lanzamiento: { ...base.lanzamiento, banner_url: null },
    paginas: [base.paginas[0], { ...base.paginas[1], site_id: null }],
    visitas: [base.visitas[0]],
    portal: { habilitado: true, personas: 0, portada: false },
  });
  const faltan = incompleto.filter((c) => c.estado === "falta").map((c) => c.id).sort();
  assert.deepEqual(faltan, ["banner", "personas", "ventas", "visitas"]);
  assert.match(incompleto.find((c) => c.id === "visitas").detalle, /Venta/);
  // La portada es sugerencia, no bloquea.
  assert.equal(incompleto.find((c) => c.id === "portada").estado, "sugerido");
});

test("listo para compartir: si Clerk no responde, el portal no se marca como faltante", async () => {
  const { evaluarPuesta } = await import("../lib/lanzamientos/puesta.ts");
  const chequeos = evaluarPuesta({
    lanzamiento: { starts_on: null, ends_on: null, goal_registrations: null, cover_url: null, banner_url: null },
    paginas: [],
    registros: [],
    visitas: [],
    compras: [],
    mailerliteConectado: false,
    portal: undefined,
    accesosEnPortal: 0,
  });
  assert.equal(chequeos.some((c) => c.id === "portal"), false);
  assert.equal(chequeos.find((c) => c.id === "landings").estado, "falta");
  // Sin landings no se evalúan visitas ni registros.
  assert.equal(chequeos.some((c) => c.id === "visitas" || c.id === "registros"), false);
});
