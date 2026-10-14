import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { puedeVerRuta, DEFINICIONES } = await import("../lib/unidades.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("Mis cobros: cada persona ve solo sus acuerdos, filtrados por su sesión", () => {
  const datos = leer("../lib/landing/mis-cobros.ts");
  // El filtro sale de auth(), nunca de un parámetro.
  assert.match(datos, /export async function misAcuerdos\(\): Promise<MiAcuerdo\[\]>/);
  assert.match(datos, /const \{ userId \} = await auth\(\);/);
  assert.match(datos, /\.eq\("member_user_id", userId\)/);
  // Las notas del acuerdo son internas: no se seleccionan.
  const select = datos.slice(datos.indexOf(".select("), datos.indexOf(".eq(\"member_user_id\""));
  assert.doesNotMatch(select, /\bnotes\b/);
  assert.doesNotMatch(select, /member_name/);
});

test("solo una cuenta del equipo puede quedar vinculada a un acuerdo", () => {
  const acciones = leer("../app/landing-pages/acciones.ts");
  const guardar = acciones.slice(acciones.indexOf("export async function guardarAcuerdo"));
  assert.match(guardar.slice(0, 1500), /await exigirOwner\(\);/);
  assert.match(guardar.slice(0, 1500), /esUsuarioCliente\(usuario\.publicMetadata\)/);
});

test("el menú muestra Mis cobros al equipo y no al owner; un member puede entrar", () => {
  const seccion = DEFINICIONES["landing-pages"].secciones.find((s) => s.href === "/landing-pages/mis-cobros");
  assert.ok(seccion);
  assert.equal(seccion.soloEquipo, true);
  assert.notEqual(seccion.owner, true);
  assert.equal(puedeVerRuta(false, ["landing-pages"], "/landing-pages/mis-cobros"), true);
  // Un member de otra unidad no.
  assert.equal(puedeVerRuta(false, ["wonder-digital"], "/landing-pages/mis-cobros"), false);
  assert.match(leer("../components/common/sidebar/data.ts"), /esOwner \? !s\.soloEquipo : !s\.owner/);
});
