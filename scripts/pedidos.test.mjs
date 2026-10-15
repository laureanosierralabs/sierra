import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { transicionesEquipo, decisionesCliente, validarPedido, validarComentario, estaCerrado, TIPOS_DEL_CLIENTE } =
  await import("../lib/pedidos/tipos.ts");

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const funcion = (archivo, nombre) => {
  const desde = archivo.slice(archivo.indexOf(`export async function ${nombre}(`));
  return desde.slice(0, desde.indexOf("\n}\n"));
};

test("estados: el equipo mueve incidencias y cambios; las aprobaciones las decide el cliente", () => {
  assert.deepEqual(transicionesEquipo("incidencia", "abierta"), ["en_curso", "resuelta", "descartada"]);
  assert.deepEqual(transicionesEquipo("cambio", "resuelta"), ["abierta"]);
  // El equipo solo puede retirar una aprobación abierta, no aprobarla por el cliente.
  assert.deepEqual(transicionesEquipo("aprobacion", "abierta"), ["descartada"]);
  assert.deepEqual(transicionesEquipo("aprobacion", "aprobada"), []);
  assert.deepEqual(decisionesCliente("aprobacion", "abierta"), ["aprobada", "rechazada"]);
  assert.deepEqual(decisionesCliente("aprobacion", "rechazada"), []);
  assert.deepEqual(decisionesCliente("incidencia", "abierta"), []);
  assert.equal(estaCerrado("resuelta"), true);
  assert.equal(estaCerrado("en_curso"), false);
});

test("validarPedido: el cliente no puede crear aprobaciones; título obligatorio; link solo http(s)", () => {
  assert.deepEqual(validarPedido({ kind: "aprobacion", title: "x" }, TIPOS_DEL_CLIENTE), { error: "Elegí el tipo de pedido" });
  assert.deepEqual(validarPedido({ kind: "incidencia", title: "  " }, TIPOS_DEL_CLIENTE), { error: "Falta un título" });
  assert.match(validarPedido({ kind: "cambio", title: "x", link: "javascript:alert(1)" }, TIPOS_DEL_CLIENTE).error, /http/);
  assert.deepEqual(
    validarPedido({ kind: "cambio", title: " Precio ", description: "", priority: "urgente", link: "https://a.com/x" }, TIPOS_DEL_CLIENTE),
    { kind: "cambio", title: "Precio", description: null, priority: "urgente", link: "https://a.com/x" },
  );
  // Cualquier otra prioridad cae en normal.
  assert.equal(validarPedido({ kind: "cambio", title: "x", priority: "altísima" }, TIPOS_DEL_CLIENTE).priority, "normal");
  assert.deepEqual(validarComentario("  "), { error: "Escribí un comentario" });
  assert.equal(validarComentario(" hola "), "hola");
});

test("portal: el cliente sale del contexto del portal y la vista interna no escribe", () => {
  const acciones = leer("../app/portal/pedidos-acciones.ts");
  const quien = acciones.slice(acciones.indexOf("async function quienEscribe("));
  assert.match(quien.slice(0, quien.indexOf("\n}\n")), /contextoPortal\(slug\)[\s\S]*if \(ctx\.vistaInterna\) return \{ error/);
  for (const nombre of ["crearPedidoPortal", "comentarPedidoPortal", "decidirAprobacion"]) {
    const fn = funcion(acciones, nombre);
    assert.match(fn, /await quienEscribe\(/, nombre);
    assert.doesNotMatch(fn, /texto\(fd, "client_id"\)/, `${nombre} no toma el cliente del formulario`);
  }
  // Comentar y decidir solo sobre pedidos de ESE cliente.
  const delPortal = acciones.slice(acciones.indexOf("async function pedidoDelPortal("));
  assert.match(delPortal.slice(0, delPortal.indexOf("\n}\n")), /\.eq\("client_id", ctx\.clientId\)/);
  // Decidir: solo si sigue abierta (dos clicks no deciden dos veces).
  assert.match(funcion(acciones, "decidirAprobacion"), /\.eq\("status", "abierta"\)/);
  // Crear: solo incidencias y cambios.
  assert.match(funcion(acciones, "crearPedidoPortal"), /validarPedido\(Object\.fromEntries\(fd\), TIPOS_DEL_CLIENTE\)/);
});

test("panel: solo el equipo, y el estado solo cambia por transiciones permitidas", () => {
  const acciones = leer("../app/landing-pages/pedidos-acciones.ts");
  const quien = acciones.slice(acciones.indexOf("async function quienEscribe("));
  assert.match(quien.slice(0, quien.indexOf("\n}\n")), /if \(esCliente\) return \{ error/);
  for (const nombre of ["crearAprobacion", "cambiarEstadoPedido", "comentarPedido"]) {
    assert.match(funcion(acciones, nombre), /await quienEscribe\(\)/, nombre);
  }
  const cambiar = funcion(acciones, "cambiarEstadoPedido");
  assert.match(cambiar, /transicionesEquipo\(p\.kind, p\.status\)\.includes\(estado\)/);
  assert.match(cambiar, /\.eq\("status", p\.status\)/);
});

test("lecturas: todo lo del portal filtra por cliente y no expone quién escribió en Clerk", () => {
  const datos = leer("../lib/pedidos/datos.ts");
  for (const nombre of ["pedidosDeCliente", "pedidoDeCliente"]) {
    assert.match(funcion(datos, nombre), /\.eq\("client_id", clientId\)/, nombre);
  }
  assert.doesNotMatch(datos, /created_by,|author_id/);
});

test("correcciones de la revisión: motivo antes que estado, sin emails del equipo, freno al spam", () => {
  const portal = leer("../app/portal/pedidos-acciones.ts");
  const decidir = funcion(portal, "decidirAprobacion");
  // El comentario (el motivo de un rechazo) se guarda antes de cambiar el estado.
  assert.ok(decidir.indexOf('from("client_request_comments").insert') < decidir.indexOf('.update({ status: decision'));
  assert.match(funcion(portal, "crearPedidoPortal"), /MAX_PEDIDOS_POR_HORA/);
  assert.match(funcion(portal, "comentarPedidoPortal"), /MAX_COMENTARIOS_POR_HORA/);

  const panel = leer("../app/landing-pages/pedidos-acciones.ts");
  // Del lado del equipo nunca se guarda el email (lo vería el cliente).
  assert.doesNotMatch(panel, /nombreDe\(/);
  assert.match(panel, /usuario\.firstName\?\.trim\(\) \|\| "Equipo"/);
  // Un member no vincula lanzamientos.
  assert.match(funcion(panel, "crearAprobacion"), /quien\.esOwner \? texto\(fd, "launch_id"\)/);
});
