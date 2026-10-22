import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { validarEntregables, tieneEntregables, idYoutube, miniaturaVideo } = await import("../lib/portal/entrega.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("entregables: solo links http(s) en las claves conocidas, y extras con nombre", () => {
  const e = validarEntregables({
    pdf_desktop: "https://drive.google.com/a",
    pdf_mobile: "javascript:alert(1)",
    copy: "  https://docs.google.com/b ",
    inventada: "https://x.com",
    extras: [{ etiqueta: "Guía de marca", url: "https://c.com" }, { etiqueta: "", url: "https://d.com" }, { etiqueta: "Mal", url: "ftp://e" }],
  });
  assert.deepEqual(e, {
    pdf_desktop: "https://drive.google.com/a",
    copy: "https://docs.google.com/b",
    extras: [{ etiqueta: "Guía de marca", url: "https://c.com/" }],
  });
  assert.equal(tieneEntregables(e), true);
  assert.equal(tieneEntregables(validarEntregables(null)), false);
  assert.deepEqual(validarEntregables(["x"]), {});
});

test("videos: miniatura de YouTube en sus formatos; otros servicios, sin imagen", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10",
  ]) {
    assert.equal(idYoutube(url), "dQw4w9WgXcQ", url);
  }
  assert.equal(miniaturaVideo("https://youtu.be/dQw4w9WgXcQ"), "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  assert.equal(miniaturaVideo("https://www.loom.com/share/abc"), null);
  assert.equal(idYoutube("no es url"), null);
});

test("portal: la contraseña se revela solo si es de ESE cliente y está marcada como visible", () => {
  const accion = leer("../app/portal/entrega-acciones.ts");
  assert.match(accion, /const ctx = await contextoPortal\(slug\)/);
  assert.match(accion, /\.eq\("client_id", ctx\.clientId\)\s*\.eq\("portal_visible", true\)/);
  const datos = leer("../lib/portal/datos.ts");
  const accesos = datos.slice(datos.indexOf("export async function accesosPortal("));
  // El listado no manda la contraseña cifrada al navegador: solo si hay una.
  assert.match(accesos, /tieneSecreto: Boolean\(r\.secret_encrypted\)/);
  assert.doesNotMatch(accesos.slice(accesos.indexOf("return (data")), /secret_encrypted:/);
  assert.match(accesos, /\.eq\("client_id", ctx\.clientId\)\s*\.eq\("portal_visible", true\)/);
});

test("panel: todo lo que se carga para el portal es del owner, y las imágenes se validan", () => {
  const acciones = leer("../app/landing-pages/portal-entrega-acciones.ts");
  for (const nombre of [
    "subirImagenPortal",
    "quitarImagenPortal",
    "guardarEntregables",
    "accesoEnPortal",
    "guardarVideoSoporte",
    "borrarVideoSoporte",
  ]) {
    const desde = acciones.slice(acciones.indexOf(`export async function ${nombre}(`));
    assert.match(desde.slice(0, 300), /await exigirOwner\(\);/, nombre);
  }
  assert.match(acciones, /if \(!IMAGENES\.includes\(archivo\.type\)\)/);
  assert.match(acciones, /archivo\.size > MAX_IMAGEN/);
  // Marcar un acceso exige que sea de ese cliente.
  assert.match(acciones, /\.eq\("id", id\)\s*\.eq\("client_id", clientId\)/);
});
