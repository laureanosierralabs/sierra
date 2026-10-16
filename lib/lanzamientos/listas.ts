/**
 * Cruce de los registros de un lanzamiento con otras listas (asistentes de
 * Zoom, grupo de WhatsApp, compradores). Lógica pura: lee el CSV en el
 * navegador, el servidor revalida cada fila, y el cruce se calcula al leer.
 */
import { parsearCsv } from "@/lib/lanzamientos/importar";

/** Nombres sugeridos: el orden es el del embudo después del registro. */
export const LISTAS_SUGERIDAS = ["Entró al grupo de WhatsApp", "Asistió al webinar", "Compró"] as const;

/** Tope por lista: viaja compacto ([email, teléfono]) y entra en una server action (1 MB). */
export const TOPE_MIEMBROS = 5000;

export interface Miembro {
  email: string | null;
  phone: string | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Celular argentino escrito a la antigua: "011 15 4444 5555" o
 * "221 15 555 1234". Se saca el "15" que va después de la característica
 * (2, 3 o 4 dígitos). Solo con la forma local: con prefijo 0, o 12 dígitos
 * que no empiezan con un código de país (54 Argentina, 55 Brasil, 59x).
 */
function sinQuince(digitos: string): string {
  const conCero = digitos.startsWith("0");
  const base = conCero ? digitos.slice(1) : digitos;
  if (base.length !== 12) return digitos;
  if (!conCero && /^(54|55|59)/.test(base)) return digitos;
  for (const largo of [2, 3, 4]) {
    if (base.slice(largo, largo + 2) === "15") return base.slice(0, largo) + base.slice(largo + 2);
  }
  return digitos;
}

/**
 * Teléfono a sus últimos 10 dígitos: "+54 9 221 555-1234", "0221 15 555 1234"
 * y "5492215551234" terminan igual. Corto (menos de 8 dígitos) = no sirve.
 */
export function normalizarTelefono(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const digitos = sinQuince(valor.replace(/\D/g, ""));
  return digitos.length >= 8 ? digitos.slice(-10) : null;
}

export function normalizarEmail(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const e = valor.trim().toLowerCase();
  return EMAIL.test(e) && e.length <= 254 ? e : null;
}

const normalizar = (h: string) =>
  h.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_");

/* Email: primero el nombre exacto; después "Customer Email" (Stripe), "Email do comprador" (Hotmart). */
const EMAIL_EXACTO = /^(e-?mail|e_mail|correo|correo_electronico|mail)$/;
const EMAIL_PARECIDO = /(^|_)(e-?mail|correo)(_|$)/;
const NO_ES_EMAIL = /(verified|verificado|status|estado|opt|consent|secondary|secundario|domain|dominio)/;
const COLUMNA_TELEFONO = /(phone|telefono|celular|whats.?app|movil|numero)/;
/* "Número de pedido", "Número de socio": no son teléfonos. */
const NO_ES_TELEFONO = /(order|orden|pedido|factura|invoice|socio|documento|dni|cuit|id$|_id)/;
/* Zoom marca con "Attended: No" a los registrados que no entraron. */
const COLUMNA_ASISTIO = /^(attended|asistio|asistencia)$/;
const NEGATIVO = /^(no|false|0)$/i;

const esEmail = (h: string) => (EMAIL_EXACTO.test(h) || EMAIL_PARECIDO.test(h)) && !NO_ES_EMAIL.test(h);
const esTelefono = (h: string) => COLUMNA_TELEFONO.test(h) && !NO_ES_TELEFONO.test(h);

export interface ListaLeida {
  miembros: Miembro[];
  /** Fila del encabezado entre las filas con datos (1 = primera): Zoom pone un resumen antes de la tabla. */
  filaEncabezado: number;
  columnas: { email: string | null; telefono: string | null; asistio: string | null };
  /** Filas sin email ni teléfono válidos. */
  descartadas: number;
  /** Marcadas como que no asistieron (reporte de Zoom). */
  noAsistieron: number;
  repetidos: number;
}

/**
 * CSV de cualquier herramienta a miembros. El encabezado es la ÚLTIMA fila,
 * entre las 30 primeras, que tenga una columna de email o teléfono y ningún
 * email adentro: los reportes de Zoom ponen arriba un resumen con su propia
 * fila de títulos ("User Email" del anfitrión) y recién después la tabla.
 */
export function leerLista(texto: string): ListaLeida | null {
  const filas = parsearCsv(texto);
  let indice = -1;
  filas.slice(0, 30).forEach((f, i) => {
    const titulos = f.map(normalizar);
    if (titulos.some((h) => esEmail(h) || esTelefono(h)) && !f.some((c) => c.includes("@"))) indice = i;
  });
  if (indice < 0) return null;

  const encabezado = filas[indice].map(normalizar);
  // El nombre exacto ("Email") gana sobre uno parecido ("Customer Email").
  const exacto = encabezado.findIndex((h) => EMAIL_EXACTO.test(h));
  const iEmailFinal = exacto >= 0 ? exacto : encabezado.findIndex(esEmail);
  const iTelefono = encabezado.findIndex(esTelefono);
  const iAsistio = encabezado.findIndex((h) => COLUMNA_ASISTIO.test(h));

  const vistos = new Set<string>();
  const miembros: Miembro[] = [];
  let descartadas = 0;
  let noAsistieron = 0;
  let repetidos = 0;
  for (const fila of filas.slice(indice + 1)) {
    if (iAsistio >= 0 && NEGATIVO.test((fila[iAsistio] ?? "").trim())) {
      noAsistieron++;
      continue;
    }
    const m = {
      email: iEmailFinal >= 0 ? normalizarEmail(fila[iEmailFinal]) : null,
      phone: iTelefono >= 0 ? normalizarTelefono(fila[iTelefono]) : null,
    };
    if (!m.email && !m.phone) {
      descartadas++;
      continue;
    }
    const clave = m.email ?? `tel:${m.phone}`;
    if (vistos.has(clave)) {
      repetidos++;
      continue;
    }
    vistos.add(clave);
    miembros.push(m);
  }

  const nombre = (i: number) => (i >= 0 ? filas[indice][i].trim() : null);
  return {
    miembros,
    filaEncabezado: indice + 1,
    columnas: { email: nombre(iEmailFinal), telefono: nombre(iTelefono), asistio: nombre(iAsistio) },
    descartadas,
    noAsistieron,
    repetidos,
  };
}

/** Forma compacta para enviar al servidor: [email, teléfono]. */
export const compactar = (miembros: Miembro[]) => miembros.map((m) => [m.email, m.phone]);

export interface ListaCruzada {
  id: string;
  name: string;
  /** Personas en la lista. */
  total: number;
  /** Registros que están en la lista. */
  cruzan: number;
  /** Los mismos, por landing (la clave "" junta los que no tienen landing). */
  porPagina: Record<string, number>;
  /** De la lista, cuántas no aparecen entre los registros (entraron por otro lado). */
  sinRegistro: number;
}

/**
 * Cruza cada lista con los registros: un registro está en la lista si
 * coincide el email o el teléfono. Devuelve conteos (total y por landing),
 * nunca datos personales: es lo único que necesita el filtro del panel.
 */
export function cruzarListas(
  registros: { id: string; page_id: string | null; email: string; phone: string | null }[],
  listas: { id: string; name: string; miembros: Miembro[] }[],
): ListaCruzada[] {
  const porEmail = new Map<string, string[]>();
  const porTelefono = new Map<string, string[]>();
  const paginaDe = new Map<string, string>();
  const agregar = (mapa: Map<string, string[]>, clave: string | null, id: string) => {
    if (!clave) return;
    const lista = mapa.get(clave);
    if (lista) lista.push(id);
    else mapa.set(clave, [id]);
  };
  for (const r of registros) {
    paginaDe.set(r.id, r.page_id ?? "");
    agregar(porEmail, normalizarEmail(r.email), r.id);
    agregar(porTelefono, normalizarTelefono(r.phone), r.id);
  }

  return listas.map((l) => {
    const ids = new Set<string>();
    let sinRegistro = 0;
    for (const m of l.miembros) {
      const coincide = [...(m.email ? (porEmail.get(m.email) ?? []) : []), ...(m.phone ? (porTelefono.get(m.phone) ?? []) : [])];
      if (coincide.length === 0) sinRegistro++;
      for (const id of coincide) ids.add(id);
    }
    const porPagina: Record<string, number> = {};
    for (const id of ids) {
      const pagina = paginaDe.get(id) ?? "";
      porPagina[pagina] = (porPagina[pagina] ?? 0) + 1;
    }
    return { id: l.id, name: l.name, total: l.miembros.length, cruzan: ids.size, porPagina, sinRegistro };
  });
}
