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
  assert.equal(exportadas.length, 5);
  for (const f of exportadas) {
    assert.match(f.slice(f.indexOf("{\n") + 1).trimStart(), /^await exigirOwner\(\);/, f.slice(0, 30));
  }
  // La API key de MailerLite se usa y no se persiste.
  assert.doesNotMatch(acciones, /api_key[\s\S]{0,40}(insert|update)\(/);
  assert.doesNotMatch(acciones, /(insert|update)\(\{[^}]*apiKey/);
});
