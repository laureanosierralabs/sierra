import test from "node:test";
import assert from "node:assert/strict";

const { rangoDePeriodo, filtrarPorPeriodo } = await import("../lib/lanzamientos/vista.ts");

// 16/10 a las 01:00 en Buenos Aires = 16/10 04:00 UTC.
const AHORA = new Date("2026-10-16T04:00:00Z");

test("rangoDePeriodo: días contados hacia atrás desde hoy, en hora de Buenos Aires", () => {
  assert.deepEqual(rangoDePeriodo("hoy", AHORA), { desde: "2026-10-16", hasta: "2026-10-16", dias: 1 });
  assert.deepEqual(rangoDePeriodo("ayer", AHORA), { desde: "2026-10-15", hasta: "2026-10-15", dias: 1 });
  assert.deepEqual(rangoDePeriodo("7d", AHORA), { desde: "2026-10-10", hasta: "2026-10-16", dias: 7 });
  assert.deepEqual(rangoDePeriodo("30d", AHORA), { desde: "2026-09-17", hasta: "2026-10-16", dias: 30 });
  assert.equal(rangoDePeriodo("todo", AHORA), null);
  // A las 23:30 del 15 en Argentina ya es 16 en UTC: "hoy" sigue siendo el 15.
  assert.equal(rangoDePeriodo("hoy", new Date("2026-10-16T02:30:00Z")).desde, "2026-10-15");
});

test("filtrarPorPeriodo: registros, visitas y ventas del rango; el día de un registro es el de Argentina", () => {
  const datos = {
    paginas: [{ id: "a" }],
    listas: ["se conserva"],
    registros: [
      { id: "1", registered_at: "2026-10-16T02:30:00Z" }, // 15/10 23:30 en Argentina
      { id: "2", registered_at: "2026-10-16T12:00:00Z" },
      { id: "3", registered_at: "2026-10-09T12:00:00Z" },
    ],
    visitas: [
      { page_id: "a", day: "2026-10-15", visitors: 10 },
      { page_id: "a", day: "2026-10-09", visitors: 5 },
    ],
    compras: [{ id: "c", occurred_at: "2026-10-15T15:00:00Z" }],
  };
  const ayer = filtrarPorPeriodo(datos, rangoDePeriodo("ayer", AHORA));
  assert.deepEqual(ayer.registros.map((r) => r.id), ["1"]);
  assert.equal(ayer.visitas.length, 1);
  assert.equal(ayer.compras.length, 1);
  assert.deepEqual(ayer.listas, ["se conserva"]);
  const semana = filtrarPorPeriodo(datos, rangoDePeriodo("7d", AHORA));
  assert.deepEqual(semana.registros.map((r) => r.id), ["1", "2"]);
  assert.equal(filtrarPorPeriodo(datos, null), datos);
});
