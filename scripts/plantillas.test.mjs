import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { urlHttp } = await import("../lib/landing/propuesta.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const acciones = leer("../app/landing-pages/acciones.ts");
const funcion = (nombre) => {
  const desde = acciones.slice(acciones.indexOf(`export async function ${nombre}(`));
  return desde.slice(0, desde.indexOf("\n}\n"));
};

test("plantillas y portfolio: todo es del owner", () => {
  for (const nombre of [
    "guardarComoPlantilla",
    "usarPlantilla",
    "borrarPlantilla",
    "guardarTrabajoPortfolio",
    "borrarTrabajoPortfolio",
    "mostrarPortfolio",
  ]) {
    assert.match(funcion(nombre).slice(0, 300), /await exigirOwner\(\);/, nombre);
  }
});

test("una plantilla no se lleva el cliente ni los proyectos; al usarla nace en borrador", () => {
  const guardar = funcion("guardarComoPlantilla");
  assert.doesNotMatch(guardar, /client_id|project_id/);
  const usar = funcion("usarPlantilla");
  assert.match(usar, /commercial_status: "draft"/);
  assert.match(usar, /project_id: null/);
  // Lo que viene de la plantilla se revalida como cualquier otra entrada.
  assert.match(usar, /includes: validarIncluye\(p\.includes\)/);
  assert.match(usar, /funnel: validarEmbudo\(p\.funnel\)/);
  assert.match(usar, /url: urlHttp\(i\.url\)/);
});

test("portfolio: solo links http(s); el link público no expone el interruptor interno", () => {
  assert.equal(urlHttp("https://laureanosierra.com/a.jpg"), "https://laureanosierra.com/a.jpg");
  assert.equal(urlHttp("javascript:alert(1)"), null);
  assert.equal(urlHttp("data:image/png;base64,xx"), null);
  assert.equal(urlHttp("  "), null);
  const datos = leer("../lib/landing/datos.ts");
  const publica = datos.slice(datos.indexOf("export async function obtenerCotizacionPublica("));
  assert.match(publica, /const \{ clients, quote_items, show_portfolio, \.\.\.resto \}/);
  assert.match(publica, /show_portfolio === false \? \[\] : await listarPortfolio\(\)\.catch/);
});
