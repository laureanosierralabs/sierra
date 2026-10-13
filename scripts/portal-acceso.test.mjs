import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { esUsuarioCliente, esRutaPortal, puedeVerRuta, rutaInicial } = await import(
  "../lib/unidades.ts"
);

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8");

test("solo role 'client' explícito es usuario de cliente", () => {
  assert.equal(esUsuarioCliente({ role: "client" }), true);
  // Sin rol, member u owner: equipo interno, nunca cliente.
  assert.equal(esUsuarioCliente(undefined), false);
  assert.equal(esUsuarioCliente({}), false);
  assert.equal(esUsuarioCliente({ role: "member", units: ["landing-pages"] }), false);
  assert.equal(esUsuarioCliente({ role: "owner" }), false);
  assert.equal(esUsuarioCliente({ role: "Client" }), false);
});

test("esRutaPortal reconoce /portal y sus subrutas, nada más", () => {
  assert.equal(esRutaPortal("/portal"), true);
  assert.equal(esRutaPortal("/portal/aida-qui"), true);
  assert.equal(esRutaPortal("/portales"), false);
  assert.equal(esRutaPortal("/landing-pages/portal"), false);
});

test("un member del equipo no entra al portal; el owner sí", () => {
  assert.equal(puedeVerRuta(false, ["landing-pages"], "/portal"), false);
  assert.equal(puedeVerRuta(false, ["landing-pages"], "/portal/aida-qui"), false);
  assert.equal(puedeVerRuta(true, [], "/portal/aida-qui"), true);
  // Un usuario sin unidades (como un cliente) no ve ninguna ruta interna.
  assert.equal(puedeVerRuta(false, [], "/landing-pages/clients"), false);
  assert.equal(rutaInicial(false, []), "/sin-acceso");
});

test("el middleware confina al cliente al portal y corta si Clerk falla", () => {
  const proxy = leer("../proxy.ts");
  assert.match(proxy, /if \(esUsuarioCliente\(metadata\)\) \{\s*if \(esRutaPortal\(req\.nextUrl\.pathname\)\) return seguir\(req\);\s*return NextResponse\.redirect\(new URL\(RUTA_PORTAL/);
  // Fail-closed: el catch responde 503, ya no deja pasar con `return;`.
  assert.match(proxy, /catch \(e\) \{[\s\S]*?status: 503/);
  assert.doesNotMatch(proxy, /catch \(e\) \{\s*console\.error\([^)]*\);\s*return;\s*\}/);
});

test("las acciones del panel rechazan usuarios de cliente", () => {
  const acciones = leer("../app/landing-pages/acciones.ts");
  assert.match(acciones, /async function exigirSesion\(\) \{[\s\S]*?if \(esCliente\) throw new Error/);
  const portal = leer("../app/landing-pages/portal-acciones.ts");
  // Toda acción exportada del portal pasa por exigirOwner.
  const exportadas = [...portal.matchAll(/export async function (\w+)\([^)]*\) \{\n\s*await exigirOwner\(\)/g)];
  assert.equal(exportadas.length, (portal.match(/export async function/g) ?? []).length);
});

test("la invitación al portal se consume: quitar el acceso no se deshace solo", () => {
  const contexto = leer("../lib/portal/contexto.ts");
  // Tras usar portalOrgId se borra de la metadata; si quedara, la próxima
  // visita recrearía la membresía que el owner quitó.
  assert.match(contexto, /updateUserMetadata\(usuario\.id, \{ publicMetadata: \{ portalOrgId: null \} \}\)/);
  const equipo = leer("../app/landing-pages/equipo-acciones.ts");
  // Las acciones del equipo no tocan cuentas de clientes.
  assert.equal((equipo.match(/await exigirDelEquipo\(userId\)/g) ?? []).length, 2);
});

test("el portal no lee datos del panel sin filtro de cliente", () => {
  for (const ruta of ["../lib/portal/datos.ts", "../app/portal/[org]/page.tsx", "../app/portal/page.tsx"]) {
    assert.doesNotMatch(leer(ruta), /@\/lib\/landing\/datos/, ruta);
  }
  const datos = leer("../lib/portal/datos.ts");
  for (const [, cuerpo] of datos.matchAll(/export async function \w+\(ctx: ContextoPortal\)[^{]*\{([\s\S]*?)\n\}/g)) {
    assert.match(cuerpo, /\.eq\("client_id", ctx\.clientId\)/);
  }
});
