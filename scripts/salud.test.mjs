import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { ipPrivada, leerHtml, estadoGeneral } = await import("../lib/lanzamientos/salud.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("ipPrivada: bloquea red interna, loopback, metadatos de la nube y multicast", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fc00::1", "fd12::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "basura", "999.1.1.1"]) {
    assert.equal(ipPrivada(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "76.76.21.21", "172.32.0.1", "2606:4700::1111", "::ffff:8.8.8.8"]) {
    assert.equal(ipPrivada(ip), false, ip);
  }
});

test("leerHtml: script con la clave de ESTA landing y datos para compartir", () => {
  const html = `<html><head><title>Registro</title><meta property="og:image" content="https://x/img.png">
    <script src="https://app.laureanosierra.com/t.js" data-k="abc123"></script></head>
    <body><form><input type="email" name="email"></form></body></html>`;
  assert.deepEqual(leerHtml(html, "abc123"), { scriptVisitas: true, titulo: "Registro", imagen: true });
  // El script de OTRA landing no cuenta.
  assert.equal(leerHtml(html, "otra").scriptVisitas, false);
  assert.equal(leerHtml("<div>hola</div>", "abc").imagen, false);
  assert.equal(leerHtml('<meta content="T" property="og:title">', null).titulo, "T");
});

test("estadoGeneral: manda el peor chequeo", () => {
  assert.equal(estadoGeneral([]), "ok");
  assert.equal(estadoGeneral([{ estado: "ok" }, { estado: "aviso" }]), "aviso");
  assert.equal(estadoGeneral([{ estado: "aviso" }, { estado: "error" }, { estado: "ok" }]), "error");
});

test("verificar: solo el owner, cliente sacado del lanzamiento, y pedidos con defensas", () => {
  const acciones = leer("../app/landing-pages/salud-acciones.ts");
  const fn = acciones.slice(acciones.indexOf("export async function verificarLandings("));
  assert.match(fn, /if \(!esOwner\) return \{ error/);
  assert.match(fn, /from\("launches"\)\.select\("client_id"\)/);
  assert.match(fn, /\.eq\("client_id", clientId\)/);
  const pedir = leer("../lib/sitios/pedir-seguro.ts");
  assert.match(pedir, /redirect: "manual"/);
  // Se revisa el host en CADA salto, no solo el primero.
  assert.match(pedir, /for \(let salto = 0;[\s\S]*await hostPublico\(url\)/);
  assert.match(pedir, /AbortSignal\.timeout\(timeoutMs\)/);
});

test("ipPrivada: IPv6 con una IPv4 interna adentro (hex, compatible, NAT64, 6to4) también se bloquea", () => {
  for (const ip of ["::ffff:7f00:1", "::7f00:1", "64:ff9b::a00:1", "2002:a00:1::", "fec0::1", "1::2::3", "fe80::1%eth0"]) {
    assert.equal(ipPrivada(ip), true, ip);
  }
  for (const ip of ["64:ff9b::808:808", "2002:808:808::1", "1:2:3:4:5:6:7:8"]) {
    assert.equal(ipPrivada(ip), false, ip);
  }
});

test("leerHtml: un HTML armado para trabar el análisis se procesa rápido", () => {
  const inicio = Date.now();
  leerHtml("<meta ".repeat(250000), null);
  leerHtml("<title".repeat(250000), null);
  assert.ok(Date.now() - inicio < 3000, `tardó ${Date.now() - inicio} ms`);
});
