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

test("filtros de Mis cobros: estado, proyecto y año, con totales que responden al filtro", async () => {
  const { registerHooks } = await import("node:module");
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith("@/")) {
        return { url: new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
  });
  const { filtrarAcuerdos, opcionesDeFiltro, totalesPorMoneda, SIN_FILTROS } = await import("../lib/landing/mis-cobros-vista.ts");
  const acuerdo = (id, total, pagado, proyectos, agreed_on, currency = "USD") => ({
    id, numero: 1, title: id, total_amount: total, currency, amount_paid: pagado, payment_status: "partial",
    payment_terms: null, agreed_on, proyectos, pagos: [],
  });
  const aida = { id: "p1", name: "Aida" };
  const pilar = { id: "p2", name: "Pilar" };
  const lista = [
    acuerdo("a", 500, 200, [aida], "2026-09-01"),
    acuerdo("b", 300, 300, [pilar], "2026-10-01"),
    acuerdo("c", 100000, 0, [aida, pilar], "2025-12-01", "ARS"),
  ];
  const ids = (f) => filtrarAcuerdos(lista, { ...SIN_FILTROS, ...f }).map((a) => a.id);
  assert.deepEqual(ids({ estado: "pendientes" }), ["a", "c"]);
  assert.deepEqual(ids({ estado: "pagados" }), ["b"]);
  assert.deepEqual(ids({ proyecto: "p2" }), ["b", "c"]);
  assert.deepEqual(ids({ anio: "2025" }), ["c"]);
  assert.deepEqual(ids({ estado: "pendientes", proyecto: "p1", anio: "2026" }), ["a"]);
  const o = opcionesDeFiltro(lista);
  assert.deepEqual(o.proyectos.map((p) => p.etiqueta), ["Aida", "Pilar"]);
  assert.deepEqual(o.anios.map((a) => a.valor), ["2026", "2025"]);
  // Monedas separadas, y el pendiente nunca negativo.
  assert.deepEqual(totalesPorMoneda(filtrarAcuerdos(lista, { ...SIN_FILTROS, proyecto: "p1" })), [
    { moneda: "USD", acordado: 500, cobrado: 200, pendiente: 300 },
    { moneda: "ARS", acordado: 100000, cobrado: 0, pendiente: 100000 },
  ]);
});
