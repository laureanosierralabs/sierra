import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { validarIncluye, validarPreguntas, validarEntrega, lineasDeRespuesta, MAX_INCLUYE } = await import(
  "../lib/landing/propuesta.ts"
);
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const acciones = leer("../app/landing-pages/acciones.ts");
const funcion = (nombre) => {
  const desde = acciones.slice(acciones.indexOf(`export async function ${nombre}(`));
  return desde.slice(0, desde.indexOf("\n}\n"));
};

test("incluye: limpia, no repite (sin importar mayúsculas) y tiene tope", () => {
  assert.deepEqual(validarIncluye(["  Diseño  ", "diseño", "", 3, "Montaje\nen WordPress"]), ["Diseño", "Montaje en WordPress"]);
  assert.deepEqual(validarIncluye("no es lista"), []);
  assert.equal(validarIncluye(Array.from({ length: 60 }, (_, i) => `Ítem ${i}`)).length, MAX_INCLUYE);
});

test("preguntas: necesitan pregunta y respuesta; no se repiten", () => {
  assert.deepEqual(
    validarPreguntas([{ q: "¿Plazos?", a: "7 días" }, { q: "¿plazos?", a: "otra" }, { q: "Sin respuesta", a: " " }, null]),
    [{ q: "¿Plazos?", a: "7 días" }],
  );
});

test("tiempo de entrega y respuestas en lista", () => {
  assert.equal(validarEntrega("  7 a 10 días hábiles "), "7 a 10 días hábiles");
  assert.equal(validarEntrega(""), null);
  assert.equal(validarEntrega("x".repeat(200)).length, 80);
  assert.deepEqual(lineasDeRespuesta("Fotos\n- Links\n\n• Accesos"), ["Fotos", "Links", "Accesos"]);
  assert.deepEqual(lineasDeRespuesta("Una sola línea."), ["Una sola línea."]);
});

test("la propuesta y la biblioteca son del owner, y duplicar copia la propuesta", () => {
  for (const nombre of ["guardarPropuesta", "guardarElementoBiblioteca", "borrarElementoBiblioteca"]) {
    assert.match(funcion(nombre).slice(0, 300), /await exigirOwner\(\);/, nombre);
  }
  assert.match(funcion("guardarPropuesta"), /validarIncluye\(crudo\)/);
  assert.match(funcion("guardarPropuesta"), /validarPreguntas\(crudo\)/);
  const duplicar = funcion("duplicarCotizacion");
  assert.match(duplicar, /includes: original\.includes/);
  assert.match(duplicar, /faq: original\.faq/);
  assert.match(duplicar, /delivery_time: original\.delivery_time/);
  // Un form que no trae el tiempo de entrega no lo borra.
  assert.match(acciones, /fd\.has\("delivery_time"\) \? \{ delivery_time:/);
});

test("el link público muestra la propuesta, revalidada al leer", () => {
  const datos = leer("../lib/landing/datos.ts");
  const publica = datos.slice(datos.indexOf("export async function obtenerCotizacionPublica("));
  assert.match(publica, /includes, faq, delivery_time/);
  assert.match(publica, /includes: validarIncluye\(/);
  assert.match(publica, /faq: validarPreguntas\(/);
  const sql = leer("../supabase/migrations/20261025000000_quote_proposal.sql");
  // La biblioteca arranca con los textos de las cotizaciones en PDF, una sola vez.
  assert.match(sql, /if not exists \(select 1 from quote_library\)/);
});

test("una respuesta hecha solo de viñetas no se guarda", () => {
  assert.deepEqual(validarPreguntas([{ q: "¿Algo?", a: "-" }, { q: "¿Otra?", a: "- Sí" }]), [{ q: "¿Otra?", a: "- Sí" }]);
});
