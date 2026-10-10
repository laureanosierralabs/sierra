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

/** Eje comercial: en qué punto de la negociación está. */
export const ESTADOS_COTIZACION = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "cancelled",
] as const;

/** Eje de cobro, independiente del comercial: una aprobada puede estar impaga. */
export const ESTADOS_PAGO = [
  "not_applicable",
  "pending",
  "partial",
  "paid",
] as const;

export const MONEDAS = ["USD", "ARS", "EUR"] as const;

/** Qué es la página. Va como etiqueta, no en el nombre del proyecto. */
export const TIPOS_PAGINA = [
  "registro",
  "ventas",
  "lead-magnet",
  "portfolio",
  "institucional",
  "otro",
] as const;

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
export type EstadoPago = (typeof ESTADOS_PAGO)[number];
export type Moneda = (typeof MONEDAS)[number];
export type Etapa = (typeof ETAPAS)[number];
export type TipoPagina = (typeof TIPOS_PAGINA)[number];
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

export const LABEL_TIPO_PAGINA: Record<TipoPagina, string> = {
  registro: "Página de registro",
  ventas: "Página de ventas",
  "lead-magnet": "Lead magnet",
  portfolio: "Portfolio",
  institucional: "Institucional",
  otro: "Otro",
};

/** Versión corta para la card, donde el espacio es poco. */
export const LABEL_TIPO_PAGINA_CORTO: Record<TipoPagina, string> = {
  registro: "Registro",
  ventas: "Ventas",
  "lead-magnet": "Lead magnet",
  portfolio: "Portfolio",
  institucional: "Institucional",
  otro: "Otro",
};

/**
 * Color fijo por tipo de página: el mismo tipo se ve siempre igual, así se
 * reconoce sin leer la etiqueta. Es color categórico, no de estado — no
 * comunica urgencia. El criterio: ventas ámbar (conversión), registro azul
 * (captura fría), lead magnet lima (entrada al funnel), portfolio violeta
 * (creativo), institucional teal (corporativo), otro neutro (no informa).
 */
