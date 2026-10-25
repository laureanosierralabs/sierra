import { armarEmail, extracto, lineaUnica } from "@/lib/email/pedido-comun";

/** Aviso al cliente: el equipo marcó su pedido como resuelto. */
export interface DatosPedidoResuelto {
  titulo: string;
  /** Último comentario del equipo, si hay. */
  comentario: string | null;
  autorComentario: string | null;
  url: string;
}

export function pedidoResueltoEmail(d: DatosPedidoResuelto) {
  const titulo = lineaUnica(d.titulo);
  const subject = `Tu pedido «${titulo}» está resuelto`;
  const { html, text } = armarEmail({
    etiqueta: "synx control · Pedidos",
    titulo: `Tu pedido «${titulo}» está resuelto`,
    parrafos: ["Ya terminamos con tu pedido. Si algo no quedó como esperabas, respóndenos desde synx control y lo reabrimos."],
    cita: d.comentario
      ? { rotulo: d.autorComentario ? `Último mensaje de ${lineaUnica(d.autorComentario)}` : "Último mensaje del equipo", texto: extracto(d.comentario) }
      : null,
    boton: { texto: "Ver mi pedido", url: d.url },
    pie: "Recibes este mail porque creaste este pedido o formas parte de synx control de tu marca.",
  });
  return { subject, html, text };
}
