import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const { audienciaDe } = await import("../lib/audiencia-ingreso.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("ingreso: un cliente ve la pantalla del portal; el equipo, la del panel", () => {
  assert.equal(audienciaDe({ redirect_url: "https://app.laureanosierra.com/portal/aida-qui" }), "cliente");
  assert.equal(audienciaDe({ redirect_url: "/portal" }), "cliente");
  assert.equal(audienciaDe({ para: "cliente" }), "cliente");
  assert.equal(audienciaDe({ redirect_url: "https://app.laureanosierra.com/landing-pages" }), "equipo");
  // Un "portal" en otro lado de la URL no cuenta.
  assert.equal(audienciaDe({ redirect_url: "https://x.com/landing-pages?ir=/portal" }), "equipo");
  assert.equal(audienciaDe({}), "equipo");
  assert.equal(audienciaDe({ redirect_url: "::::" }), "equipo");
});

test("la invitación al portal lleva a nuestra pantalla de registro, versión cliente", () => {
  const acciones = leer("../app/landing-pages/portal-acciones.ts");
  assert.match(acciones, /redirectUrl: `https:\/\/\$\{host\}\/sign-up\?para=cliente`/);
});
