import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { resumirRegistros, ritmoHaciaMeta, registrosDeMailerlite, diaDe } = await import(
  "../lib/lanzamientos/tipos.ts"
);

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("diaDe usa la hora de Buenos Aires, no UTC", () => {
  // 01:30 UTC del 11 todavía es 22:30 del 10 en Buenos Aires.
  assert.equal(diaDe("2026-10-11T01:30:00Z"), "2026-10-10");
  assert.equal(diaDe("2026-10-11T15:00:00Z"), "2026-10-11");
});

test("resumirRegistros cuenta total, hoy, por landing y por día", () => {
  const r = resumirRegistros(
    [
      { page_id: "a", registered_at: "2026-10-10T15:00:00Z" },
      { page_id: "a", registered_at: "2026-10-11T15:00:00Z" },
      { page_id: "b", registered_at: "2026-10-11T16:00:00Z" },
      { page_id: null, registered_at: "2026-10-11T17:00:00Z" },
    ],
    "2026-10-11",
  );
  assert.equal(r.total, 4);
  assert.equal(r.hoy, 3);
  assert.deepEqual(r.porPagina, { a: 2, b: 1, "": 1 });
  assert.deepEqual(r.porDia, [
    { dia: "2026-10-10", registros: 1 },
    { dia: "2026-10-11", registros: 3 },
  ]);
  assert.deepEqual(resumirRegistros([], "2026-10-11"), { total: 0, hoy: 0, porPagina: {}, porDia: [] });
});

test("ritmoHaciaMeta proyecta con el promedio diario y no inventa sin datos", () => {
  const l = { starts_on: "2026-10-01", ends_on: "2026-10-10", goal_registrations: 1000 };
  // Día 4 de 10 con 320 registros: 80 por día, 800 al cierre, faltan 200.
  assert.deepEqual(ritmoHaciaMeta(l, 320, "2026-10-04"), {
    proyeccion: 800,
    faltan: 200,
    diasTranscurridos: 4,
    diasTotales: 10,
  });
  // Pasado el cierre se congela en el total de días.
  assert.equal(ritmoHaciaMeta(l, 1200, "2026-10-20").faltan, -200);
  // Sin meta, sin fechas o antes de empezar: null.
  assert.equal(ritmoHaciaMeta({ ...l, goal_registrations: null }, 10, "2026-10-04"), null);
  assert.equal(ritmoHaciaMeta({ ...l, ends_on: null }, 10, "2026-10-04"), null);
  assert.equal(ritmoHaciaMeta(l, 0, "2026-09-30"), null);
});

const evento = (id, grupo, extra = {}) => ({
  type: "subscriber.added_to_group",
  subscriber: {
    id,
    email: `P${id}@Mail.com`,
    subscribed_at: "2026-10-11 15:00:00",
    fields: { name: "Ana", last_name: "Pérez", phone: "+54 9 11 5555", utm_source: "meta", utm_content: "video1" },
    ...extra,
  },
  group: { id: grupo, name: "Registro A" },
  account_id: "1",
});

test("registrosDeMailerlite lee un evento suelto y un lote", () => {
  const [uno] = registrosDeMailerlite(evento("100", "200"));
  assert.deepEqual(uno, {
    externalId: "100",
    email: "p100@mail.com",
    name: "Ana Pérez",
    phone: "+54 9 11 5555",
    groupId: "200",
    // Sin fecha: `subscribed_at` es la primera suscripción a la cuenta, no el
    // ingreso a este lanzamiento. La fecha la pone el webhook al recibir.
    utm: { source: "meta", medium: null, campaign: null, content: "video1" },
  });

  const lote = registrosDeMailerlite({ events: [evento(1, 2), evento(3, 4)], total: 2 });
  assert.deepEqual(lote.map((r) => [r.externalId, r.groupId]), [["1", "2"], ["3", "4"]]);
});

