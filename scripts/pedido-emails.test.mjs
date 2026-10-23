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

const { pedidoNuevoEmail } = await import("../lib/email/pedido-nuevo.ts");
const { pedidoResueltoEmail } = await import("../lib/email/pedido-resuelto.ts");
const { urlBaseApp, extracto, emailsUnicos } = await import("../lib/email/pedido-comun.ts");

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("pedido nuevo: escapa todo lo que escribe el cliente y el botón lleva al pedido", () => {
  const { html, text, subject } = pedidoNuevoEmail({
    cliente: `<i>Pilar</i> & "Co"`,
    titulo: `<script>x</script>\nlinea`,
    tipo: "Incidencia",
    urgente: true,
    descripcion: `<img src=x onerror=alert(1)>`,
    url: "https://app.x.com/landing-pages/pedidos/1?a=1&b=2",
  });
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<i>Pilar"));
  assert.ok(html.includes("&lt;i&gt;Pilar&lt;/i&gt; &amp; &quot;Co&quot;"));
  assert.ok(html.includes('href="https://app.x.com/landing-pages/pedidos/1?a=1&amp;b=2"'));
  assert.ok(html.includes("Ver pedido"));
  assert.ok(text.includes("https://app.x.com/landing-pages/pedidos/1?a=1&b=2"));
  assert.ok(!/[\r\n]/.test(subject));
  assert.ok(subject.startsWith("[Urgente] Nuevo pedido de"));
});

test("pedido nuevo: sin descripción no hay cita y no se rompe", () => {
  const { html } = pedidoNuevoEmail({ cliente: "Ana", titulo: "Algo", tipo: "Cambio", urgente: false, descripcion: null, url: "https://x.com/p" });
  assert.ok(!html.includes("Lo que escribió"));
  assert.ok(html.includes("Cambio"));
});

test("pedido resuelto: asunto con el título, último comentario escapado y botón al portal", () => {
  const { html, text, subject } = pedidoResueltoEmail({
    titulo: "Home <rota>",
    comentario: "Listo <b>ya</b>\n\nlo arreglamos",
    autorComentario: "Lau",
    url: "https://app.x.com/portal/pilar/pedidos/9",
  });
  assert.equal(subject, "Tu pedido «Home <rota>» está resuelto");
  assert.ok(!html.includes("<rota>"));
  assert.ok(!html.includes("<b>ya"));
  assert.ok(html.includes("Listo &lt;b&gt;ya&lt;/b&gt; lo arreglamos"));
  assert.ok(html.includes("Último mensaje de Lau"));
  assert.ok(html.includes('href="https://app.x.com/portal/pilar/pedidos/9"'));
  assert.ok(text.includes("https://app.x.com/portal/pilar/pedidos/9"));
});

test("pedido resuelto: sin comentario no hay cita", () => {
  const { html } = pedidoResueltoEmail({ titulo: "X", comentario: null, autorComentario: null, url: "https://x.com" });
  assert.ok(!html.includes("Último mensaje"));
});

test("urlBaseApp: APP_URL manda; si no, el dominio de producción de Vercel", () => {
  assert.equal(urlBaseApp({ APP_URL: " https://a.com/ " }), "https://a.com");
  assert.equal(urlBaseApp({ VERCEL_PROJECT_PRODUCTION_URL: "mi-app.vercel.app" }), "https://mi-app.vercel.app");
  assert.equal(urlBaseApp({ VERCEL_PROJECT_PRODUCTION_URL: "https://mi-app.vercel.app/" }), "https://mi-app.vercel.app");
  assert.equal(urlBaseApp({}), "");
});

test("extracto y emailsUnicos", () => {
  assert.equal(extracto("a   b\n c"), "a b c");
  assert.equal(extracto("x".repeat(300), 10).length, 10);
  assert.ok(extracto("x".repeat(300), 10).endsWith("…"));
  assert.deepEqual(emailsUnicos(["A@x.com", "a@x.com ", null, "", "malo", "b@y.com"]), ["a@x.com", "b@y.com"]);
});

test("disparadores: el pedido nuevo avisa tras crearse y solo la transición a resuelta avisa al cliente", () => {
  const portal = leer("../app/portal/pedidos-acciones.ts");
  const crear = portal.slice(portal.indexOf("export async function crearPedidoPortal("), portal.indexOf("export async function comentarPedidoPortal("));
  assert.ok(crear.includes("after(() => avisarPedidoNuevo("));
  assert.ok(crear.indexOf("avisarPedidoNuevo") > crear.indexOf('.from("client_requests")'));

  const panel = leer("../app/landing-pages/pedidos-acciones.ts");
  const cambiar = panel.slice(panel.indexOf("export async function cambiarEstadoPedido("), panel.indexOf("export async function comentarPedido("));
  assert.ok(cambiar.includes('if (estado === "resuelta") after(() => avisarPedidoResuelto(id))'));
  // Después de la escritura del estado: un error del update no manda mail.
  assert.ok(cambiar.indexOf("avisarPedidoResuelto") > cambiar.indexOf('if (!data?.length)'));
});

test("avisos: nunca lanzan y se saltean sin Resend", () => {
  const avisos = leer("../lib/pedidos/avisos.ts");
  assert.equal((avisos.match(/} catch \(e\) \{\n    console\.error/g) ?? []).length, 2);
  assert.ok(avisos.includes("resendConfigurado()"));
  assert.ok(avisos.includes("avisoSinResend"));
});
