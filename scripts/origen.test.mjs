import test from "node:test";
import assert from "node:assert/strict";

const { normalizarOrigen, resumirOrigenes, rankingUtm, rankingVentasUtm, partirAnuncio, sumarPorMoneda, ORIGEN_DIRECTO } = await import(
  "../lib/lanzamientos/origen.ts"
);
const { filtrarPorLanding, filtrarPorPeriodo } = await import("../lib/lanzamientos/vista.ts");

test("normalizarOrigen agrupa redes, mail y buscadores", () => {
  const casos = {
    "instagram.com": "Instagram",
    "l.instagram.com": "Instagram",
    "facebook.com": "Facebook",
    "m.facebook.com": "Facebook",
    "l.facebook.com": "Facebook",
    "lm.facebook.com": "Facebook",
    "web.facebook.com": "Facebook",
    "youtube.com": "YouTube",
    "m.youtube.com": "YouTube",
    "threads.com": "Threads",
    "my.manychat.com": "ManyChat",
    "com.google.android.gm": "Email",
    "mail.google.com": "Email",
    "outlook.live.com": "Email",
    "outlook.office.com": "Email",
    "mail.yahoo.com": "Email",
    "webmail.ejemplo.com": "Email",
    "google.com": "Buscadores",
    "google.com.ar": "Buscadores",
    "www.google.es": "Buscadores",
    "bing.com": "Buscadores",
    "duckduckgo.com": "Buscadores",
    "search.brave.com": "Buscadores",
    "com.google.android.googlequicksearchbox": "Buscadores",
  };
  for (const [host, canal] of Object.entries(casos)) assert.equal(normalizarOrigen(host), canal, host);
});

test("normalizarOrigen: vacío es directo y lo desconocido queda como dominio", () => {
  assert.equal(normalizarOrigen(null), ORIGEN_DIRECTO);
  assert.equal(normalizarOrigen(undefined), ORIGEN_DIRECTO);
  assert.equal(normalizarOrigen("  "), ORIGEN_DIRECTO);
  assert.equal(normalizarOrigen("www.Ejemplo.com"), "ejemplo.com");
  assert.equal(normalizarOrigen("https://l.instagram.com/x?y=1"), "Instagram");
  // Parecido pero distinto: no se confunde.
  assert.equal(normalizarOrigen("notinstagram.com"), "notinstagram.com");
  assert.equal(normalizarOrigen("googleads.example.com"), "googleads.example.com");
});

test("resumirOrigenes suma por canal, ordena y descarta vacíos", () => {
  const r = resumirOrigenes([
    { referrer_host: "l.instagram.com", visitors: 5 },
    { referrer_host: "instagram.com", visitors: "3" },
    { referrer_host: null, visitors: 10 },
    { referrer_host: "otro.com", visitors: 1 },
    { referrer_host: "facebook.com", visitors: 0 },
  ]);
  assert.deepEqual(r, [
    { origen: ORIGEN_DIRECTO, visitantes: 10 },
    { origen: "Instagram", visitantes: 8 },
    { origen: "otro.com", visitantes: 1 },
  ]);
  assert.deepEqual(resumirOrigenes([]), []);
});

const reg = (utm_campaign, utm_content) => ({ utm_campaign, utm_content });

test("rankingUtm agrupa, ordena, calcula el porcentaje y junta lo vacío", () => {
  const registros = [reg("c1", "a1"), reg("c1", null), reg("c2", ""), reg(null, "a1"), reg("  ", null)];
  const c = rankingUtm(registros, "utm_campaign");
  assert.equal(c.hayValor, true);
  assert.deepEqual(c.filas, [
    { valor: "c1", registros: 2, porcentaje: 40 },
    { valor: null, registros: 2, porcentaje: 40 },
    { valor: "c2", registros: 1, porcentaje: 20 },
  ]);
  const a = rankingUtm(registros, "utm_content");
  assert.deepEqual(a.filas[0], { valor: null, registros: 3, porcentaje: 60 });
});

