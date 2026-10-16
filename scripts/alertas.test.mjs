import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { evaluarAlertas } = await import("../lib/lanzamientos/alertas.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const AHORA = Date.parse("2026-10-15T15:00:00Z");
const horasAtras = (h) => new Date(AHORA - h * 3_600_000).toISOString();
const base = {
  id: "l",
  name: "Octubre",
  cliente: "Aida Qui",
  starts_on: "2026-10-10",
  sitios: [{ id: "s", name: "Landings Aida", ultimoEvento: horasAtras(1) }],
  usaMailerlite: false,
  webhookFallidos: 0,
  ultimoErrorWebhook: null,
  ultimoRegistro: horasAtras(2),
};

test("alertas: un lanzamiento sano no molesta", () => {
  assert.deepEqual(evaluarAlertas([base], AHORA), []);
});

test("alertas: proyecto conectado en silencio, webhooks fallidos y días sin registros", () => {
  const alertas = evaluarAlertas(
    [
      {
        ...base,
        sitios: [{ id: "s", name: "Landings Aida", ultimoEvento: horasAtras(9) }],
        webhookFallidos: 3,
        ultimoErrorWebhook: "Firma inválida",
        ultimoRegistro: horasAtras(30),
      },
    ],
    AHORA,
  );
  assert.deepEqual(alertas.map((a) => a.id), ["l:webhook", "l:sitio:s", "l:registros"]);
  assert.match(alertas[0].titulo, /3 avisos fallaron/);
  assert.match(alertas[0].detalle, /Firma inválida/);
  assert.match(alertas[1].titulo, /hace 9 h/);
  assert.match(alertas[2].titulo, /hace 30 h/);
  // Los errores van antes que los avisos.
  assert.deepEqual(alertas.map((a) => a.gravedad), ["error", "error", "aviso"]);
});

test("alertas: el primer día no exige tráfico, y sin fuentes no se espera ningún registro", () => {
  const recienEmpezado = { ...base, starts_on: "2026-10-15", sitios: [{ id: "s", name: "x", ultimoEvento: null }], ultimoRegistro: null };
  assert.deepEqual(evaluarAlertas([recienEmpezado], AHORA), []);
  const sinFuentes = { ...base, sitios: [], usaMailerlite: false, ultimoRegistro: null };
  assert.deepEqual(evaluarAlertas([sinFuentes], AHORA), []);
});

test("diagnóstico público: dice qué falta, nunca valores ni largos ni el entorno", () => {
  const ruta = leer("../app/api/health/route.ts");
  assert.doesNotMatch(ruta, /\.length/);
  assert.doesNotMatch(ruta, /VERCEL_ENV/);
  assert.match(ruta, /const presente = \(v: string \| undefined\) => Boolean\(v\)/);
});
