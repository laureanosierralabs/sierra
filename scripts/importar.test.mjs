import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { parsearCsv, detectarColumnas, fechaImportada, registroValido, leerRegistros } = await import(
  "../lib/lanzamientos/importar.ts"
);
const { tipoLandingDeProyecto } = await import("../lib/lanzamientos/tipos.ts");

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("parsearCsv: comillas, comas adentro, saltos de línea, BOM, CRLF y separador ;", () => {
  assert.deepEqual(parsearCsv('﻿email,nombre\r\na@b.com,"Pérez, Ana"\r\n'), [
    ["email", "nombre"],
    ["a@b.com", "Pérez, Ana"],
  ]);
  assert.deepEqual(parsearCsv('email;nota\nx@y.com;"dijo ""hola""\nchau"\n\n'), [
    ["email", "nota"],
    ["x@y.com", 'dijo "hola"\nchau'],
  ]);
});

test("detectarColumnas: reconoce nombres de Supabase, MailerLite y Sheets en español", () => {
  assert.deepEqual(detectarColumnas(["id", "created_at", "nombre", "Email", "Teléfono", "utm_source"]), {
    email: 3,
    name: 2,
    phone: 4,
    registered_at: 1,
    utm_source: 5,
  });
  assert.equal(detectarColumnas(["Correo electrónico", "WhatsApp"]).email, 0);
  assert.equal(detectarColumnas(["Correo electrónico", "WhatsApp"]).phone, 1);
  assert.equal(detectarColumnas(["id", "nombre"]).email, -1);
});

test("fechaImportada: ISO, día/mes/año en hora de Buenos Aires, y basura a null", () => {
  assert.equal(fechaImportada("2026-09-14T10:00:00Z"), "2026-09-14T10:00:00.000Z");
  assert.equal(fechaImportada("2026-09-14 10:00:00+00"), "2026-09-14T10:00:00.000Z");
  assert.equal(fechaImportada("14/09/2026 10:30"), "2026-09-14T13:30:00.000Z");
  assert.equal(fechaImportada("2026-09-14"), "2026-09-14T03:00:00.000Z");
  for (const mala of ["", "ayer", "09/14/2026", "31/02/2026", "2001-01-01", "2099-01-01"]) {
    assert.equal(fechaImportada(mala), null, mala);
  }
});

test("registroValido: exige email, recorta campos y no acepta tipos raros", () => {
  assert.equal(registroValido({ email: "no-es-mail" }), null);
  assert.equal(registroValido({ email: 3 }), null);
  const r = registroValido({ email: "  ANA@Mail.com ", name: "x".repeat(300), phone: { a: 1 } });
  assert.equal(r.email, "ana@mail.com");
  assert.equal(r.name.length, 200);
  assert.equal(r.phone, null);
  assert.equal(r.registered_at, null);
});

test("leerRegistros: descarta sin email y cuenta una vez cada email", () => {
  const csv = "email,nombre,fecha\na@b.com,Ana,14/09/2026\n,Sin mail,\nA@B.com,Ana otra vez,\nc@d.com,,\n";
  const r = leerRegistros(csv);
  assert.equal(r.registros.length, 2);
  assert.equal(r.descartadas, 1);
  assert.equal(r.repetidos, 1);
  assert.equal(r.registros[0].registered_at, "2026-09-14T03:00:00.000Z");
});

test("la importación es del owner, valida en el servidor y no duplica", () => {
  const acciones = leer("../app/landing-pages/lanzamiento-acciones.ts");
  const cuerpo = acciones.slice(acciones.indexOf("export async function importarRegistros("));
  const fn = cuerpo.slice(0, cuerpo.indexOf("\n}\n"));
  assert.match(fn, /await exigirOwner\(\);/);
  // El cliente sale del lanzamiento y cada fila se revalida.
  assert.match(fn, /from\("launches"\)\.select\("client_id"\)/);
  assert.match(fn, /registroValido\(/);
  assert.match(fn, /\.eq\("launch_id", launchId\)/);
  // Idempotente por (lanzamiento, email).
  assert.match(fn, /external_id: `import:\$\{r\.email\}`/);
  assert.match(fn, /onConflict: "launch_id,external_id", ignoreDuplicates: true/);
});

test("tipo de landing: el proyecto de ventas se mide como venta, el resto como registro", () => {
  assert.equal(tipoLandingDeProyecto("ventas"), "venta");
  assert.equal(tipoLandingDeProyecto("registro"), "registro");
  assert.equal(tipoLandingDeProyecto(null), "registro");
  const sql = leer("../supabase/migrations/20261020000000_launch_page_kind.sql");
  assert.match(sql, /check \(kind in \('registro', 'venta'\)\)/);
  assert.match(sql, /p\.page_type = 'ventas'/);
});

test("detectarColumnas: la fecha de registro no es updated_at ni la de baja; acepta TSV", () => {
  assert.equal(detectarColumnas(["email", "updated_at", "created_at"]).registered_at, 2);
  assert.equal(detectarColumnas(["email", "unsubscribed_at", "fecha"]).registered_at, 2);
  assert.equal(detectarColumnas(["email", "updated_at"]).registered_at, -1);
  assert.deepEqual(parsearCsv("email\tnombre\na@b.com\tAna\n"), [["email", "nombre"], ["a@b.com", "Ana"]]);
  // Una coma entre comillas en el encabezado no cambia el separador.
  assert.deepEqual(parsearCsv('"a,b";email\nx;y@z.com\n')[1], ["x", "y@z.com"]);
});
