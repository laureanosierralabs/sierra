import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("la migración de marcas mueve proyectos y sus cotizaciones, y es idempotente", () => {
  const sql = leer("../supabase/migrations/20261019000000_client_operators.sql");
  // Un cliente no puede operarse a sí mismo.
  assert.match(sql, /check \(operated_by is null or operated_by <> id\)/);
  // Solo se mueven proyectos de la marca indicada, desde su operador.
  assert.match(sql, /update projects set client_id = aida\s+where client_id = oriana and name ilike '%\| aida qui%'/);
  assert.match(sql, /update projects set client_id = pilar\s+where client_id = ismael and name ilike '%\| pilar sousa%'/);
  // La marca paga: pasa una cotización solo si TODOS sus proyectos son de la marca.
  assert.match(sql, /update quotes q set client_id = aida\s+where q\.client_id = oriana/);
  assert.match(sql, /p\.client_id is distinct from aida/);
  assert.match(sql, /p\.client_id is distinct from pilar/);
  // Un link de lanzamiento a un proyecto de otro cliente se desvincula.
  assert.match(sql, /update launch_pages lp set project_id = null/);
  // Idempotente: Aida se crea solo si no existe, y el operador solo si estaba vacío.
  assert.match(sql, /if aida is null then/);
  assert.match(sql, /where id = aida and operated_by is null/);
});

test("guardar un cliente desde un form sin el campo no borra su operador", () => {
  const acciones = leer("../app/landing-pages/acciones.ts");
  const guardar = acciones.slice(acciones.indexOf("export async function guardarCliente"));
  const cuerpo = guardar.slice(0, guardar.indexOf("\n}\n"));
  assert.match(cuerpo, /if \(fd\.has\("operated_by"\)\)/);
  assert.match(cuerpo, /no puede operarse a sí mismo/);
  // La fila base no incluye operated_by: solo entra si vino en el form.
  const fila = cuerpo.slice(cuerpo.indexOf("const fila = {"), cuerpo.indexOf("};"));
  assert.doesNotMatch(fila, /operated_by/);
});
