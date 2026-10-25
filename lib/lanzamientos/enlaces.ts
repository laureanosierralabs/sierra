/**
 * Enlaces de un lanzamiento (webinar y grupo de WhatsApp): armar el link que el
 * cliente pega en su herramienta de correo, saber si está funcionando y qué
 * lugares marcó como "ya lo puse". Lógica pura (sin I/O): se prueba en node.
 */

export type TipoEnlace = "webinar" | "grupo";
export const TIPOS_ENLACE: TipoEnlace[] = ["webinar", "grupo"];

export const esTipoEnlace = (v: unknown): v is TipoEnlace => v === "webinar" || v === "grupo";

/* ───────────── Herramienta de correo y variable del email ───────────── */

export type Herramienta = "ghl" | "mailerlite" | "ninguna";

export const HERRAMIENTAS: { id: Herramienta; etiqueta: string; variable: string | null }[] = [
  { id: "ghl", etiqueta: "GoHighLevel", variable: "{{contact.email}}" },
  { id: "mailerlite", etiqueta: "MailerLite", variable: "{$email}" },
  { id: "ninguna", etiqueta: "Sin variable", variable: null },
];

export function variableDe(h: Herramienta): string | null {
  return HERRAMIENTAS.find((x) => x.id === h)?.variable ?? null;
}

/** Host limpio de un dominio guardado con o sin https://, barra final o ruta (solo el host). */
export function hostDe(dominio: string | null | undefined): string | null {
  return dominio?.trim().replace(/^https?:\/\//i, "").split(/[/?#]/)[0] || null;
}

/**
 * Link estable de cada enlace. Con landing conectada, va con el dominio del
 * cliente (la landing lo reenvía al panel); sin landing, con el del panel.
 */
export function linkBase(tipo: TipoEnlace, token: string, dominio: string | null, origenPanel: string): string {
  const host = hostDe(dominio);
  if (host) return `https://${host}/${tipo === "webinar" ? "vivo" : "grupo"}/${token}`;
  return `${origenPanel.replace(/\/+$/, "")}/${tipo === "webinar" ? "w" : "g"}/${token}`;
}

/** El link base más el email del contacto, con la variable de la herramienta elegida. */
export function linkCompartir(base: string, herramienta: Herramienta): string {
  const variable = variableDe(herramienta);
  return variable ? `${base}?e=${variable}` : base;
}

/* ───────────── Destino del webinar ───────────── */

/** Solo http/https. "" = sin destino (null); inválido = undefined. */
export function urlDestino(valor: string): string | null | undefined {
  const v = valor.trim();
  if (v === "") return null;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/* ───────────── Estado ───────────── */

export type EstadoEnlace = "falta-destino" | "sin-usos" | "funcionando";

const MIN = 60_000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

/** "hace 5 min", "hace 3 h", "hace 2 días". Fechas futuras o ilegibles: "justo ahora" / "". */
export function haceCuanto(iso: string | null, ahoraIso: string): string {
  if (!iso) return "";
  const dif = new Date(ahoraIso).getTime() - new Date(iso).getTime();
  if (Number.isNaN(dif)) return "";
  if (dif < MIN) return "hace unos segundos";
  if (dif < HORA) return `hace ${Math.floor(dif / MIN)} min`;
  if (dif < DIA) return `hace ${Math.floor(dif / HORA)} h`;
  const dias = Math.floor(dif / DIA);
  if (dias < 60) return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return `hace ${meses} meses`;
}

export interface ResumenEnlace {
  estado: EstadoEnlace;
  texto: string;
}

/**
 * Falta el destino (webinar sin URL, grupos sin cargar), listo pero sin usos
 * todavía, o funcionando (con usos y cuándo fue el último). Un uso sin fecha
 * se cuenta igual, sin el "hace X".
 */
export function resumenEnlace(entrada: {
  tieneDestino: boolean;
  usos: number;
  ultimoUso: string | null;
  ahoraIso: string;
}): ResumenEnlace {
  if (!entrada.tieneDestino) return { estado: "falta-destino", texto: "Falta el destino" };
  if (entrada.usos <= 0) return { estado: "sin-usos", texto: "Listo, sin usos todavía" };
  const usos = `${entrada.usos.toLocaleString("es-AR")} ${entrada.usos === 1 ? "uso" : "usos"}`;
  const cuando = haceCuanto(entrada.ultimoUso, entrada.ahoraIso);
  return { estado: "funcionando", texto: `Funcionando · ${usos}${cuando ? ` · último ${cuando}` : ""}` };
}

/* ───────────── "Dónde lo pusiste" ───────────── */

export const LUGARES = [
  { slug: "mail-registro", etiqueta: "Mail de confirmación del registro" },
  { slug: "recordatorios", etiqueta: "Recordatorios" },
  { slug: "pagina-gracias", etiqueta: "Página de gracias" },
  { slug: "whatsapp-redes", etiqueta: "WhatsApp o redes" },
] as const;

export type Lugar = (typeof LUGARES)[number]["slug"];

export const esLugar = (v: unknown): v is Lugar => LUGARES.some((l) => l.slug === v);

export interface MarcaLugar {
  link: TipoEnlace;
  placement: Lugar;
  checked_by: string | null;
  checked_at: string;
}

const FECHA_MARCA = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

/** "Marcado por Ana el 24 oct"; sin autor, solo la fecha. Zona fija: igual en servidor y navegador. */
export function textoMarca(m: Pick<MarcaLugar, "checked_by" | "checked_at">): string {
  const fecha = new Date(m.checked_at);
  const el = Number.isNaN(fecha.getTime()) ? "" : ` el ${FECHA_MARCA.format(fecha).replace(".", "")}`;
  return `Marcado${m.checked_by ? ` por ${m.checked_by}` : ""}${el}`;
}
