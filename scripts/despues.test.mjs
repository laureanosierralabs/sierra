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

const { validarEventoSitio, cruzarRegistrados, resumirCheckout, textoCorto } = await import(
  "../lib/lanzamientos/despues.ts"
);
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("validarEventoSitio normaliza un clic a WhatsApp", () => {
  const e = validarEventoSitio({
    s: "x",
    p: "/gracias-a/?x=1",
    k: "whatsapp_click",
    e: "  Ana@Ejemplo.COM ",
    t: "  Unirme   al grupo ",
    u: { utm_source: "ig<script>", utm_campaign: "c1", utm_medium: 3 },
  });
  assert.deepEqual(e, {
    kind: "whatsapp_click",
    path: "/gracias-a",
    email: "ana@ejemplo.com",
    target: "Unirme al grupo",
    utm: { source: "igscript", medium: null, campaign: "c1", content: null },
  });
});

test("validarEventoSitio descarta lo inválido y tolera un email malo", () => {
  assert.equal(validarEventoSitio({ p: "/a", k: "otro" }), null);
  assert.equal(validarEventoSitio({ p: "sin-barra", k: "checkout_click" }), null);
  assert.equal(validarEventoSitio(null), null);
  assert.equal(validarEventoSitio("texto"), null);
  // Un email mal escrito no invalida el clic: solo no se asocia a nadie.
  const e = validarEventoSitio({ p: "/ventas", k: "checkout_click", e: "no-es-email", t: 5 });
  assert.equal(e.email, null);
  assert.equal(e.target, null);
  assert.equal(e.kind, "checkout_click");
});

test("textoCorto limita el largo y saca control y etiquetas", () => {
  assert.equal(textoCorto("x".repeat(300), 120).length, 120);
  assert.equal(textoCorto("a\u0000b<i>", 50), "a b i");
  assert.equal(textoCorto("   ", 10), null);
  assert.equal(textoCorto(undefined, 10), null);
});

const reg = (email, fecha = "2026-10-10T12:00:00Z", page_id = "p1") => ({
  id: email + fecha,
  page_id,
  email,
  name: null,
  phone: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  registered_at: fecha,
  extra: null,
});

test("cruzarRegistrados cuenta personas distintas y calcula el porcentaje", () => {
  const registros = [reg("a@x.com"), reg("B@x.com"), reg("c@x.com"), reg("a@x.com", "2026-10-11T12:00:00Z")];
  const c = cruzarRegistrados(registros, ["A@X.com", "a@x.com", "b@x.com", "ajeno@x.com", null, "roto"]);
  assert.equal(c.total, 3);
  assert.equal(c.cruzan, 2);
  assert.equal(c.porcentaje, 66.7);
  assert.deepEqual(c.faltan.map((r) => r.email), ["c@x.com"]);
});

test("cruzarRegistrados: la fila de quien falta es la de su primer registro y sin registros no hay porcentaje", () => {
  const c = cruzarRegistrados([reg("z@x.com", "2026-10-12T00:00:00Z"), reg("z@x.com", "2026-10-09T00:00:00Z")], []);
  assert.equal(c.faltan.length, 1);
  assert.equal(c.faltan[0].registered_at, "2026-10-09T00:00:00Z");
  const vacio = cruzarRegistrados([], ["a@x.com"]);
  assert.deepEqual([vacio.total, vacio.cruzan, vacio.porcentaje, vacio.faltan.length], [0, 0, null, 0]);
});

const clic = (path, target, day = "2026-10-10", kind = "checkout_click", site_id = "s1") => ({
  site_id,
  kind,
  path,
  email: null,
  target,
  day,
});

test("resumirCheckout cuenta solo rutas del lanzamiento, por botón y dentro del período", () => {
  const paginas = [{ site_id: "s1", path: "/ventas" }, { site_id: null, path: null }];
  const eventos = [
    clic("/ventas", "Comprar ahora"),
    clic("/ventas", "Comprar ahora"),
    clic("/ventas", "Pie de página"),
    clic("/ventas", null),
    clic("/ventas", "Comprar ahora", "2026-10-20"),
    clic("/otra-pagina", "Comprar ahora"),
    clic("/ventas", "Comprar ahora", "2026-10-10", "checkout_click", "s2"),
    clic("/ventas", "x", "2026-10-10", "whatsapp_click"),
  ];
  const todo = resumirCheckout(eventos, paginas, null, 0);
  assert.equal(todo.total, 5);
  assert.deepEqual(todo.porTarget, [
    { target: "Comprar ahora", clics: 3 },
    { target: "Pie de página", clics: 1 },
    { target: null, clics: 1 },
  ]);
  assert.equal(todo.tasaCompra, null);

  const periodo = resumirCheckout(eventos, paginas, { desde: "2026-10-10", hasta: "2026-10-10", dias: 1 }, 2);
  assert.equal(periodo.total, 4);
  assert.equal(periodo.tasaCompra, 50);
  // Sin landings de la ruta (filtro a otra landing): no hay clics.
  assert.equal(resumirCheckout(eventos, [{ site_id: "s1", path: "/otra-pagina" }], null, 1).total, 1);
  assert.equal(resumirCheckout(eventos, [], null, 1).total, 0);
});

test("la migración, el endpoint y el link del webinar cumplen el contrato", () => {
  const sql = leer("../supabase/migrations/20261101000000_post_registration_events.sql");
  assert.match(sql, /create table if not exists site_events/);
  assert.match(sql, /check \(kind in \('whatsapp_click', 'checkout_click'\)\)|kind in \('whatsapp_click', 'checkout_click'\)/);
  assert.match(sql, /unique \(launch_id, kind, email, day\)/);
  assert.match(sql, /webinar_token text not null default/);
  assert.match(sql, /alter table site_events enable row level security/);
  assert.match(sql, /revoke all on table site_events, launch_events from public, anon, authenticated/);

  const proxy = leer("../proxy.ts");
  assert.match(proxy, /"\/api\/e"/);
  assert.match(proxy, /"\/w\/\(\.\*\)"/);

  // El endpoint nunca guarda la IP y no responde con error al navegador.
  const api = leer("../app/api/e/route.ts");
  assert.doesNotMatch(api, /ip:\s*ip|\bip,\s*$/m);
  assert.match(api, /huella\("evento-ip"/);
  assert.doesNotMatch(api, /status:\s*5\d\d/);

  // El ingreso al webinar se anota solo si no es un previsualizador de correo.
  const w = leer("../app/w/[token]/route.ts");
  assert.match(w, /if \(!esBot\(req\.headers\.get\("user-agent"\)\)\)/);
  assert.match(w, /status: 302/);
});