export const TONO_TIPO_PAGINA: Record<TipoPagina, string> = {
  registro: "border-cat-azul/25 bg-cat-azul-dim text-cat-azul",
  ventas: "border-cat-ambar/25 bg-cat-ambar-dim text-cat-ambar",
  "lead-magnet": "border-cat-lima/25 bg-cat-lima-dim text-cat-lima",
  portfolio: "border-cat-violeta/25 bg-cat-violeta-dim text-cat-violeta",
  institucional: "border-cat-teal/25 bg-cat-teal-dim text-cat-teal",
  otro: "border-line bg-surface-2 text-text-3",
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
  draft: "Borrador",
  sent: "Enviada",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

export const LABEL_ESTADO_PAGO: Record<EstadoPago, string> = {
  not_applicable: "—",
  pending: "Pendiente",
  partial: "Pago parcial",
  paid: "Pagada",
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
  /** Puede haber más de un responsable (ej: un dev + un diseñador). */
  assignee_ids: string[];
  /** Cuándo arranca. Con due_date define la barra del calendario. */
  start_date: string | null;
  due_date: string | null;
  priority: PrioridadLanding;
  notes: string | null;
  notes_important: string | null;
  cover_url: string | null;
  /** Sitio publicado. Es el link que más se abre desde la lista. */
  site_url: string | null;
  /** Qué es la página: registro, ventas, etc. Etiqueta, no nombre. */
  page_type: TipoPagina | null;
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

/**
 * Adjunto de una tarea: o es un link, o es un archivo subido, nunca ambos.
 * El brief, el Fathom de la reunión, el Figma del diseño.
 */
export interface Adjunto {
  id: string;
  task_id: string;
  name: string;
  url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export function esArchivo(a: Adjunto): boolean {
  return a.storage_path !== null;
}

/** Peso legible. Un "2458621" en la UI no le dice nada a nadie. */
export function tamanoLegible(bytes: number | null): string | null {
  if (bytes === null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  /** Número legible para la interfaz: COT-0001. El uuid es la clave real. */
  numero: number;
  client_id: string | null;
  title: string;
  service: string | null;
  total_amount: number | null;
  currency: Moneda;
  commercial_status: EstadoCotizacion;
  payment_status: EstadoPago;
  amount_paid: number;
  payment_terms: string | null;
  /** La propuesta vive en Drive; acá solo se guarda el acceso directo. */
  proposal_url: string | null;
  document_path: string | null;
  movement_id: string | null;
  sent_at: string | null;
  notes: string | null;
  /** Proyectos que cubre. Una cotización puede abarcar varios. */
  project_ids: string[];
  /** Cuánto del total corresponde a cada proyecto. Ausente = sin asignar. */
  allocated: Record<string, number>;
  created_at: string;
  updated_at: string;
}

/**
 * Lo que se le paga a quien ejecuta. Espejo de Cotizacion: puede cubrir
 * varios proyectos y pagarse en partes. Sin proyectos vinculados es trabajo
 * por horas (mantenimiento, cambios sueltos).
 */
export interface AcuerdoEquipo {
  id: string;
  numero: number;
  member_name: string;
  title: string;
  total_amount: number | null;
  currency: Moneda;
  amount_paid: number;
  payment_status: Exclude<EstadoPago, "not_applicable">;
  payment_terms: string | null;
  /** Cuándo se acordó. created_at es cuándo se cargó, que no es lo mismo. */
  agreed_on: string | null;
  notes: string | null;
  project_ids: string[];
  created_at: string;
  updated_at: string;
}

export const PERIODOS_GASTO = ["monthly", "yearly", "once"] as const;
export type PeriodoGasto = (typeof PERIODOS_GASTO)[number];

export const LABEL_PERIODO: Record<PeriodoGasto, string> = {
  monthly: "Mensual",
  yearly: "Anual",
  once: "Único",
};

export const CATEGORIAS_GASTO = [
  "herramienta",
  "suscripcion",
  "infraestructura",
  "servicio",
  "impuesto",
  "otro",
] as const;
export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export const LABEL_CATEGORIA_GASTO: Record<CategoriaGasto, string> = {
  herramienta: "Herramienta",
  suscripcion: "Suscripción",
  infraestructura: "Infraestructura",
  servicio: "Servicio",
  impuesto: "Impuesto",
  otro: "Otro",
};

/** Gasto que se repite. No se carga uno por mes: se declara y se proyecta. */
export interface GastoFijo {
  id: string;
  name: string;
  amount: number;
  currency: Moneda;
  period: PeriodoGasto;
  category: CategoriaGasto;
  active_from: string;
  active_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Cuánto pesa por mes. Un anual se prorratea; uno único no, porque no se
 * repite: pesa entero en su mes y no forma parte del gasto fijo.
 */
export function costoMensual(g: GastoFijo): number {
  if (g.period === "once") return 0;
  return g.period === "yearly" ? g.amount / 12 : g.amount;
}

/** Lo que impacta en un mes puntual, incluido el gasto único de ese mes. */
export function costoEnMes(g: GastoFijo, mes: string): number {
  if (!gastoVigente(g, mes)) return 0;
  if (g.period === "once") {
    return g.active_from.slice(0, 7) === mes ? g.amount : 0;
  }
  return costoMensual(g);
}

export function gastoVigente(g: GastoFijo, mes: string): boolean {
  const desde = g.active_from.slice(0, 7);
  // Un gasto único solo existe en su propio mes.
  if (g.period === "once") return desde === mes;
  const hasta = g.active_until?.slice(0, 7);
  return desde <= mes && (!hasta || hasta >= mes);
}

export interface PagoEquipo {
  id: string;
  agreement_id: string;
  amount: number;
  paid_on: string;
  method: string | null;
  notes: string | null;
  created_at: string;
}

export function codigoAcuerdo(numero: number): string {
  return `PAG-${String(numero).padStart(4, "0")}`;
}

export function pendienteDePago(a: AcuerdoEquipo): number {
  return Math.max((a.total_amount ?? 0) - a.amount_paid, 0);
}

/** Un cobro concreto. amount_paid de la cotización es la suma de estos. */
export interface PagoCotizacion {
  id: string;
  quote_id: string;
  amount: number;
  paid_on: string;
  method: string | null;
  notes: string | null;
  created_at: string;
}

export function codigoCotizacion(numero: number): string {
  return `COT-${String(numero).padStart(4, "0")}`;
}

const DIA_BUENOS_AIRES = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
});

/**
 * Fecha de la cotización (AAAA-MM-DD): la de envío si la tiene, si no el día
 * en que se creó. Así un borrador también se ordena. La zona es fija para que
 * servidor y navegador den el mismo día.
 */
export function fechaCotizacion(q: Pick<Cotizacion, "sent_at" | "created_at">): string {
  return q.sent_at ?? DIA_BUENOS_AIRES.format(new Date(q.created_at));
}

/** AAAA-MM-DD → DD/MM/AAAA, sin pasar por Date (no corre por zona horaria). */
export function fechaCorta(fecha: string): string {
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
}

/**
 * El estado de pago se deduce de cuánto entró: registrar un cobro y además
 * elegir el estado a mano abre la puerta a que se contradigan.
 */
export function estadoPagoSegun(
  total: number | null,
  pagado: number,
): EstadoPago {
  if (pagado <= 0) return total && total > 0 ? "pending" : "not_applicable";
  if (total !== null && pagado >= total) return "paid";
  return "partial";
}

export function pendienteDeCobro(q: Cotizacion): number {
  return Math.max((q.total_amount ?? 0) - q.amount_paid, 0);
}

/**
 * Solo lo aprobado es una cuenta por cobrar real. Un borrador es una
 * previsión: contarlo como deuda del cliente infla el número y lleva a
 * decidir sobre plata que todavía nadie se comprometió a pagar.
 */
export function esCuentaPorCobrar(q: Cotizacion): boolean {
  return q.commercial_status === "approved" && pendienteDeCobro(q) > 0;
}

export function esPrevision(q: Cotizacion): boolean {
  return q.commercial_status === "draft" || q.commercial_status === "sent";
}

export interface Tarea {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: EstadoTarea;
  /** Puede haber más de una persona asignada a la misma tarea. */
  assignee_ids: string[];
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

/** Enviada y sin respuesta: es la que hay que ir a golpear. */
export function requiereSeguimiento(estado: EstadoCotizacion): boolean {
  return estado === "sent";
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
