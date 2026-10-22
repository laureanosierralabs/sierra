/**
 * Diagrama del embudo de una cotización: qué pasos existen, cómo se validan
 * y cómo se sugieren a partir de los ítems. Lógica pura.
 */

export type CategoriaPaso = "pagina" | "integracion" | "separador";

export const PASOS = {
  registro: { etiqueta: "Registro", categoria: "pagina" },
  lead_magnet: { etiqueta: "Lead magnet", categoria: "pagina" },
  lista_espera: { etiqueta: "Lista de espera", categoria: "pagina" },
  diagnostico: { etiqueta: "Diagnóstico", categoria: "pagina" },
  gracias: { etiqueta: "Gracias", categoria: "pagina" },
  webinar: { etiqueta: "Webinar", categoria: "pagina" },
  ventas: { etiqueta: "Ventas", categoria: "pagina" },
  checkout: { etiqueta: "Checkout", categoria: "pagina" },
  post_checkout: { etiqueta: "Checkout post", categoria: "pagina" },
  inicio: { etiqueta: "Inicio", categoria: "pagina" },
  empresa: { etiqueta: "Empresa", categoria: "pagina" },
  productos: { etiqueta: "Productos", categoria: "pagina" },
  contacto: { etiqueta: "Contacto", categoria: "pagina" },
  formulario: { etiqueta: "Formulario", categoria: "integracion" },
  stripe: { etiqueta: "Stripe", categoria: "integracion" },
  hotmart: { etiqueta: "Hotmart", categoria: "integracion" },
  ghl: { etiqueta: "Go High Level", categoria: "integracion" },
  mailerlite: { etiqueta: "MailerLite", categoria: "integracion" },
  email: { etiqueta: "Email", categoria: "integracion" },
  zoom: { etiqueta: "Zoom", categoria: "integracion" },
  whatsapp: { etiqueta: "WhatsApp", categoria: "integracion" },
  separador: { etiqueta: "Separador", categoria: "separador" },
} as const satisfies Record<string, { etiqueta: string; categoria: CategoriaPaso }>;

export type TipoPaso = keyof typeof PASOS;
export const TIPOS_PASO = Object.keys(PASOS) as TipoPaso[];

export interface PasoEmbudo {
  tipo: TipoPaso;
  /** Nombre a medida ("Página de registro V2"); sin él, el del tipo. */
  etiqueta?: string;
}

export const MAX_PASOS = 12;

export const etiquetaDe = (p: PasoEmbudo) => p.etiqueta?.trim() || PASOS[p.tipo].etiqueta;

/** Pasos válidos, con tope; sin separadores al principio, al final ni seguidos. */
export function validarEmbudo(crudo: unknown): PasoEmbudo[] {
  if (!Array.isArray(crudo)) return [];
  const pasos: PasoEmbudo[] = [];
  for (const v of crudo) {
    const fila = (v ?? {}) as Record<string, unknown>;
    if (typeof fila.tipo !== "string" || !(fila.tipo in PASOS)) continue;
    const tipo = fila.tipo as TipoPaso;
    if (tipo === "separador" && (pasos.length === 0 || pasos.at(-1)?.tipo === "separador")) continue;
    const etiqueta = typeof fila.etiqueta === "string" ? fila.etiqueta.trim().slice(0, 40) : "";
    pasos.push(etiqueta && tipo !== "separador" ? { tipo, etiqueta } : { tipo });
    if (pasos.length >= MAX_PASOS) break;
  }
  while (pasos.at(-1)?.tipo === "separador") pasos.pop();
  return pasos;
}

const normalizar = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* Orden importa: "post checkout" antes que "checkout". */
const PAGINAS_POR_TEXTO: [RegExp, TipoPaso][] = [
  [/post.?(directo.?)?checkout|checkout.?post/, "post_checkout"],
  [/checkout/, "checkout"],
  [/lista de espera/, "lista_espera"],
  [/diagnostico/, "diagnostico"],
  [/lead.?magnet/, "lead_magnet"],
  [/gracias|confirmacion/, "gracias"],
  [/webinar|masterclass|clase en vivo/, "webinar"],
  [/registro|captura|inscripcion/, "registro"],
  [/venta/, "ventas"],
  [/^inicio|home/, "inicio"],
  [/empresa|nosotros/, "empresa"],
  [/productos|servicios/, "productos"],
  [/contacto/, "contacto"],
];

const INTEGRACIONES_POR_TEXTO: [RegExp, TipoPaso][] = [
  [/stripe/, "stripe"],
  [/hotmart/, "hotmart"],
  [/\bghl\b|go ?high ?level|highlevel/, "ghl"],
  [/mailerlite/, "mailerlite"],
  [/zoom/, "zoom"],
  [/e-?mail/, "email"],
  [/whats.?app/, "whatsapp"],
];

/**
 * Sugiere el embudo a partir de los ítems (las páginas, en su orden) y de lo
 * que incluye el servicio (las integraciones). El pago va después de la
 * página de venta o checkout; email, Zoom y WhatsApp, al final.
 */
export function sugerirEmbudo(titulosItems: string[], incluye: string[] = []): PasoEmbudo[] {
  const paginas: PasoEmbudo[] = [];
  for (const t of titulosItems) {
    const n = normalizar(t);
    const tipo = PAGINAS_POR_TEXTO.find(([re]) => re.test(n))?.[1];
    if (tipo && !paginas.some((p) => p.tipo === tipo)) paginas.push({ tipo });
  }

  const texto = normalizar([...titulosItems, ...incluye].join(" \n "));
  const integraciones = INTEGRACIONES_POR_TEXTO.filter(([re]) => re.test(texto)).map(([, tipo]) => tipo);
  const pagos: TipoPaso[] = integraciones.filter((t) => t === "stripe" || t === "hotmart");
  const resto = integraciones.filter((t) => !pagos.includes(t));

  const pasos: PasoEmbudo[] = [];
  let pagoPuesto = false;
  for (const p of paginas) {
    pasos.push(p);
    if (!pagoPuesto && (p.tipo === "ventas" || p.tipo === "checkout") && pagos.length) {
      pasos.push(...pagos.map((tipo) => ({ tipo })));
      pagoPuesto = true;
    }
  }
  if (!pagoPuesto) pasos.push(...pagos.map((tipo) => ({ tipo })));
  pasos.push(...resto.map((tipo) => ({ tipo })));
  return validarEmbudo(pasos);
}
