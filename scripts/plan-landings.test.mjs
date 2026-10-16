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

const { planificarLandings, nombreDeRuta, esRutaDeLanding } = await import("../lib/lanzamientos/plan-landings.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const sitio = { id: "s", domain: "pilarsousa.com", rutas: ["/bootcamp", "/mision-origen", "/gracias", "/ventas", "/"] };

test("cargar todas: proyectos primero, después las rutas detectadas que nadie cargó", () => {
  const proyectos = [
    { id: "p1", name: "Misión Origen | Pilar Sousa", site_url: "https://pilarsousa.com/mision-origen", page_type: "registro" },
    { id: "p2", name: "Game | Pilar Sousa", site_url: null, page_type: "ventas" },
  ];
  const plan = planificarLandings(proyectos, [sitio], []);
  assert.deepEqual(
    plan.map((l) => [l.name, l.kind, l.project_id, l.path]),
    [
      ["Game", "venta", "p2", null],
      ["Misión Origen", "registro", "p1", "/mision-origen"],
      // La ruta de Misión Origen ya la tiene su proyecto: no se repite.
      ["Bootcamp", "registro", null, "/bootcamp"],
      ["Ventas", "venta", null, "/ventas"],
      ["Inicio", "registro", null, "/"],
    ],
  );
  // La de gracias no es una landing.
  assert.ok(!plan.some((l) => l.path === "/gracias"));
  assert.equal(plan.find((l) => l.path === "/bootcamp").url, "https://pilarsousa.com/bootcamp");
});

test("cargar todas: no repite lo que el lanzamiento ya tiene", () => {
  const existentes = [
    { project_id: "p1", site_id: "s", path: "/mision-origen" },
    { project_id: null, site_id: "s", path: "/bootcamp" },
  ];
  const plan = planificarLandings(
    [{ id: "p1", name: "Misión Origen", site_url: "https://pilarsousa.com/mision-origen", page_type: null }],
    [sitio],
    existentes,
  );
  assert.deepEqual(plan.map((l) => l.path), ["/ventas", "/"]);
});

test("rutas: nombres legibles y lo que no es landing queda afuera", () => {
  assert.equal(nombreDeRuta("/lista-de-espera"), "Lista de espera");
  assert.equal(nombreDeRuta("/academia/registro_v2"), "Registro v2");
  assert.equal(nombreDeRuta("/"), "Inicio");
  for (const r of ["/gracias", "/registro/gracias", "/thank-you", "/privacidad", "/api/x"]) assert.equal(esRutaDeLanding(r), false, r);
  for (const r of ["/registro", "/activacion-v2", "/graciela"]) assert.equal(esRutaDeLanding(r), true, r);
});

test("cargar todas: solo el owner, y el cliente sale del lanzamiento", () => {
  const acciones = leer("../app/landing-pages/lanzamiento-acciones.ts");
  const fn = acciones.slice(acciones.indexOf("export async function cargarTodasLasLandings("));
  assert.match(fn.slice(0, 200), /await exigirOwner\(\);/);
  assert.match(fn, /from\("launches"\)\s*\.select\("client_id"\)/);
  const helper = acciones.slice(acciones.indexOf("async function cargarLandings("));
  const cuerpo = helper.slice(0, helper.indexOf("\n}\n"));
  assert.match(cuerpo, /from\("projects"\)[^\n]*\.eq\("client_id", clientId\)/);
  assert.match(cuerpo, /from\("client_sites"\)[^\n]*\.eq\("client_id", clientId\)/);
});
