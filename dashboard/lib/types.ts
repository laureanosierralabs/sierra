export type Estado =
  | "activo"
  | "por-empezar"
  | "bloqueado"
  | "pausado"
  | "terminado";
export type Prioridad = "alta" | "media" | "baja";

export interface Proyecto {
  slug: string;
  /** Ruta relativa a contexto/, para poder editar el archivo. */
  archivo: string;
  nombre: string;
  unidad: string;
  cliente: string;
  estado: Estado;
  prioridad: Prioridad;
  responsables: string[];
  entrega?: string;
  actualizado?: string;
  proximoPaso?: string;
  bloqueos: string[];
  estadoActual?: string;
  recursos: Recurso[];
  decisiones: string[];
  bitacora: string[];
  notas?: string;
}

export interface Cliente {
  slug: string;
  archivo: string;
  nombre: string;
  unidad: string;
  estado: string;
  canal?: string;
  contexto?: string;
  esperandoRespuesta: string[];
  recursos: Recurso[];
}

export interface Unidad {
  slug: string;
  nombre: string;
  estado: string;
  queEs?: string;
  comoSeOpera?: string;
  recursos: Recurso[];
  proyectos: Proyecto[];
  clientes: Cliente[];
}

export interface Recurso {
  que: string;
  donde: string;
}

/** Días hasta la fecha de entrega. Negativo = vencido. */
export function diasHasta(fecha?: string): number | null {
  if (!fecha) return null;
  const objetivo = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(objetivo.getTime())) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);
}
