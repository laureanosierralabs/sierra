import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { normalizarRuta, firmarIngesta, firmaIngestaValida, validarConversion, VENTANA_FIRMA_MS } =
  await import("../lib/sitios/tipos.ts");
const { promptIntegracion } = await import("../lib/sitios/prompt.ts");

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("normalizarRuta: la misma landing cuenta igual con o sin barra final, query o URL completa", () => {
  for (const entrada of ["/registro-a", "/registro-a/", "/registro-a?utm_source=x", "https://aidaqui.com/registro-a#form", "//registro-a"]) {
    assert.equal(normalizarRuta(entrada), "/registro-a", entrada);
  }
  assert.equal(normalizarRuta("/"), "/");
  assert.equal(normalizarRuta("/academia/registro"), "/academia/registro");
  for (const mala of ["", "registro", null, 3, "/con espacio", '/x"<script>', `/${"a".repeat(250)}`]) {
    assert.equal(normalizarRuta(mala), null, String(mala).slice(0, 20));
  }
});

test("firma: válida con el secreto y dentro de la ventana; inválida si algo cambia", () => {
  const ahora = 1_760_000_000_000;
  const ts = String(ahora);
  const cuerpo = '{"type":"lead","id":"1","email":"a@b.com"}';
  const firma = firmarIngesta("secreto", ts, cuerpo);

  assert.equal(firmaIngestaValida("secreto", ts, cuerpo, firma, ahora), true);
  // Timestamp en segundos también vale.
  const tsSeg = String(Math.floor(ahora / 1000));
  assert.equal(firmaIngestaValida("secreto", tsSeg, cuerpo, firmarIngesta("secreto", tsSeg, cuerpo), ahora), true);

  assert.equal(firmaIngestaValida("otro", ts, cuerpo, firma, ahora), false, "otro secreto");
  assert.equal(firmaIngestaValida("secreto", ts, cuerpo.replace("a@b", "x@b"), firma, ahora), false, "cuerpo alterado");
  assert.equal(firmaIngestaValida("secreto", ts, cuerpo, firma, ahora + VENTANA_FIRMA_MS + 1), false, "reenvío tardío");
  assert.equal(firmaIngestaValida("secreto", null, cuerpo, firma, ahora), false, "sin timestamp");
  assert.equal(firmaIngestaValida("secreto", ts, cuerpo, null, ahora), false, "sin firma");
  assert.equal(firmaIngestaValida("secreto", "abc", cuerpo, firma, ahora), false, "timestamp basura");
});

test("validarConversion: lead y compra válidos se normalizan", () => {
  const ahora = new Date("2026-10-15T15:00:00Z");
  const lead = validarConversion(
    {
      type: "lead",
      id: "abc-1",
      email: "Ana@Mail.COM",
      name: "Ana",
      path: "/registro-a/?x=1",
      utm: { utm_source: "meta<script>", utm_content: "video1" },
      occurred_at: "2026-10-15T14:59:00Z",
    },
    ahora,
  );
  assert.equal(lead.ok, true);
  assert.equal(lead.conversion.email, "ana@mail.com");
  assert.equal(lead.conversion.path, "/registro-a");
  assert.equal(lead.conversion.utm.source, "metascript");
  assert.equal(lead.conversion.occurredAt, "2026-10-15T14:59:00.000Z");

  const compra = validarConversion({ type: "purchase", id: "evt_1", amount: "44.5", currency: "eur" }, ahora);
  assert.equal(compra.ok, true);
  assert.equal(compra.conversion.amount, 44.5);
  assert.equal(compra.conversion.currency, "EUR");
  // Fecha absurda (futuro lejano): cuenta el momento de llegada.
  const futuro = validarConversion({ type: "lead", id: "2", email: "a@b.com", occurred_at: "2030-01-01T00:00:00Z" }, ahora);
  assert.equal(futuro.conversion.occurredAt, ahora.toISOString());
});

test("validarConversion: rechaza con un motivo útil", () => {
  const casos = [
    [null, /objeto/],
    [{ type: "visita" }, /type/],
    [{ type: "lead", email: "a@b.com" }, /id/],
    [{ type: "lead", id: "1" }, /email/],
    [{ type: "lead", id: "1", email: "no-es-mail" }, /email/],
    [{ type: "purchase", id: "1" }, /amount/],
    [{ type: "purchase", id: "1", amount: -3 }, /amount/],
    [{ type: "purchase", id: "1", amount: 3, currency: "dolares" }, /currency/],
  ];
  for (const [datos, motivo] of casos) {
    const r = validarConversion(datos);
    assert.equal(r.ok, false, JSON.stringify(datos));
    assert.match(r.motivo, motivo);
  }
});

