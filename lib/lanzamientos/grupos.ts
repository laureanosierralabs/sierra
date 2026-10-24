/**
 * Grupos de WhatsApp rotativos: elegir el grupo vigente, validar links y armar
 * el aviso de "quedan pocos grupos". Lógica pura (sin I/O): se prueba en node.
 */

export interface GrupoWhatsapp {
  id: string;
  url: string;
  position: number;
  cap: number;
  joins: number;
  full_at: string | null;
}

export type EstadoGrupo = "vigente" | "lleno" | "en-espera";

/** Por debajo de las 1024 de WhatsApp: margen para quien entra sin pasar por el link. */
export const TOPE_GRUPO = 900;

/** Cuántos grupos libres disparan el aviso de "cargá más". */
export const AVISO_GRUPOS_LIBRES = 1;

/** Links por pegada, para que una lista no tape el formulario. */
export const MAX_GRUPOS_POR_CARGA = 20;

const LINK_GRUPO = /^https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]{10,40})\/?(?:[?#].*)?$/;

/** Link de invitación normalizado (sin barra final ni parámetros), o null si no es de un grupo. */
export function linkDeGrupo(valor: string): string | null {
  const m = LINK_GRUPO.exec(valor.trim());
  return m ? `https://chat.whatsapp.com/${m[1]}` : null;
}

/** Links de grupo de un texto (uno por línea o separados por espacios), sin repetir. */
export function linksDeTexto(texto: string): { links: string[]; invalidos: string[] } {
  const links: string[] = [];
  const invalidos: string[] = [];
  for (const parte of texto.split(/\s+/).filter(Boolean)) {
    const link = linkDeGrupo(parte);
    if (!link) invalidos.push(parte);
    else if (!links.includes(link)) links.push(link);
  }
  return { links, invalidos };
}

const ordenados = (grupos: GrupoWhatsapp[]) => [...grupos].sort((a, b) => a.position - b.position);

const libre = (g: GrupoWhatsapp) => !g.full_at && g.joins < g.cap;

/** El primero (por orden) que no está lleno; null si no hay ninguno libre. */
export function grupoVigente(grupos: GrupoWhatsapp[]): GrupoWhatsapp | null {
  return ordenados(grupos).find(libre) ?? null;
}

/**
 * Adónde mandar a alguien que no tiene grupo asignado: al vigente o, si todos
 * están llenos, al último (mejor un grupo lleno que un link roto).
 */
export function grupoDestino(grupos: GrupoWhatsapp[]): GrupoWhatsapp | null {
  const lista = ordenados(grupos);
  return lista.find(libre) ?? lista.at(-1) ?? null;
}

export function estadoGrupo(g: GrupoWhatsapp, vigente: GrupoWhatsapp | null): EstadoGrupo {
  if (!libre(g)) return "lleno";
  return vigente?.id === g.id ? "vigente" : "en-espera";
}

export const gruposLibres = (grupos: GrupoWhatsapp[]) => grupos.filter(libre).length;

/** Llegó a su tope de personas: aunque se reabra, sigue lleno. */
export const enElTope = (g: Pick<GrupoWhatsapp, "joins" | "cap">) => g.joins >= g.cap;

/** Persona para contar: el email si vino; si no, un clic suelto (cuenta siempre). */
export function personaDe(email: string | null, aleatorio: string): string {
  return email ? `e:${email}` : `a:${aleatorio}`;
}

/** Link fijo del lanzamiento, con el dominio de la landing o el del panel. */
export function linkFijo(token: string, dominio: string | null, origenPanel: string): string {
  const host = dominio?.replace(/^https?:\/\//i, "").replace(/\/+$/, "") || null;
  return host ? `https://${host}/grupo/${token}` : `${origenPanel.replace(/\/+$/, "")}/g/${token}`;
}
