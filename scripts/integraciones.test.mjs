import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { diaBuenosAires, dentroDeVentana, esContactoDePrueba, tieneTag, contactoAFila } = await import(
  "../lib/integraciones/ghl-puro.ts"
);

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("diaBuenosAires usa la hora de Buenos Aires", () => {
  assert.equal(diaBuenosAires("2026-10-11T01:30:00Z"), "2026-10-10");
  assert.equal(diaBuenosAires("no es fecha"), null);
});

test("dentroDeVentana es inclusiva en ambos extremos, en días de Buenos Aires", () => {
  const v = { starts_on: "2026-10-10", ends_on: "2026-10-12" };
  assert.equal(dentroDeVentana("2026-10-10T03:00:00Z", v), true);
  assert.equal(dentroDeVentana("2026-10-13T02:59:00Z", v), true); // 23:59 del 12 en BA
  assert.equal(dentroDeVentana("2026-10-13T03:00:00Z", v), false);
  assert.equal(dentroDeVentana("2026-10-10T02:59:00Z", v), false); // 23:59 del 9 en BA
  assert.equal(dentroDeVentana(null, v), false);
});

test("dentroDeVentana: un extremo abierto, y sin extremos no afirma nada", () => {
  assert.equal(dentroDeVentana("2026-10-20T12:00:00Z", { starts_on: "2026-10-10", ends_on: null }), true);
  assert.equal(dentroDeVentana("2026-10-01T12:00:00Z", { starts_on: "2026-10-10", ends_on: null }), false);
  assert.equal(dentroDeVentana("2026-10-20T12:00:00Z", { starts_on: null, ends_on: null }), false);
});

test("esContactoDePrueba detecta los mails del equipo y de prueba", () => {
  for (const e of ["laureanosierra.dev@gmail.com", "PRUEBA1@x.com", "test@x.com", "a.Prueba@x.com"])
    assert.equal(esContactoDePrueba({ email: e }), true, e);
  for (const e of ["ana@x.com", "", null, undefined]) assert.equal(esContactoDePrueba({ email: e }), false, String(e));
});

test("tieneTag ignora mayúsculas y espacios", () => {
  assert.equal(tieneTag({ tags: ["Compra-Bootcamp-Oct26 "] }, "compra-bootcamp-oct26"), true);
  assert.equal(tieneTag({ tags: null }, "x"), false);
});

const mapeo = { tag: "t", page_id: "p1", amount: 297, currency: "EUR" };
const ventana = { starts_on: "2026-10-10", ends_on: "2026-10-12" };

test("contactoAFila guarda la fecha solo si vino de payment_link y cae en la ventana", () => {
  const ok = contactoAFila({ id: "c1", source: "payment_link", dateAdded: "2026-10-11T15:00:00Z" }, mapeo, "cl", ventana);
  assert.equal(ok.occurred_at, "2026-10-11T15:00:00.000Z");
  assert.equal(ok.external_id, "ghl:c1");
  assert.equal(ok.list_price, true);
  assert.equal(ok.source, "ghl");
  assert.equal(ok.amount, 297);
  const otraFuente = contactoAFila({ id: "c2", source: "form", dateAdded: "2026-10-11T15:00:00Z" }, mapeo, "cl", ventana);
  assert.equal(otraFuente.occurred_at, null);
  const fuera = contactoAFila({ id: "c3", source: "payment_link", dateAdded: "2026-09-01T15:00:00Z" }, mapeo, "cl", ventana);
  assert.equal(fuera.occurred_at, null);
});

test("las acciones de integraciones son solo del owner y el token no se devuelve", () => {
  const src = leer("../app/landing-pages/integraciones-acciones.ts");
  const nombres = [...src.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
  assert.ok(nombres.length >= 4);
  for (const n of nombres) {
    const i = src.indexOf(`export async function ${n}`);
    const cuerpo = src.slice(src.indexOf("{\n", i) + 1, i + 600).trimStart();
    assert.match(cuerpo, /^await exigirOwner\(\);/, n);
  }
  const datos = leer("../lib/integraciones/datos.ts");
  assert.doesNotMatch(datos, /select\([^)]*token_encrypted/);
});

test("el cron de GHL exige CRON_SECRET", () => {
  const src = leer("../app/api/cron/ghl/route.ts");
  assert.match(src, /CRON_SECRET/);
  assert.match(src, /sincronizarTodas/);
});
