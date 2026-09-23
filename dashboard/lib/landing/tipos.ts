export const ESTADOS_PROYECTO = [
  "por-iniciar",
  "en-progreso",
  "en-revision",
  "esperando-cliente",
  "entregado",
] as const;

export const ESTADOS_TAREA = [
  "pendiente",
  "en-progreso",
  "en-revision",
  "bloqueada",
  "completada",
] as const;

export const PRIORIDADES = ["alta", "media", "baja"] as const;

export const ESTADOS_CLIENTE = ["prospecto", "cliente", "inactivo"] as const;

export const ESTADOS_COTIZACION = [
  "borrador",
  "enviada",
  "seguimiento",
  "aprobada",
  "rechazada",
] as const;

export const MONEDAS = ["USD", "ARS", "EUR"] as const;

/** Etapa del trabajo: independiente del estado y del avance de tareas. */
export const ETAPAS = [
  "briefing",
  "recoleccion",
  "diseno",
  "desarrollo",
  "revision",
  "cambios",
  "entrega",
] as const;

export const TIPOS_RECURSO = [
  "archivo",
  "diseno",
  "infraestructura",
  "marketing",
  "acceso",
  "otro",
] as const;

export type EstadoProyecto = (typeof ESTADOS_PROYECTO)[number];
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];
export type PrioridadLanding = (typeof PRIORIDADES)[number];
export type EstadoCliente = (typeof ESTADOS_CLIENTE)[number];
export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number];
export type Moneda = (typeof MONEDAS)[number];
export type Etapa = (typeof ETAPAS)[number];
export type TipoRecurso = (typeof TIPOS_RECURSO)[number];

export const LABEL_ESTADO_PROYECTO: Record<EstadoProyecto, string> = {
  "por-iniciar": "Por iniciar",
  "en-progreso": "En progreso",
  "en-revision": "En revisión",
  "esperando-cliente": "Esperando cliente",
  entregado: "Entregado",
};

export const LABEL_ESTADO_TAREA: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  "en-progreso": "En progreso",
  "en-revision": "En revisión",
  bloqueada: "Bloqueada",
  completada: "Completada",
};

export const LABEL_PRIORIDAD: Record<PrioridadLanding, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const LABEL_ETAPA: Record<Etapa, string> = {
  briefing: "Briefing",
  recoleccion: "Recolectando info",
  diseno: "Diseño",
  desarrollo: "Desarrollo",
  revision: "Revisión",
  cambios: "Cambios",
  entrega: "Entrega",
};

export const LABEL_TIPO_RECURSO: Record<TipoRecurso, string> = {
  archivo: "Archivos",
  diseno: "Diseño",
  infraestructura: "Infraestructura",
  marketing: "Marketing",
  acceso: "Accesos",
  otro: "Otros",
};

export const LABEL_ESTADO_CLIENTE: Record<EstadoCliente, string> = {
  prospecto: "Prospecto",
  cliente: "Cliente",
  inactivo: "Inactivo",
};

export const LABEL_ESTADO_COTIZACION: Record<EstadoCotizacion, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  seguimiento: "Seguimiento",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export interface Proyecto {
  id: string;
  name: string;
  /** Fallback histórico: se usa solo cuando client_id está vacío. */
  client_name: string | null;
  client_id: string | null;
  quote_id: string | null;
  status: EstadoProyecto;
  stage: Etapa | null;
  responsible_user_id: string | null;
  due_date: string | null;
  priority: PrioridadLanding;
  notes: string | null;
  notes_important: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recurso {
  id: string;
  project_id: string;
  name: string;
  kind: TipoRecurso;
  url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  status: EstadoCliente;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cotizacion {
  id: string;
  client_id: string | null;
  title: string;
  service: string | null;
  amount: number | null;
  currency: Moneda;
  status: EstadoCotizacion;
  proposal_url: string | null;
  sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tarea {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: EstadoTarea;
  assigned_to: string | null;
  priority: PrioridadLanding;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

/** Miembro del workspace, resuelto desde Clerk. */
export interface Miembro {
  id: string;
  nombre: string;
}

const PROYECTO_ABIERTO: EstadoProyecto[] = [
  "por-iniciar",
  "en-progreso",
  "en-revision",
  "esperando-cliente",
];

export function esProyectoActivo(estado: EstadoProyecto): boolean {
  return PROYECTO_ABIERTO.includes(estado);
}

export function esTareaAbierta(estado: EstadoTarea): boolean {
  return estado !== "completada";
}

/** El vínculo real manda; client_name queda como fallback de datos viejos. */
export function nombreCliente(
  proyecto: Pick<Proyecto, "client_id" | "client_name">,
  clientes: Map<string, string>,
): string | null {
  if (proyecto.client_id) return clientes.get(proyecto.client_id) ?? null;
  return proyecto.client_name;
}

export function requiereSeguimiento(estado: EstadoCotizacion): boolean {
  return estado === "enviada" || estado === "seguimiento";
}

export function formatearMonto(
  monto: number | null,
  moneda: Moneda,
): string {
  if (monto === null) return "—";
  return `${moneda} ${monto.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
