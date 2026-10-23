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
    etiqueta: "Sierra Labs · Portal de clientes",
    titulo: `Tu pedido «${titulo}» está resuelto`,
    parrafos: ["Ya terminamos con tu pedido. Si algo no quedó como esperabas, respondé desde el portal y lo reabrimos."],
    cita: d.comentario
      ? { rotulo: d.autorComentario ? `Último mensaje de ${lineaUnica(d.autorComentario)}` : "Último mensaje del equipo", texto: extracto(d.comentario) }
      : null,
    boton: { texto: "Ver mi pedido", url: d.url },
    pie: "Recibís este mail porque creaste este pedido, o sos parte del portal de tu marca.",
  });
  return { subject, html, text };
}