test("registrosDeMailerlite ignora lo que no es un alta a un grupo y no rompe", () => {
  assert.deepEqual(registrosDeMailerlite({ event: "subscriber.created", id: "1", email: "a@b.com" }), []);
  assert.deepEqual(registrosDeMailerlite({ type: "campaign.open", subscriber: { id: "1" } }), []);
  assert.deepEqual(registrosDeMailerlite({ type: "subscriber.added_to_group", subscriber: { id: "1" } }), []);
  for (const basura of [null, undefined, "x", 3, [], { events: "no" }]) {
    assert.deepEqual(registrosDeMailerlite(basura), []);
  }
});

test("el webhook verifica firma, es idempotente y no guarda el cuerpo", () => {
  const ruta = leer("../app/api/webhooks/mailerlite/[token]/route.ts");
  assert.match(ruta, /timingSafeEqual/);
  assert.match(ruta, /if \(!firmaOk\) \{[\s\S]*?status: 401/);
  assert.match(ruta, /onConflict: "launch_id,external_id", ignoreDuplicates: true/);
  // El cliente sale del lanzamiento encontrado por token, nunca del cuerpo.
  assert.match(ruta, /client_id: lanzamiento\.client_id/);
  // El registro se fecha al recibir el aviso, no con una fecha del cuerpo.
  assert.match(ruta, /registered_at: recibido/);
  // La bitácora no guarda datos personales: ni el cuerpo ni el payload.
  assert.doesNotMatch(ruta, /anotar\(\{[^}]*\b(cuerpo|payload)\b/);
  assert.match(ruta, /const anotar = \(campos: \{ signature_ok: boolean \| null; events\?: number; stored\?: number; error\?: string \}\)/);
  assert.match(leer("../proxy.ts"), /"\/api\/webhooks\/\(\.\*\)"/);
});

test("las lecturas de lanzamientos siempre filtran por cliente y no exponen secretos", () => {
  const datos = leer("../lib/lanzamientos/datos.ts");
  for (const nombre of ["lanzamientosDeCliente", "lanzamientoDeCliente", "conexionDeLanzamiento"]) {
    const cuerpo = datos.slice(datos.indexOf(`export async function ${nombre}(`));
    assert.match(cuerpo.slice(0, cuerpo.indexOf("\n}\n")), /\.eq\("client_id", clientId\)/, nombre);
  }
  // El secreto de firma no se selecciona en ninguna lectura.
  assert.doesNotMatch(datos, /webhook_secret_encrypted/);
  assert.doesNotMatch(datos, /COLUMNAS_LANZAMIENTO =\s*"[^"]*webhook/);

  const acciones = leer("../app/landing-pages/lanzamiento-acciones.ts");
  const exportadas = acciones.split("export async function ").slice(1);
  assert.equal(exportadas.length, 14);
  for (const f of exportadas) {
    assert.match(f.slice(f.indexOf("{\n") + 1).trimStart(), /^await exigirOwner\(\);/, f.slice(0, 30));
  }
  // La API key de MailerLite se usa y no se persiste.
  assert.doesNotMatch(acciones, /api_key[\s\S]{0,40}(insert|update)\(/);
  assert.doesNotMatch(acciones, /(insert|update)\(\{[^}]*apiKey/);
});

/* ───────────── Visitas y conversión ───────────── */

const { resumirVisitas, conversion, compararVariantes, esBot, dominioDe } = await import(
  "../lib/lanzamientos/tipos.ts"
);

test("resumirVisitas suma por landing y por fuente, de mayor a menor", () => {
  const r = resumirVisitas([
    { page_id: "a", day: "2026-10-10", utm_source: "meta", visitors: 300 },
    { page_id: "a", day: "2026-10-11", utm_source: "meta", visitors: 200 },
    { page_id: "b", day: "2026-10-11", utm_source: null, visitors: 50 },
    { page_id: "b", day: "2026-10-11", utm_source: "google", visitors: 150 },
  ]);
  assert.equal(r.total, 700);
  assert.deepEqual(r.porPagina, { a: 500, b: 200 });
  assert.deepEqual(r.porFuente, [
    { fuente: "meta", visitantes: 500 },
    { fuente: "google", visitantes: 150 },
    { fuente: "", visitantes: 50 },
  ]);
});

test("conversion no inventa un 0% cuando no hay visitas", () => {
  assert.equal(conversion(50, 1000), 5);
  assert.equal(conversion(37, 1200), 3.1);
  assert.equal(conversion(0, 500), 0);
  assert.equal(conversion(10, 0), null);
  // Script instalado tarde: más registros que visitantes no es un 250 %.
  assert.equal(conversion(250, 100), null);
});

test("compararVariantes no declara ganadora con poco tráfico", () => {
  // 12 de 100 contra 9 de 100: parece ganar A, pero es ruido.
  const pocas = compararVariantes([
    { id: "a", visitantes: 100, registros: 12 },
    { id: "b", visitantes: 100, registros: 9 },
  ]);
  assert.deepEqual(pocas, { mejor: "a", segunda: "b", significativa: false });

  // La misma proporción con 50 veces más tráfico sí es consistente.
  const muchas = compararVariantes([
    { id: "a", visitantes: 5000, registros: 600 },
    { id: "b", visitantes: 5000, registros: 450 },
    { id: "c", visitantes: 5000, registros: 100 },
  ]);
  assert.deepEqual(muchas, { mejor: "a", segunda: "b", significativa: true });

  // Menos de dos landings con visitas: no hay qué comparar.
  assert.equal(compararVariantes([{ id: "a", visitantes: 100, registros: 5 }]), null);
  assert.equal(
    compararVariantes([
      { id: "a", visitantes: 100, registros: 5 },
      { id: "b", visitantes: 0, registros: 3 },
    ]),
    null,
  );
});

test("esBot filtra rastreadores y previsualizadores, no navegadores reales", () => {
  for (const ua of [
    null,
    "",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "WhatsApp/2.23.20.0",
    "curl/8.4.0",
    "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0.0.0",
  ]) {
    assert.equal(esBot(ua), true, String(ua));
  }
  for (const ua of [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 300.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36 [FBAN/FB4A;FBAV/440.0]",
  ]) {
    assert.equal(esBot(ua), false, ua);
  }
});

test("dominioDe guarda solo el dominio del referrer", () => {
  assert.equal(dominioDe("https://www.instagram.com/p/abc/?x=1"), "instagram.com");
  assert.equal(dominioDe("https://l.facebook.com/l.php?u=secreto"), "l.facebook.com");
  assert.equal(dominioDe(""), null);
  assert.equal(dominioDe("no es una url"), null);
});

test("el endpoint de visitas no guarda la IP y cuenta un visitante por día", () => {
  const ruta = leer("../app/api/t/route.ts");
  assert.match(ruta, /if \(esBot\(userAgent\)\) return listo\(\)/);
  // La IP solo entra al hash; ninguna columna la recibe.
  assert.match(ruta, /huella\("visita-ip", base\)/);
  assert.match(ruta, /huella\("visita", `\$\{base\}\|\$\{userAgent\}`\)/);
  // Tope por IP y por día contra el inflado de visitas.
  assert.match(ruta, /if \(\(count \?\? 0\) >= MAX_POR_IP\) return listo\(\)/);
  // El token del webhook ya no se reutiliza como sal.
  assert.doesNotMatch(ruta, /webhook_token/);
  const fila = ruta.slice(ruta.indexOf(".upsert("), ruta.indexOf("{ onConflict"));
  assert.doesNotMatch(fila, /\bip\b|userAgent|user_agent/);
  assert.match(ruta, /onConflict: "page_id,visitor_hash,day", ignoreDuplicates: true/);
  // Clave desconocida o inválida: misma respuesta vacía que una visita contada.
  assert.match(ruta, /if \(!pagina\) return listo\(\)/);
  assert.match(leer("../proxy.ts"), /"\/api\/t",/);
});

test("el script de la landing avisa la visita y completa los UTM del formulario", async () => {
  const vm = await import("node:vm");
  const codigo = leer("../public/t.js");

  const campo = { name: "fields[utm_source]", value: "" };
  const yaCargado = { name: "fields[utm_campaign]", value: "puesto-a-mano" };
  const enviados = [];
  const sesion = new Map();

  const contexto = {
    URL,
    URLSearchParams,
    JSON,
    String,
    document: {
      currentScript: {
        src: "https://app.ejemplo.com/t.js",
        getAttribute: (n) => (n === "data-k" ? "0123456789abcdef0123456789abcdef" : null),
      },
      referrer: "https://www.instagram.com/",
      querySelectorAll: (sel) =>
        sel.includes("utm_source") ? [campo] : sel.includes("utm_campaign") ? [yaCargado] : [],
      addEventListener: () => {},
    },
    navigator: { sendBeacon: (url, cuerpo) => enviados.push({ url, cuerpo: JSON.parse(cuerpo) }) },
  };
  contexto.window = {
    location: { search: "?utm_source=meta&utm_campaign=aida-oct26&utm_content=video1" },
    sessionStorage: { setItem: (k, v) => sesion.set(k, v), getItem: (k) => sesion.get(k) ?? null },
    setTimeout: () => 0,
  };

  vm.runInNewContext(codigo, contexto);

  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].url, "https://app.ejemplo.com/api/t");
  assert.deepEqual(enviados[0].cuerpo, {
    k: "0123456789abcdef0123456789abcdef",
    r: "https://www.instagram.com/",
    u: { utm_source: "meta", utm_campaign: "aida-oct26", utm_content: "video1" },
  });
  // Completa el campo vacío y respeta el que ya tenía valor.
  assert.equal(campo.value, "meta");
  assert.equal(yaCargado.value, "puesto-a-mano");
  // Los UTM quedan para la página siguiente de la sesión.
  assert.equal(sesion.get("sl_utm_source"), "meta");

  // Sin data-k no hace nada, y un error interno no rompe la landing.
  const sinClave = { ...contexto, document: { ...contexto.document, currentScript: { getAttribute: () => null } } };
  const antes = enviados.length;
  vm.runInNewContext(codigo, sinClave);
  vm.runInNewContext(codigo, { document: { currentScript: null } });
  assert.equal(enviados.length, antes);
});

/* ───────────── Vencimiento ───────────── */

test("un lanzamiento activo vence el día después de su cierre", async () => {
  const { estaVencido } = await import("../lib/lanzamientos/tipos.ts");
  const hoy = "2026-10-22";
  assert.equal(estaVencido({ status: "activo", ends_on: "2026-10-21" }, hoy), true);
  // El día de cierre todavía cuenta como activo.
  assert.equal(estaVencido({ status: "activo", ends_on: "2026-10-22" }, hoy), false);
  assert.equal(estaVencido({ status: "activo", ends_on: null }, hoy), false);
  // Solo los activos vencen: uno en preparación o cerrado queda como está.
  assert.equal(estaVencido({ status: "preparacion", ends_on: "2026-01-01" }, hoy), false);
  assert.equal(estaVencido({ status: "cerrado", ends_on: "2026-01-01" }, hoy), false);
});

test("los lanzamientos vencidos se cierran antes de leerlos", () => {
  const datos = leer("../lib/lanzamientos/datos.ts");
  for (const nombre of ["lanzamientosDeCliente", "lanzamientoDeCliente"]) {
    const cuerpo = datos.slice(datos.indexOf(`export async function ${nombre}(`));
    assert.match(cuerpo.slice(0, 200), /await cerrarVencidos\(clientId\);/, nombre);
  }
  assert.match(leer("../lib/lanzamientos/alertas-datos.ts"), /await cerrarVencidos\(\);/);
});
