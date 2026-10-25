import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { decidirDominio } = await import("../lib/dominios.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const ENV = {
  DOMINIO_PANEL: "app.synxbuild.com",
  DOMINIOS_VIEJOS: "app.laureanosierra.com",
  DOMINIO_CLIENTES: "clientes.synxbuild.com",
};

test("sin DOMINIO_PANEL no se redirige nada (apagado hasta que Clerk ande en el dominio nuevo)", () => {
  assert.deepEqual(decidirDominio("app.laureanosierra.com", "/landing-pages", "", {}), { tipo: "seguir" });
});

test("el dominio viejo manda las páginas al nuevo, con la ruta y la consulta", () => {
  assert.deepEqual(decidirDominio("app.laureanosierra.com", "/portal/pilar-sousa", "?vista=entrega", ENV), {
    tipo: "redirigir",
    url: "https://app.synxbuild.com/portal/pilar-sousa?vista=entrega",
  });
  assert.equal(decidirDominio("APP.LaureanoSierra.com:443", "/landing-pages", "", ENV).tipo, "redirigir");
});

test("el dominio viejo NO redirige /w ni /g: las landings los reenvían y el visitante vería el panel", () => {
  assert.deepEqual(decidirDominio("app.laureanosierra.com", "/w/abc", "?e=a@b.c", ENV), { tipo: "seguir" });
  assert.deepEqual(decidirDominio("app.laureanosierra.com", "/g/abc", "", ENV), { tipo: "seguir" });
});

test("el dominio viejo NO redirige /api: lo llaman servidores con POST", () => {
  assert.deepEqual(decidirDominio("app.laureanosierra.com", "/api/ingest", "", ENV), { tipo: "seguir" });
  assert.deepEqual(decidirDominio("app.laureanosierra.com", "/api/webhooks/mailerlite/x", "", ENV), { tipo: "seguir" });
});

test("en el dominio de clientes, /<marca> es su portal", () => {
  assert.deepEqual(decidirDominio("clientes.synxbuild.com", "/", "", ENV), { tipo: "portal", ruta: "/portal" });
  assert.deepEqual(decidirDominio("clientes.synxbuild.com", "/pilar-sousa", "", ENV), { tipo: "portal", ruta: "/portal/pilar-sousa" });
  assert.deepEqual(decidirDominio("clientes.synxbuild.com", "/pilar-sousa/lanzamientos/1", "", ENV), {
    tipo: "portal",
    ruta: "/portal/pilar-sousa/lanzamientos/1",
  });
});

test("en el dominio de clientes, login, api, portal y links públicos se atienden tal cual", () => {
  for (const ruta of ["/sign-in", "/sign-in/factor-one", "/api/t", "/portal/aida-qui", "/w/abc", "/g/abc", "/q/xyz"]) {
    assert.deepEqual(decidirDominio("clientes.synxbuild.com", ruta, "", ENV), { tipo: "seguir" }, ruta);
  }
  // Una marca que empieza igual que una ruta propia no se confunde con ella.
  assert.equal(decidirDominio("clientes.synxbuild.com", "/portales-x", "", ENV).tipo, "portal");
});

test("el panel nuevo y los demás dominios no se tocan", () => {
  assert.deepEqual(decidirDominio("app.synxbuild.com", "/landing-pages", "", ENV), { tipo: "seguir" });
  assert.deepEqual(decidirDominio("laureanosierra.vercel.app", "/", "", ENV), { tipo: "seguir" });
});

test("el proxy decide los permisos sobre la ruta reescrita", () => {
  const proxy = leer("../proxy.ts");
  assert.match(proxy, /if \(dominio\.tipo === "redirigir"\) return NextResponse\.redirect\(dominio\.url, 308\);/);
  assert.match(proxy, /puedeVerRuta\(esOwner, unidades, ruta\)/);
  assert.match(proxy, /esRutaPortal\(ruta\)/);
});
