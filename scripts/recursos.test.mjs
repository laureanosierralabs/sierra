import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const acciones = leer("../app/landing-pages/acciones.ts");
const cuerpo = (nombre) => {
  const desde = acciones.slice(acciones.indexOf(`export async function ${nombre}(`));
  return desde.slice(0, desde.indexOf("\n}\n"));
};

test("los accesos de un cliente los gestiona solo el owner, y solo los de ESE cliente", () => {
  for (const nombre of ["guardarRecursoCliente", "borrarRecursoCliente"]) {
    assert.match(cuerpo(nombre), /await exigirOwnerDeAccesos\(\);/, nombre);
  }
  assert.match(cuerpo("guardarRecursoCliente"), /\.update\(fila\)\.eq\("id", id\)\.eq\("client_id", clientId\)/);
  assert.match(cuerpo("borrarRecursoCliente"), /\.eq\("id", id\)\s*\.eq\("client_id", clientId\)/);
});

test("los recursos de un proyecto los gestiona el owner o quien está asignado, y solo los de ESE proyecto", () => {
  for (const nombre of ["guardarRecurso", "borrarRecurso"]) {
    assert.match(cuerpo(nombre), /await exigirGestionDeProyecto\(userId, projectId\);/, nombre);
  }
  assert.match(cuerpo("guardarRecurso"), /\.update\(fila\)\.eq\("id", id\)\.eq\("project_id", projectId\)/);
  assert.match(cuerpo("borrarRecurso"), /\.eq\("id", id\)\s*\.eq\("project_id", projectId\)/);
  const helper = acciones.slice(acciones.indexOf("async function exigirGestionDeProyecto("));
  assert.match(helper.slice(0, helper.indexOf("\n}\n")), /from\("project_assignees"\)[\s\S]*\.eq\("user_id", userId\)[\s\S]*\.eq\("project_id", projectId\)/);
});
