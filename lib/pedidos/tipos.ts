/**
 * Pedidos entre el cliente y el equipo: tipos, estados y quién puede mover
 * cada pedido a dónde. Lógica pura: la usan las acciones del panel y del
 * portal (que vuelven a validar todo) y las pantallas (que muestran solo los
 * botones posibles).
 */

export const TIPOS_PEDIDO = ["incidencia", "cambio", "aprobacion"] as const;
export type TipoPedido = (typeof TIPOS_PEDIDO)[number];

/** Lo que puede crear el cliente desde su portal. */
export const TIPOS_DEL_CLIENTE = ["incidencia", "cambio"] as const satisfies readonly TipoPedido[];

export const LABEL_TIPO_PEDIDO: Record<TipoPedido, string> = {
  incidencia: "Incidencia",
  cambio: "Cambio",
  aprobacion: "Aprobación",
};

export const AYUDA_TIPO_PEDIDO: Record<TipoPedido, string> = {
  incidencia: "Algo no funciona: un formulario, un link, una página.",
  cambio: "Querés que modifiquemos algo: un texto, un precio, una imagen.",
  aprobacion: "Necesitamos que apruebes algo antes de publicarlo.",
};

export const ESTADOS_PEDIDO = ["abierta", "en_curso", "resuelta", "descartada", "aprobada", "rechazada"] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const LABEL_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  abierta: "Abierto",
  en_curso: "En curso",
  resuelta: "Resuelto",
  descartada: "Descartado",
  aprobada: "Aprobado",
  rechazada: "Rechazado",
};

export const PRIORIDADES = ["normal", "urgente"] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

export interface Pedido {
  id: string;
  client_id: string;
  launch_id: string | null;
  kind: TipoPedido;
  title: string;
  description: string | null;
  priority: Prioridad;
  status: EstadoPedido;
  link: string | null;
  created_by_name: string | null;
  from_client: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface ComentarioPedido {
  id: string;
  request_id: string;
  body: string;
  author_name: string | null;
  from_client: boolean;
  created_at: string;
}

const CERRADOS: readonly EstadoPedido[] = ["resuelta", "descartada", "aprobada", "rechazada"];

export const estaCerrado = (estado: EstadoPedido) => CERRADOS.includes(estado);

/**
 * Estados a los que el equipo puede llevar un pedido. Las aprobaciones las
 * decide el cliente: el equipo solo puede retirarlas mientras siguen abiertas.
 */
export function transicionesEquipo(tipo: TipoPedido, estado: EstadoPedido): EstadoPedido[] {
  if (tipo === "aprobacion") return estado === "abierta" ? ["descartada"] : [];
  switch (estado) {
    case "abierta":
      return ["en_curso", "resuelta", "descartada"];
    case "en_curso":
      return ["resuelta", "descartada", "abierta"];
    case "resuelta":
    case "descartada":
      return ["abierta"];
    default:
      return [];
  }
}

/** Lo que puede decidir el cliente: aprobar o rechazar una aprobación abierta. */
export function decisionesCliente(tipo: TipoPedido, estado: EstadoPedido): EstadoPedido[] {
  return tipo === "aprobacion" && estado === "abierta" ? ["aprobada", "rechazada"] : [];
}

/** Texto del botón que lleva a ese estado. */
export const ACCION_ESTADO: Record<EstadoPedido, string> = {
  abierta: "Reabrir",
  en_curso: "Tomar",
  resuelta: "Marcar resuelto",
  descartada: "Descartar",
  aprobada: "Aprobar",
  rechazada: "Rechazar",
};

export interface NuevoPedido {
  kind: TipoPedido;
  title: string;
  description: string | null;
  priority: Prioridad;
  link: string | null;
}

/** Valida lo que llega de un formulario. Devuelve el pedido limpio o el motivo. */
export function validarPedido(
  datos: Record<string, unknown>,
  permitidos: readonly TipoPedido[],
): NuevoPedido | { error: string } {
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const kind = texto(datos.kind) as TipoPedido;
  if (!permitidos.includes(kind)) return { error: "Elegí el tipo de pedido" };

  const title = texto(datos.title);
  if (!title) return { error: "Falta un título" };
  if (title.length > 200) return { error: "El título es muy largo (máximo 200 caracteres)" };

  const description = texto(datos.description) || null;
  if (description && description.length > 5000) return { error: "La descripción es muy larga" };

  const priority = texto(datos.priority) === "urgente" ? "urgente" : "normal";

  let link: string | null = texto(datos.link) || null;
  if (link) {
    try {
      const u = new URL(link);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
      link = u.toString();
    } catch {
      return { error: "El link tiene que empezar con http:// o https://" };
    }
  }
  return { kind, title, description, priority, link };
}

/** Valida un comentario. */
export function validarComentario(body: unknown): string | { error: string } {
  const t = typeof body === "string" ? body.trim() : "";
  if (!t) return { error: "Escribí un comentario" };
  if (t.length > 5000) return { error: "El comentario es muy largo" };
  return t;
}
