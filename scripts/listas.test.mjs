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

const { normalizarTelefono, leerLista, cruzarListas } = await import("../lib/lanzamientos/listas.ts");
const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\r\n/g, "\n");

test("normalizarTelefono: el mismo celular escrito de distintas formas coincide", () => {
  const formas = ["+54 9 221 555-1234", "5492215551234", "(221) 555 1234", "2215551234", "0221 15 555 1234", "221 15 555-1234"];
  for (const f of formas) assert.equal(normalizarTelefono(f), "2215551234", f);
  assert.equal(normalizarTelefono("011 15 4444 5555"), normalizarTelefono("+54 9 11 4444 5555"));
  assert.equal(normalizarTelefono("+34 612 345 678"), "4612345678");
  assert.equal(normalizarTelefono("1234"), null);
  assert.equal(normalizarTelefono(null), null);
});

test("leerLista: reporte de Zoom con resumen arriba y registrados que no asistieron", () => {
  const zoom = [
    "Attendee Report",
    "Topic,Webinar ID,Actual Start Time",
    "Academia ADN,123 456 789,10/09/2026 19:00",
    "",
    "Attendee Details",
    "Attended,User Name (Original Name),First Name,Last Name,Email,Join Time,Time in Session (minutes)",
    "Yes,Ana,Ana,P,ANA@mail.com,10/09/2026 19:02,55",
    "No,Bea,Bea,Q,bea@mail.com,--,0",
    "Yes,Ana otra vez,Ana,P,ana@mail.com,10/09/2026 19:40,10",
    "Yes,Sin mail,,,,10/09/2026 19:05,30",
  ].join("\n");
  const r = leerLista(zoom);
  assert.equal(r.filaEncabezado, 5);
  assert.deepEqual(r.miembros, [{ email: "ana@mail.com", phone: null }]);
  assert.equal(r.noAsistieron, 1);
  assert.equal(r.repetidos, 1);
  assert.equal(r.descartadas, 1);
  assert.equal(r.columnas.asistio, "Attended");
});

test("leerLista: miembros de WhatsApp por teléfono; un número de pedido no es teléfono", () => {
  const wa = leerLista("Nombre;Número\nAna;+54 9 221 555-1234\nBea;011 15 4444 5555\n");
  assert.deepEqual(wa.miembros.map((m) => m.phone), ["2215551234", "1144445555"]);
  const stripe = leerLista("Order Number,Customer Email,Amount\n9988776655443,a@b.com,100\n");
  assert.deepEqual(stripe.miembros, [{ email: "a@b.com", phone: null }]);
  assert.equal(leerLista("id,nombre\n1,Ana\n"), null);
});

test("cruzarListas: cruza por email o teléfono y cuenta los que no se registraron", () => {
  const registros = [
    { id: "r1", page_id: "a", email: "ana@mail.com", phone: null },
    { id: "r2", page_id: "b", email: "bea@mail.com", phone: "+54 9 221 555-1234" },
    { id: "r3", page_id: "a", email: "cami@mail.com", phone: null },
  ];
  const [l] = cruzarListas(registros, [
    {
      id: "w",
      name: "Grupo",
      miembros: [
        { email: "ana@mail.com", phone: null },
        { email: null, phone: "2215551234" },
        { email: "otro@mail.com", phone: null },
      ],
    },
  ]);
  // Solo conteos, nunca ids ni datos personales.
  assert.equal(l.cruzan, 2);
  assert.deepEqual(l.porPagina, { a: 1, b: 1 });
  assert.equal("registroIds" in l, false);
  assert.equal(l.total, 3);
  assert.equal(l.sinRegistro, 1);
});

test("listas: solo el owner importa, se guardan solo email y teléfono normalizados, y nunca a medias", () => {
  const acciones = leer("../app/landing-pages/lanzamiento-acciones.ts");
  const fn = acciones.slice(acciones.indexOf("export async function importarLista("));
  const cuerpo = fn.slice(0, fn.indexOf("\n}\n"));
  assert.match(cuerpo.slice(0, 200), /await exigirOwner\(\);/);
  assert.match(cuerpo, /normalizarEmail\(email\), phone: normalizarTelefono\(phone\)/);
  assert.match(cuerpo, /from\("launches"\)\.select\("client_id"\)/);
  // Reemplazo seguro: la anterior se borra recién cuando la nueva está completa.
  assert.ok(cuerpo.indexOf('.eq("id", anterior.id)') > cuerpo.indexOf('from("launch_list_members")'));
  assert.match(cuerpo, /position: posicion/);
  const datos = leer("../lib/lanzamientos/datos.ts");
  const lectura = datos.slice(datos.indexOf("async function listasDeLanzamiento("));
  assert.match(lectura, /from\("launch_lists"\)[\s\S]*\.eq\("client_id", clientId\)/);
  assert.match(lectura, /from\("launch_list_members"\)[\s\S]*\.eq\("client_id", clientId\)/);
});

test("revisión: resumen de reunión de Zoom, columnas engañosas y teléfonos de otros países", () => {
  // El resumen de una reunión de Zoom trae su propia fila con "User Email" (el anfitrión).
  const reunion = [
    "Meeting ID,Topic,Start Time,User Email,Duration (Minutes),Participants",
    "123,Clase,10/09/2026 19:00,host@sierra.com,60,2",
    "",
    "Name (Original Name),User Email,Join Time,Duration (Minutes)",
    "Ana,ana@mail.com,10/09/2026 19:01,59",
    "Bea,bea@mail.com,10/09/2026 19:05,30",
  ].join("\n");
  assert.deepEqual(leerLista(reunion).miembros.map((m) => m.email), ["ana@mail.com", "bea@mail.com"]);
  // "Email verified" no es la columna del email; "Email" sí, aunque venga después.
  const verificado = leerLista("email_verified,Email\ntrue,a@b.com\n");
  assert.deepEqual(verificado.miembros, [{ email: "a@b.com", phone: null }]);
  // Un número con código de país no pierde un "15" que es parte del número.
  assert.equal(normalizarTelefono("54 11 1534 5678"), normalizarTelefono("11 1534 5678"));
  assert.equal(normalizarTelefono("55 15 3333 4444"), "1533334444");
  // "Número de socio" no es un teléfono.
  assert.equal(leerLista("Email,Número de socio\na@b.com,12345678\n").columnas.telefono, null);
});
