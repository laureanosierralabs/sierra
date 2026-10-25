import { armarEmail, extracto, lineaUnica } from "@/lib/email/pedido-comun";

/** Aviso al equipo: un cliente creó un pedido desde su portal. */
export interface DatosPedidoNuevo {
  cliente: string;
  titulo: string;
  /** Etiqueta legible del tipo (Incidencia, Cambio). */
  tipo: string;
  urgente: boolean;
  descripcion: string | null;
  url: string;
}

export function pedidoNuevoEmail(d: DatosPedidoNuevo) {
  const cliente = lineaUnica(d.cliente);
  const subject = `${d.urgente ? "[Urgente] " : ""}Nuevo pedido de ${cliente}: ${lineaUnica(d.titulo)}`;
  const { html, text } = armarEmail({
    etiqueta: "synx build · Pedidos",
    titulo: `${cliente} creó un pedido`,
    parrafos: [`${d.tipo}${d.urgente ? " · urgente" : ""}: «${lineaUnica(d.titulo)}»`],
    cita: d.descripcion ? { rotulo: "Lo que escribió", texto: extracto(d.descripcion) } : null,
    boton: { texto: "Ver pedido", url: d.url },
    pie: "Recibís este mail porque estás asignado a un proyecto de este cliente (o sos owner).",
  });
  return { subject, html, text };
}
