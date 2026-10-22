import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { sugerirEmbudo, validarEmbudo, etiquetaDe, MAX_PASOS } = await import("../lib/landing/embudo.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const tipos = (pasos) => pasos.map((p) => p.tipo);

test("sugerir: el funnel de Chema (registro, gracias, checkout, post checkout)", () => {
  const items = ["Página de registro", "Página de gracias", "Página de checkout", "Página de post directo checkout"];
  assert.deepEqual(tipos(sugerirEmbudo(items)), ["registro", "gracias", "checkout", "post_checkout"]);
});

test("sugerir: el de Simón (venta → Stripe → gracias → WhatsApp), con integraciones sacadas de lo que incluye", () => {
  const items = ["Página de venta", "Página de confirmación de compra"];
  const incluye = ["Integración del checkout de Stripe con GHL", "Email de bienvenida con acceso a grupo de WhatsApp"];
  // El pago va justo después de la página de venta; GHL, email y WhatsApp al final.
  assert.deepEqual(tipos(sugerirEmbudo(items, incluye)), ["ventas", "stripe", "gracias", "ghl", "email", "whatsapp"]);
});

test("sugerir: un sitio web institucional", () => {
  assert.deepEqual(tipos(sugerirEmbudo(["Inicio", "Empresa", "Productos", "Contacto"])), ["inicio", "empresa", "productos", "contacto"]);
  assert.deepEqual(sugerirEmbudo(["Mantenimiento mensual"]), []);
});

test("validar: tipos conocidos, separadores solo entre pasos, nombres cortos y tope", () => {
  assert.deepEqual(
    validarEmbudo([
      { tipo: "separador" },
      { tipo: "registro", etiqueta: "  Registro V2 " },
      { tipo: "inventado" },
      { tipo: "separador" },
      { tipo: "separador" },
      { tipo: "checkout" },
      { tipo: "separador" },
    ]),
    [{ tipo: "registro", etiqueta: "Registro V2" }, { tipo: "separador" }, { tipo: "checkout" }],
  );
  assert.equal(validarEmbudo(Array.from({ length: 30 }, () => ({ tipo: "registro" }))).length, MAX_PASOS);
  assert.deepEqual(validarEmbudo("x"), []);
  assert.equal(etiquetaDe({ tipo: "post_checkout" }), "Checkout post");
  assert.equal(etiquetaDe({ tipo: "registro", etiqueta: "Registro A" }), "Registro A");
});

test("el embudo se guarda validado, se copia al duplicar y el link público lo revalida", () => {
  const acciones = leer("../app/landing-pages/acciones.ts");
  assert.match(acciones, /\{ funnel: validarEmbudo\(crudo\) \}/);
  assert.match(acciones, /funnel: original\.funnel/);
  const datos = leer("../lib/landing/datos.ts");
  assert.match(datos, /funnel: validarEmbudo\(/);
  // Animado en el link; quieto al imprimir y con "reducir movimiento".
  const css = leer("../app/globals.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.embudo-flecha--animada::after/);
  assert.match(css, /@media print \{\s*\.embudo-flecha--animada::after/);
});
