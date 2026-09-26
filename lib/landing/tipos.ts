export const ESTADOS_PROYECTO = [
  "por-iniciar",
  "en-progreso",
  "en-revision",
  "esperando-cliente",
  "stand-by",
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

export const ORIGENES = [
  "recomendacion",
  "publicidad",
  "redes",
  "busqueda",
  "evento",
  "otro",
] as const;

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
export type Origen = (typeof ORIGENES)[number];
export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number];
export type Moneda = (typeof MONEDAS)[number];
export type Etapa = (typeof ETAPAS)[number];
export type TipoRecurso = (typeof TIPOS_RECURSO)[number];

export const LABEL_ESTADO_PROYECTO: Record<EstadoProyecto, string> = {
  "por-iniciar": "Por comenzar",
  "en-progreso": "En proceso",
  "en-revision": "En revisión",
  "esperando-cliente": "Esperando cliente",
  "stand-by": "Stand by",
  entregado: "Entregado",
};

/**
 * Grupos para filtrar y agrupar la lista de proyectos. Un grupo puede juntar
 * varios estados: "En proceso" incluye revisión, que es trabajo en curso.
 */
export const GRUPOS_PROYECTO = [
  {
    id: "por-iniciar" as const,
    label: "Por comenzar",
    estados: ["por-iniciar"] as EstadoProyecto[],
  },
  {
    id: "en-progreso" as const,
    label: "En proceso",
    estados: ["en-progreso", "en-revision"] as EstadoProyecto[],
  },
  {
    id: "esperando-cliente" as const,
    label: "Esperando cliente",
    estados: ["esperando-cliente"] as EstadoProyecto[],
  },
  {
    id: "stand-by" as const,
    label: "Stand by",
    estados: ["stand-by"] as EstadoProyecto[],
  },
  {
    id: "entregado" as const,
    label: "Entregado",
    estados: ["entregado"] as EstadoProyecto[],
  },
];

export type GrupoProyecto = (typeof GRUPOS_PROYECTO)[number]["id"];

export function grupoDe(estado: EstadoProyecto): GrupoProyecto {
  const g = GRUPOS_PROYECTO.find((x) => x.estados.includes(estado));
  return g?.id ?? "por-iniciar";
}

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

export const LABEL_ORIGEN: Record<Origen, string> = {
  recomendacion: "Recomendación",
  publicidad: "Publicidad",
  redes: "Redes sociales",
  busqueda: "Búsqueda",
  evento: "Evento",
  otro: "Otro",
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
  /** Define el checklist inicial: wordpress | codigo. */
  kind: string;
  responsible_user_id: string | null;
  due_date: string | null;
  priority: PrioridadLanding;
  notes: string | null;
  notes_important: string | null;
  cover_url: string | null;
  /** Sitio publicado. Es el link que más se abre desde la lista. */
  site_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Paso de un checklist. Puede anidar un nivel. */
export interface Paso {
  texto: string;
  hijos?: string[];
}

export interface Proceso {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TareaProceso {
  id: string;
  process_id: string;
  title: string;
  template: string | null;
  steps: Paso[];
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface NotaCliente {
  id: string;
  client_id: string;
  title: string;
  url: string | null;
  body: string | null;
  meeting_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recurso {
  id: string;
  project_id: string;
  name: string;
  kind: TipoRecurso;
  url: string | null;
  username: string | null;
  /** Cifrado en la base. Nunca se expone crudo al cliente. */
  secret_encrypted: string | null;
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
  source: Origen | null;
  /** Detalle libre del origen: "Instagram", "Meta Ads", "me refirió Pilar". */
  source_detail: string | null;
  niche: string | null;
  website: string | null;
  drive_url: string | null;
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
  /** PDF subido al bucket privado. Se accede con URL firmada. */
  document_path: string | null;
  /** Id del movimiento en finanzas, si ya se registró el cobro. */
  movement_id: string | null;
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
  /** Plantilla de formulario que renderiza su página. Null = sin formulario. */
  template: string | null;
  content: Record<string, string | string[] | null>;
  /** Pasos copiados del SOP al crear el proyecto. */
  steps: Paso[];
  created_at: string;
  updated_at: string;
}

/** Miembro del workspace, resuelto desde Clerk. */
export interface Miembro {
  id: string;
  nombre: string;
}

// stand-by y entregado quedan afuera: no necesitan atención en Inicio.
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

/**
 * El kanban agrupa los 5 estados en 3 columnas operativas. El estado real de
 * la tarea no se pierde: "en-revision" y "bloqueada" viven dentro de curso y
 * se marcan en la tarjeta.
 */
export const COLUMNAS_KANBAN = [
  {
    id: "pendiente" as const,
    label: "Por comenzar",
    estados: ["pendiente"] as EstadoTarea[],
    // Fondo apenas teñido: ubica la columna sin competir con las tarjetas.
    fondo: "bg-idle-dim/30",
    punto: "bg-idle",
  },
  {
    id: "en-progreso" as const,
    label: "En proceso",
    estados: ["en-progreso", "en-revision", "bloqueada"] as EstadoTarea[],
    fondo: "bg-warn-dim/30",
    punto: "bg-warn",
  },
  {
    id: "completada" as const,
    label: "Entregado",
    estados: ["completada"] as EstadoTarea[],
    fondo: "bg-ok-dim/30",
    punto: "bg-ok",
  },
];

export type ColumnaKanban = (typeof COLUMNAS_KANBAN)[number]["id"];

export function columnaDe(estado: EstadoTarea): ColumnaKanban {
  const col = COLUMNAS_KANBAN.find((c) => c.estados.includes(estado));
  return col?.id ?? "pendiente";
}

/**
 * Handle de Instagram a URL. Acepta "@usuario", "usuario" o la URL completa,
 * porque cada cliente lo manda distinto.
 */
export function urlInstagram(valor: string | null): string | null {
  if (!valor) return null;
  const v = valor.trim();
  if (!v) return null;

  if (/^https?:\/\//i.test(v)) return v;

  const handle = v.replace(/^@/, "").replace(/\/+$/, "");
  if (!/^[A-Za-z0-9._]+$/.test(handle)) return null;
  return `https://instagram.com/${handle}`;
}

/** Teléfono a chat de WhatsApp. Sin código de país no se puede armar el link. */
export function urlWhatsapp(valor: string | null): string | null {
  if (!valor) return null;

  const digitos = valor.replace(/\D/g, "");
  // Un número local sin prefijo internacional abriría un chat equivocado.
  if (digitos.length < 10) return null;
  return `https://wa.me/${digitos}`;
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
