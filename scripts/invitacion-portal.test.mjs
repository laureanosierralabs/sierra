import test from "node:test";
import assert from "node:assert/strict";
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

const { invitacionPortalEmail, escaparHtml } = await import("../lib/email/invitacion-portal.ts");

test("escapa el nombre del cliente en el HTML y lo deja crudo en el texto", () => {
  const { html, text, subject } = invitacionPortalEmail(`<b>Ana</b> & "Co"`, "https://x.com/i?a=1&b=2");
  assert.ok(!html.includes("<b>Ana</b>"));
  assert.ok(html.includes("&lt;b&gt;Ana&lt;/b&gt; &amp; &quot;Co&quot;"));
  assert.ok(text.includes(`<b>Ana</b> & "Co"`));
  assert.ok(subject.includes("ya está listo"));
});

test("el link de invitación está en el botón y en el texto", () => {
  const { html, text } = invitacionPortalEmail("Pilar", "https://x.com/i?a=1&b=2");
  assert.ok(html.includes('href="https://x.com/i?a=1&amp;b=2"'));
  assert.ok(html.includes("Activar mi acceso"));
  assert.ok(text.includes("https://x.com/i?a=1&b=2"));
});

test("escaparHtml cubre comillas simples", () => {
  assert.equal(escaparHtml("'"), "&#39;");
});
