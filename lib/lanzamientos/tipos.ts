/**
 * Lanzamientos: tipos y cálculos puros (sin I/O), compartidos por el panel,
 * el portal y el webhook.
 */

export const ESTADOS_LANZAMIENTO = ["preparacion", "activo", "cerrado"] as const;
export type EstadoLanzamiento = (typeof ESTADOS_LANZAMIENTO)[number];

export const LABEL_ESTADO_LANZAMIENTO: Record<EstadoLanzamiento, string> = {
  preparacion: "En preparación",
  activo: "Activo",
  cerrado: "Cerrado",
};

export interface Lanzamiento {
  id: string;
  client_id: string;
  name: string;
  status: EstadoLanzamiento;
  starts_on: string | null;
  ends_on: string | null;
  goal_registrations: number | null;
  created_at: string;
}

export interface PaginaLanzamiento {
  id: string;
  launch_id: string;
  name: string;
  url: string | null;
  thanks_url: string | null;
  whatsapp_url: string | null;
  checkout_url: string | null;
  project_id: string | null;
  mailerlite_group_id: string | null;
  position: number;
}

export interface Registro {
  id: string;
  page_id: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  registered_at: string;
}

const DIA_BA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

/** Día (AAAA-MM-DD) de un instante, en hora de Buenos Aires. */
export function diaDe(instante: string | Date): string {
  return DIA_BA.format(typeof instante === "string" ? new Date(instante) : instante);
}

const DIA_MS = 86_400_000;
const aUtc = (dia: string) => Date.parse(`${dia}T00:00:00Z`);

export interface ResumenRegistros {
  total: number;
  hoy: number;
  /** Registros por landing; la clave "" junta los que no tienen landing. */
  porPagina: Record<string, number>;
  /** Un punto por día con registros, del más viejo al más nuevo. */
  porDia: { dia: string; registros: number }[];
}

export function resumirRegistros(
  registros: Pick<Registro, "page_id" | "registered_at">[],
  hoy: string = diaDe(new Date()),
): ResumenRegistros {
  const porPagina: Record<string, number> = {};
  const dias = new Map<string, number>();
  let deHoy = 0;

  for (const r of registros) {
    const clave = r.page_id ?? "";
    porPagina[clave] = (porPagina[clave] ?? 0) + 1;
    const dia = diaDe(r.registered_at);
    dias.set(dia, (dias.get(dia) ?? 0) + 1);
    if (dia === hoy) deHoy++;
  }

  return {
    total: registros.length,
    hoy: deHoy,
    porPagina,
    porDia: [...dias.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dia, n]) => ({ dia, registros: n })),
  };
}

export interface Ritmo {
  /** Registros que se alcanzarían al cierre si se mantiene el promedio diario. */
  proyeccion: number;
  /** Cuánto falta (o sobra, negativo) para la meta a ese ritmo. */
  faltan: number;
  diasTranscurridos: number;
  diasTotales: number;
}

/**
 * Proyección al cierre con el promedio diario hasta hoy. Null si falta la
 * meta o alguna fecha, o si el lanzamiento todavía no empezó: sin esos datos
 * cualquier número sería inventado.
 */
export function ritmoHaciaMeta(
  l: Pick<Lanzamiento, "starts_on" | "ends_on" | "goal_registrations">,
  total: number,
  hoy: string = diaDe(new Date()),
): Ritmo | null {
  if (!l.goal_registrations || !l.starts_on || !l.ends_on) return null;
  if (l.ends_on < l.starts_on || hoy < l.starts_on) return null;

  const diasTotales = Math.round((aUtc(l.ends_on) - aUtc(l.starts_on)) / DIA_MS) + 1;
  const hasta = hoy > l.ends_on ? l.ends_on : hoy;
  const diasTranscurridos = Math.round((aUtc(hasta) - aUtc(l.starts_on)) / DIA_MS) + 1;
  const proyeccion = Math.round((total / diasTranscurridos) * diasTotales);

  return {
    proyeccion,
    faltan: l.goal_registrations - proyeccion,
    diasTranscurridos,
    diasTotales,
  };
}

/**
 * Lo que el webhook de MailerLite necesita de cada evento. Sin fecha a
 * propósito: `subscribed_at` es cuándo la persona se suscribió por primera
 * vez a la cuenta, no cuándo entró a este lanzamiento. El registro se fecha
 * con el momento en que llega el aviso.
 */
export interface RegistroEntrante {
  externalId: string;
  email: string;
  name: string | null;
  phone: string | null;
  groupId: string;
  utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null };
}

const texto = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  return s === "" ? null : s;
};

/**
 * Extrae los registros de un envío de MailerLite. Acepta un evento suelto o
 * un lote (`{ events: [...] }`) y solo toma `subscriber.added_to_group`: es
 * el único que dice a qué grupo (landing) entró la persona. Lo que no se
 * reconoce se ignora, nunca rompe.
 */
export function registrosDeMailerlite(payload: unknown): RegistroEntrante[] {
  const raiz = (payload ?? {}) as { events?: unknown };
  const eventos = Array.isArray(raiz.events) ? raiz.events : [payload];
  const salida: RegistroEntrante[] = [];

  for (const crudo of eventos) {
    const e = (crudo ?? {}) as {
      type?: unknown;
      subscriber?: Record<string, unknown>;
      group?: Record<string, unknown>;
    };
    if (e.type !== "subscriber.added_to_group") continue;

    const s = e.subscriber ?? {};
    const externalId = texto(s.id);
    const email = texto(s.email)?.toLowerCase() ?? null;
    const groupId = texto(e.group?.id);
    if (!externalId || !email || !groupId) continue;

    const campos = (s.fields ?? {}) as Record<string, unknown>;
    const nombre = [texto(campos.name), texto(campos.last_name)].filter(Boolean).join(" ");

    salida.push({
      externalId,
      email,
      name: nombre || null,
      phone: texto(campos.phone),
      groupId,
      utm: {
        source: texto(campos.utm_source),
        medium: texto(campos.utm_medium),
        campaign: texto(campos.utm_campaign),
        content: texto(campos.utm_content),
      },
    });
  }
  return salida;
}
