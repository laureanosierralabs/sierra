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

const { temaWebinar, TEMA_SYNX } = await import("../lib/lanzamientos/temas-webinar.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("el tema sale del dominio de las landings, con o sin www", () => {
  assert.equal(temaWebinar([null, "https://www.manuelazuluaga.com/registro"]).marca, "Manuela Zuluaga");
  assert.equal(temaWebinar(["https://manuelazuluaga.com"]).boton, "#4d0e13");
});

test("Pilar usa la paleta de Volver al Origen y llama seminario a su evento", () => {
  const t = temaWebinar(["https://lp.pilarsousa.es/volver-al-origen"]);
  assert.equal(t.marca, "Pilar Sousa");
  assert.equal(t.evento, "seminario");
  assert.equal(t.boton, "#b4e236");
  assert.equal(TEMA_SYNX.evento, "webinar");
});

test("sin dominio conocido, o sin landings, sale el de synx build", () => {
  assert.equal(temaWebinar(["https://otra-landing.com"]), TEMA_SYNX);
  assert.equal(temaWebinar([]), TEMA_SYNX);
  assert.equal(temaWebinar(["no es una url", undefined]), TEMA_SYNX);
});

test("la página del webinar usa el tema y habla en español neutro", () => {
  const w = leer("../app/w/[token]/route.ts");
  assert.match(w, /temaWebinar\(/);
  assert.match(w, /Entra al \$\{escapar\(t\.evento\)\}/);
  assert.doesNotMatch(w, /Entrá|Escribí|Revisá|Volvé|intentá/);
});