test("contrato: lo que manda el kit real lo acepta el servidor", async () => {
  process.env.NEXT_PUBLIC_SIERRA_URL = "https://panel.ejemplo.com/";
  process.env.NEXT_PUBLIC_SIERRA_SITE_KEY = "0123456789abcdef0123456789abcdef";
  process.env.SIERRA_INGEST_SECRET = "secreto-del-proyecto";

  const enviados = [];
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async (url, opciones) => {
    enviados.push({ url, opciones });
    return new Response('{"ok":true}', { status: 200 });
  };
  try {
    const kit = await import("../public/kit/sierra.ts");
    const fd = new FormData();
    fd.set("sl_path", "/registro-b");
    fd.set("utm_source", "meta");
    fd.set("utm_content", "video2");

    await kit.registrarLead({ email: "Ana@Mail.com", name: "Ana", ...kit.atribucionDe(fd) });
    await kit.registrarCompra({ id: "evt_123", amount: 44, currency: "EUR", email: "ana@mail.com", path: "/registro-b" });
  } finally {
    globalThis.fetch = fetchOriginal;
  }

  assert.equal(enviados.length, 2);
  for (const { url, opciones } of enviados) {
    assert.equal(url, "https://panel.ejemplo.com/api/ingest");
    const h = opciones.headers;
    assert.equal(h["x-sierra-site"], "0123456789abcdef0123456789abcdef");
    // La firma del kit la valida el servidor con el mismo secreto.
    assert.equal(
      firmaIngestaValida("secreto-del-proyecto", h["x-sierra-timestamp"], opciones.body, h["x-sierra-signature"]),
      true,
    );
    // Y el cuerpo pasa la validación del servidor.
    assert.equal(validarConversion(JSON.parse(opciones.body)).ok, true);
  }
  const lead = JSON.parse(enviados[0].opciones.body);
  assert.equal(lead.path, "/registro-b");
  assert.deepEqual(lead.utm, { utm_source: "meta", utm_medium: null, utm_campaign: null, utm_content: "video2" });
  assert.equal(JSON.parse(enviados[1].opciones.body).id, "evt_123");
});

test("el kit nunca rompe el formulario: sin variables o con el panel caído, no lanza", async () => {
  const kit = await import("../public/kit/sierra.ts");
  const fetchOriginal = globalThis.fetch;
  const avisos = console.warn;
  console.warn = () => {};
  try {
    globalThis.fetch = async () => {
      throw new Error("panel caído");
    };
    await kit.registrarLead({ email: "a@b.com" });
    delete process.env.SIERRA_INGEST_SECRET;
    await kit.registrarLead({ email: "a@b.com" });
  } finally {
    globalThis.fetch = fetchOriginal;
    console.warn = avisos;
  }
});

test("el prompt lleva el kit actual, las variables y las reglas, sin ningún secreto", () => {
  const servidor = leer("../public/kit/sierra.ts");
  const navegador = leer("../public/kit/sierra-tracking.tsx");
  const prompt = promptIntegracion({
    urlPanel: "https://app.laureanosierra.com",
    proyecto: "Landings Aida Qui",
    dominio: "aidaqui.com",
    kitServidor: servidor,
    kitNavegador: navegador,
  });
  assert.ok(prompt.includes(servidor.trimEnd()));
  assert.ok(prompt.includes(navegador.trimEnd()));
  assert.match(prompt, /NEXT_PUBLIC_SIERRA_URL=https:\/\/app\.laureanosierra\.com/);
  assert.match(prompt, /NEXT_PUBLIC_SIERRA_SITE_KEY=\n/);
  assert.match(prompt, /SIERRA_INGEST_SECRET=\n/);
  assert.match(prompt, /No hagas commit, push ni deploy/);
  assert.match(prompt, /siempre con `await`/);
});

test("ingesta y proyectos conectados: firma antes de leer, mismos errores, solo owner", () => {
  const ruta = leer("../app/api/ingest/route.ts");
  // La firma se valida antes de interpretar el cuerpo.
  assert.ok(ruta.indexOf("firmaIngestaValida(") < ruta.indexOf("JSON.parse(cuerpo)"));
  // Sitio inexistente y firma inválida: la misma respuesta.
  assert.match(ruta, /!sitio \|\|\s*!secreto \|\|\s*!firmaIngestaValida/);
  assert.match(ruta, /onConflict: "site_id,event_id", ignoreDuplicates: true/);
  assert.match(leer("../proxy.ts"), /"\/api\/ingest",/);

  const acciones = leer("../app/landing-pages/sitio-acciones.ts");
  const exportadas = acciones.split("export async function ").slice(1);
  assert.equal(exportadas.length, 4);
  for (const f of exportadas) {
    assert.match(f.slice(f.indexOf("{\n") + 1).trimStart(), /^await exigirOwner\(\);/, f.slice(0, 30));
  }

  const datos = leer("../lib/sitios/datos.ts");
  assert.doesNotMatch(datos, /ingest_secret_encrypted|descifrar/);
  for (const nombre of ["sitiosDeCliente", "conversionesDeRutas"]) {
    const cuerpo = datos.slice(datos.indexOf(`export async function ${nombre}(`));
    assert.match(cuerpo.slice(0, cuerpo.indexOf("\n}\n")), /\.eq\("client_id", clientId\)/, nombre);
  }
});

test("la tarea modelo (SOP) tiene el formato de pasos que usa la app", () => {
  const sql = leer("../supabase/migrations/20261018000000_client_sites.sql");
  const json = sql.match(/'(\[[\s\S]*?\])'::jsonb/)[1];
  const pasos = JSON.parse(json);
  assert.ok(pasos.length >= 4);
  // Paso = { texto: string; hijos?: string[] } (lib/landing/tipos.ts).
  for (const paso of pasos) {
    assert.equal(typeof paso.texto, "string");
    if (paso.hijos !== undefined) {
      assert.ok(Array.isArray(paso.hijos));
      for (const hijo of paso.hijos) assert.equal(typeof hijo, "string", JSON.stringify(hijo));
    }
  }
  // Idempotente: correrla dos veces no duplica la tarea.
  assert.match(sql, /and not exists \(\s*select 1 from process_tasks t\s*where t\.process_id = p\.id and t\.title = 'Conectar el proyecto al panel \(Sierra Launch Kit\)'/);
});
