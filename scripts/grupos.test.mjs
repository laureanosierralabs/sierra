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

const { linkDeGrupo, linksDeTexto, grupoVigente, grupoDestino, estadoGrupo, gruposLibres, enElTope, personaDe, linkFijo } =
  await import("../lib/lanzamientos/grupos.ts");
const { avisoPocosGruposEmail } = await import("../lib/lanzamientos/avisos.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const grupo = (id, position, extra = {}) => ({
  id,
  url: `https://chat.whatsapp.com/${id.padEnd(22, "x")}`,
  position,
  cap: 900,
  joins: 0,
  full_at: null,
  ...extra,
});

test("solo acepta links de invitación a grupos y los normaliza", () => {
  assert.equal(linkDeGrupo(" https://chat.whatsapp.com/Bf6QQa6rEQXEmvReMxrRys/ "), "https://chat.whatsapp.com/Bf6QQa6rEQXEmvReMxrRys");
  assert.equal(linkDeGrupo("https://chat.whatsapp.com/Bf6QQa6rEQXEmvReMxrRys?mode=r_c"), "https://chat.whatsapp.com/Bf6QQa6rEQXEmvReMxrRys");
  assert.equal(linkDeGrupo("http://chat.whatsapp.com/Bf6QQa6rEQXEmvReMxrRys"), null);
  assert.equal(linkDeGrupo("https://wa.me/5491112345678"), null);
  assert.equal(linkDeGrupo("https://chat.whatsapp.com.evil.com/Bf6QQa6rEQXEmvReMxrRys"), null);
});

test("lee varios links pegados, sin repetir y marcando los inválidos", () => {
  const r = linksDeTexto("https://chat.whatsapp.com/AAAAAAAAAAAA\n\nhttps://chat.whatsapp.com/BBBBBBBBBBBB  https://chat.whatsapp.com/AAAAAAAAAAAA/\nhola");
  assert.deepEqual(r.links, ["https://chat.whatsapp.com/AAAAAAAAAAAA", "https://chat.whatsapp.com/BBBBBBBBBBBB"]);
  assert.deepEqual(r.invalidos, ["hola"]);
});

test("el vigente es el primero por orden que no está lleno", () => {
  const grupos = [grupo("c", 3), grupo("a", 1, { full_at: "2026-10-24" }), grupo("b", 2, { joins: 900 })];
  assert.equal(grupoVigente(grupos).id, "c");
  assert.equal(estadoGrupo(grupos[1], grupoVigente(grupos)), "lleno");
  assert.equal(estadoGrupo(grupos[2], grupoVigente(grupos)), "lleno");
  assert.equal(gruposLibres(grupos), 1);
  const dos = [grupo("a", 1), grupo("b", 2)];
  assert.equal(estadoGrupo(dos[1], grupoVigente(dos)), "en-espera");
});

test("si todos están llenos, el destino es el último (nunca un link roto)", () => {
  const grupos = [grupo("a", 1, { full_at: "x" }), grupo("b", 2, { full_at: "x" })];
  assert.equal(grupoVigente(grupos), null);
  assert.equal(grupoDestino(grupos).id, "b");
  assert.equal(grupoDestino([]), null);
});

test("un grupo en su tope sigue lleno aunque se reabra", () => {
  assert.equal(enElTope({ joins: 899, cap: 900 }), false);
  assert.equal(enElTope({ joins: 900, cap: 900 }), true);
  const reabierto = grupo("a", 1, { joins: 900, full_at: null });
  assert.equal(grupoVigente([reabierto]), null);
});

test("el cierre lo hace la base al sumar, así no se pierde con entradas simultáneas", () => {
  const sql = leer("../supabase/migrations/20261107000000_launch_whatsapp_groups.sql");
  assert.match(sql, /full_at = case when full_at is null and joins \+ 1 >= cap then now\(\) else full_at end/);
  assert.match(sql, /alerted_at timestamptz/);
});

test("sin email cada clic cuenta como una persona", () => {
  assert.equal(personaDe("ana@x.com", "r1"), "e:ana@x.com");
  assert.notEqual(personaDe(null, "r1"), personaDe(null, "r2"));
});

test("el link fijo sale con el dominio de la landing, o el del panel", () => {
  assert.equal(linkFijo("abc", "lp.pilarsousa.es", "https://panel.x"), "https://lp.pilarsousa.es/grupo/abc");
  assert.equal(linkFijo("abc", "https://manuelazuluaga.com/", "https://panel.x"), "https://manuelazuluaga.com/grupo/abc");
  assert.equal(linkFijo("abc", null, "https://panel.x/"), "https://panel.x/g/abc");
});

test("el aviso distingue entre uno libre y ninguno", () => {
  assert.match(avisoPocosGruposEmail({ nombre: "Lanzamiento", libres: 1, url: null }).subject, /queda 1 grupo de WhatsApp libre/);
  const cero = avisoPocosGruposEmail({ nombre: "<b>L</b>", libres: 0, url: "https://p/x" });
  assert.match(cero.subject, /no quedan grupos/);
  assert.ok(!cero.html.includes("<b>L</b>"));
  assert.ok(cero.html.includes('href="https://p/x"'));
});

test("la ruta es pública, valida el token y no cuenta a los bots", () => {
  assert.match(leer("../proxy.ts"), /"\/g\/\(\.\*\)"/);
  const ruta = leer("../app/g/[token]/route.ts");
  assert.match(ruta, /\/\^\[a-f0-9\]\{32\}\$\/\.test\(token\)/);
  assert.match(ruta, /if \(bajoElTope && req\.method !== "HEAD" && !esBot\(req\.headers\.get\("user-agent"\)\)\)/);
  // El link es público: tope diario de personas anotadas.
  assert.match(ruta, /const bajoElTope = \(hoyAnotados \?\? 0\) < MAX_POR_DIA;/);
  // Solo una request avisa que el grupo se llenó.
  assert.match(ruta, /\.is\("alerted_at", null\)/);
});

test("el panel exige owner y el portal filtra por el cliente de su organización", () => {
  const panel = leer("../app/landing-pages/grupos-acciones.ts");
  for (const f of panel.split("export async function ").slice(1)) {
    assert.match(f.slice(f.indexOf("{\n") + 1).trimStart(), /^await exigirOwner\(\);/, f.slice(0, 30));
  }
  const portal = leer("../app/portal/grupos-acciones.ts");
  assert.doesNotMatch(portal, /texto\(fd, "client_id"\)/);
  assert.match(portal, /quien\.ctx\.clientId/);
  assert.match(portal, /if \(ctx\.vistaInterna\)/);
  const datos = leer("../lib/lanzamientos/grupos-datos.ts");
  // Toda lectura y cambio filtra por cliente: cada consulta a la base lleva su filtro.
  const consultas = (datos.match(/\.from\("(launches|launch_whatsapp_groups)"\)/g) ?? []).length;
  const filtradas = (datos.match(/\.eq\("client_id", clientId\)/g) ?? []).length;
  const inserts = (datos.match(/\.insert\(/g) ?? []).length;
  assert.equal(filtradas, consultas - inserts);
  // Un grupo con gente no se borra.
  assert.match(datos, /\.eq\("joins", 0\)/);
});