test("rankingUtm: top 10 y sin valores no hay nada que mostrar", () => {
  const muchos = Array.from({ length: 15 }, (_, i) => reg(`c${i}`, null));
  assert.equal(rankingUtm(muchos, "utm_campaign").filas.length, 10);
  const vacio = rankingUtm([reg(null, null), reg("", " ")], "utm_campaign");
  assert.equal(vacio.hayValor, false);
  assert.deepEqual(rankingUtm([], "utm_content"), { filas: [], hayValor: false });
});

test("los referrers se filtran por landing y por período como las visitas", () => {
  const datos = {
    paginas: [],
    registros: [],
    visitas: [],
    compras: [],
    referrers: [
      { page_id: "a", day: "2026-10-10", referrer_host: null, visitors: 1 },
      { page_id: "b", day: "2026-10-11", referrer_host: null, visitors: 2 },
    ],
  };
  assert.deepEqual(filtrarPorLanding(datos, "a").referrers.map((r) => r.visitors), [1]);
  const rango = { desde: "2026-10-11", hasta: "2026-10-11", dias: 1 };
  assert.deepEqual(filtrarPorPeriodo(datos, rango).referrers.map((r) => r.visitors), [2]);
  // Sin referrers no se inventan.
  assert.equal(filtrarPorLanding({ ...datos, referrers: undefined }, "a").referrers, undefined);
});

const venta = (utm_content, utm_campaign, amount, currency = "USD") => ({
  amount,
  currency,
  utm_content,
  utm_campaign,
});

test("rankingVentasUtm agrupa ventas por anuncio con ingresos por moneda", () => {
  const compras = [
    venta("Ad_A|120258081468600777", "Camp1", 10),
    venta("Ad_A|120258081468600777", "Camp1", 10),
    venta("Ad_B|120258081468600888", "Camp2", 30),
    venta("Ad_B|120258081468600888", "Camp2", 5000, "ARS"),
    venta("Ad_C|1", "Camp2", 7),
    venta(null, null, 7),
    venta("  ", null, null),
  ];
  const r = rankingVentasUtm(compras, "utm_content");
  assert.equal(r.hayValor, true);
  assert.deepEqual(
    r.filas.map((f) => [f.valor, f.ventas]),
    [
      ["Ad_B|120258081468600888", 2],
      ["Ad_A|120258081468600777", 2],
      ["Ad_C|1", 1],
      [null, 2],
    ].sort((a, b) => b[1] - a[1] || (a[0] === null) - (b[0] === null)),
  );
  const b = r.filas.find((f) => f.valor === "Ad_B|120258081468600888");
  assert.deepEqual(b.ingresos, [
    ["ARS", 5000],
    ["USD", 30],
  ]);
  assert.equal(b.porcentaje, 28.6);
  const porCampana = rankingVentasUtm(compras, "utm_campaign", 1);
  assert.equal(porCampana.filas.length, 1);
});

test("rankingVentasUtm sin UTM no dice nada y respeta el tope", () => {
  const r = rankingVentasUtm([venta(null, null, 5), venta("", "", 5)], "utm_content");
  assert.equal(r.hayValor, false);
  assert.equal(rankingVentasUtm([], "utm_content").filas.length, 0);
});

test("partirAnuncio separa el nombre del id de Meta", () => {
  assert.deepEqual(partirAnuncio("Ad_Activacion7Nov_5|120258081468600777"), {
    nombre: "Ad_Activacion7Nov_5",
    id: "120258081468600777",
  });
  assert.deepEqual(partirAnuncio("120258081468600777"), { nombre: "120258081468600777", id: null });
  assert.deepEqual(partirAnuncio("a|b"), { nombre: "a|b", id: null });
});

test("sumarPorMoneda ignora montos nulos", () => {
  assert.deepEqual(sumarPorMoneda([{ amount: null, currency: "USD" }, { amount: 2, currency: null }]), [["—", 2]]);
});
