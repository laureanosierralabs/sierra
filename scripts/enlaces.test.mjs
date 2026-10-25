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

const { linkBase, linkCompartir, variableDe, hostDe, urlDestino, haceCuanto, resumenEnlace, LUGARES, esLugar, esTipoEnlace, textoMarca } =
  await import("../lib/lanzamientos/enlaces.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const TOKEN = "a".repeat(32);

test("el link base usa el dominio de la landing o, sin landing, el del panel", () => {
  assert.equal(linkBase("webinar", TOKEN, "https://pilar.com/", "https://panel.x"), `https://pilar.com/vivo/${TOKEN}`);
  assert.equal(linkBase("grupo", TOKEN, "pilar.com", "https://panel.x"), `https://pilar.com/grupo/${TOKEN}`);
  assert.equal(linkBase("webinar", TOKEN, null, "https://panel.x/"), `https://panel.x/w/${TOKEN}`);
  assert.equal(linkBase("grupo", TOKEN, "", "https://panel.x"), `https://panel.x/g/${TOKEN}`);
  assert.equal(hostDe("https://a.com//"), "a.com");
  assert.equal(hostDe(null), null);
  // Una URL con ruta no puede meter la ruta en el link (lp.x.es/registro/vivo/... no existe).
  assert.equal(hostDe("https://lp.pilarsousa.es/registro?utm=1"), "lp.pilarsousa.es");
});

test("la variable del email cambia según la herramienta", () => {
  const base = "https://a.com/vivo/x";
  assert.equal(linkCompartir(base, "ghl"), `${base}?e={{contact.email}}`);
  assert.equal(linkCompartir(base, "mailerlite"), `${base}?e={$email}`);
  assert.equal(linkCompartir(base, "ninguna"), base);
  assert.equal(variableDe("ninguna"), null);
});

test("el destino del webinar solo acepta http/https; vacío lo quita", () => {
  assert.equal(urlDestino(""), null);
  assert.equal(urlDestino("  "), null);
  assert.equal(urlDestino("https://youtube.com/live/abc"), "https://youtube.com/live/abc");
  assert.equal(urlDestino("javascript:alert(1)"), undefined);
  assert.equal(urlDestino("ftp://x.com"), undefined);
  assert.equal(urlDestino("no es un link"), undefined);
});

test("haceCuanto escribe el tiempo relativo en español", () => {
  const ahora = "2026-10-25T12:00:00.000Z";
  const antes = (ms) => new Date(new Date(ahora).getTime() - ms).toISOString();
  assert.equal(haceCuanto(null, ahora), "");
  assert.equal(haceCuanto("basura", ahora), "");
  assert.equal(haceCuanto(antes(10_000), ahora), "hace unos segundos");
  assert.equal(haceCuanto(antes(5 * 60_000), ahora), "hace 5 min");
  assert.equal(haceCuanto(antes(3 * 3_600_000), ahora), "hace 3 h");
  assert.equal(haceCuanto(antes(24 * 3_600_000), ahora), "hace 1 día");
  assert.equal(haceCuanto(antes(4 * 24 * 3_600_000), ahora), "hace 4 días");
  // Reloj adelantado: no rompe.
  assert.equal(haceCuanto(antes(-60_000), ahora), "hace unos segundos");
});

test("el estado distingue falta de destino, sin usos y funcionando", () => {
  const ahoraIso = "2026-10-25T12:00:00.000Z";
  const hace2h = "2026-10-25T10:00:00.000Z";
  assert.deepEqual(resumenEnlace({ tieneDestino: false, usos: 9, ultimoUso: hace2h, ahoraIso }), {
    estado: "falta-destino",
    texto: "Falta el destino",
  });
  assert.deepEqual(resumenEnlace({ tieneDestino: true, usos: 0, ultimoUso: null, ahoraIso }), {
    estado: "sin-usos",
    texto: "Listo, sin usos todavía",
  });
  assert.equal(resumenEnlace({ tieneDestino: true, usos: 1, ultimoUso: hace2h, ahoraIso }).texto, "Funcionando · 1 uso · último hace 2 h");
  assert.equal(resumenEnlace({ tieneDestino: true, usos: 3, ultimoUso: hace2h, ahoraIso }).estado, "funcionando");
  // Con usos pero sin fecha: cuenta igual, sin "hace X".
  assert.equal(resumenEnlace({ tieneDestino: true, usos: 3, ultimoUso: null, ahoraIso }).texto, "Funcionando · 3 usos");
});

test("los lugares tienen los cuatro slugs y se validan", () => {
  assert.deepEqual(
    LUGARES.map((l) => l.slug),
    ["mail-registro", "recordatorios", "pagina-gracias", "whatsapp-redes"],
  );
  assert.ok(esLugar("recordatorios"));
  assert.ok(!esLugar("otro"));
  assert.ok(esTipoEnlace("webinar") && esTipoEnlace("grupo") && !esTipoEnlace("zoom"));
  assert.equal(textoMarca({ checked_by: "Ana", checked_at: "2026-10-24T15:00:00.000Z" }), "Marcado por Ana el 24 oct");
  assert.equal(textoMarca({ checked_by: null, checked_at: "2026-10-24T15:00:00.000Z" }), "Marcado el 24 oct");
});

test("la migración crea la tabla con RLS, su clave y la columna del último uso", () => {
  const sql = leer("../supabase/migrations/20261110000000_launch_links.sql");
  assert.match(sql, /create table if not exists launch_link_placements/);
  assert.match(sql, /primary key \(launch_id, link, placement\)/);
  assert.match(sql, /check \(link in \('webinar', 'grupo'\)\)/);
  assert.match(sql, /check \(placement in \('mail-registro', 'recordatorios', 'pagina-gracias', 'whatsapp-redes'\)\)/);
  assert.match(sql, /alter table launch_link_placements enable row level security/);
  assert.match(sql, /add column if not exists group_last_used_at timestamptz/);
  assert.match(sql, /Rollback:/);
});

test("el link del grupo anota el último uso sin frenar la redirección", () => {
  const ruta = leer("../app/g/[token]/route.ts");
  assert.match(ruta, /group_last_used_at/);
  assert.match(ruta, /after\(async \(\) => \{[\s\S]*group_last_used_at/);
});

test("el portal filtra por el cliente de su organización y bloquea la vista interna", () => {
  const portal = leer("../app/portal/enlaces-acciones.ts");
  assert.doesNotMatch(portal, /texto\(fd, "client_id"\)/);
  assert.match(portal, /quien\.ctx\.clientId/);
  assert.match(portal, /if \(ctx\.vistaInterna\)/);
  const panel = leer("../app/landing-pages/enlaces-acciones.ts");
  for (const f of panel.split("export async function ").slice(1)) {
    assert.match(f.slice(f.indexOf("{\n") + 1).trimStart(), /^await exigirOwner\(\);/, f.slice(0, 30));
  }
  // Toda consulta a la base de los datos de enlaces lleva el filtro por cliente.
  const datos = leer("../lib/lanzamientos/enlaces-datos.ts");
  const consultas = (datos.match(/\.from\("(launches|launch_events|launch_link_placements)"\)/g) ?? []).length;
  const filtradas = (datos.match(/\.eq\("client_id", clientId\)/g) ?? []).length;
  const upserts = (datos.match(/\.upsert\(/g) ?? []).length;
  assert.ok(filtradas >= consultas - upserts);
});

test("la pestaña Enlaces reemplaza a WhatsApp y conserva ?vista=whatsapp como alias", () => {
  const pagina = leer("../app/portal/[org]/lanzamientos/[id]/page.tsx");
  assert.match(pagina, /\?vista=enlaces/);
  assert.match(pagina, /vistaCruda === "enlaces" \|\| vistaCruda === "whatsapp"/);
});
