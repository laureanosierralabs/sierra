"use server";

import { revalidatePath } from "next/cache";
import { nombreDe, usuarioActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { contextoPortal, type ContextoPortal } from "@/lib/portal/contexto";
import {
  decisionesCliente,
  TIPOS_DEL_CLIENTE,
  validarComentario,
  validarPedido,
  type EstadoPedido,
  type Pedido,
} from "@/lib/pedidos/tipos";

/**
 * Pedidos desde el portal. El cliente sale SIEMPRE del contexto del portal
 * (su organización), nunca del formulario. La vista interna del owner es de
 * solo lectura: él responde desde el panel, para que nada quede firmado como
 * si lo hubiera escrito el cliente.
 */
type Resultado = { error: string } | { aviso: string };

async function quienEscribe(
  slug: string,
): Promise<{ ctx: ContextoPortal; userId: string; nombre: string } | { error: string }> {
  const ctx = await contextoPortal(slug);
  if (!ctx) return { error: "No encontrado" };
  if (ctx.vistaInterna) return { error: "Estás en la vista interna del portal: respondé desde el panel" };
  const usuario = await usuarioActual();
  if (!usuario) return { error: "No autorizado" };
  return { ctx, userId: usuario.id, nombre: nombreDe(usuario) };
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

const MAX_PEDIDOS_POR_HORA = 30;
const MAX_COMENTARIOS_POR_HORA = 60;

function revalidar(slug: string, id?: string) {
  revalidatePath(`/portal/${slug}`);
  revalidatePath(`/portal/${slug}/pedidos`);
  if (id) revalidatePath(`/portal/${slug}/pedidos/${id}`);
  revalidatePath("/landing-pages/pedidos", "layout");
}

/** Pedido del cliente del portal, o null (de otro cliente o inexistente). */
async function pedidoDelPortal(ctx: ContextoPortal, id: string): Promise<Pick<Pedido, "kind" | "status"> | null> {
  if (!id) return null;
  const { data } = await supabaseAdmin()
    .from("client_requests")
    .select("kind, status")
    .eq("id", id)
    .eq("client_id", ctx.clientId)
    .maybeSingle();
  return (data as Pick<Pedido, "kind" | "status"> | null) ?? null;
}

export async function crearPedidoPortal(fd: FormData): Promise<Resultado> {
  const quien = await quienEscribe(texto(fd, "slug"));
  if ("error" in quien) return quien;
  const { ctx, userId, nombre } = quien;

  const pedido = validarPedido(Object.fromEntries(fd), TIPOS_DEL_CLIENTE);
  if ("error" in pedido) return pedido;

  const db = supabaseAdmin();
  // Freno al spam (un script o una cuenta comprometida): pedidos por hora.
  const { count: recientes } = await db
    .from("client_requests")
    .select("id", { count: "exact", head: true })
    .eq("client_id", ctx.clientId)
    .eq("from_client", true)
    .gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  if ((recientes ?? 0) >= MAX_PEDIDOS_POR_HORA) {
    return { error: "Enviaste muchos pedidos en la última hora: esperá un rato o escribinos por WhatsApp" };
  }

  // El lanzamiento, si viene, tiene que ser de este cliente.
  const launchId = texto(fd, "launch_id") || null;
  if (launchId) {
    const { data } = await db.from("launches").select("id").eq("id", launchId).eq("client_id", ctx.clientId).maybeSingle();
    if (!data) return { error: "Ese lanzamiento no existe" };
  }

  const { error } = await db.from("client_requests").insert({
    ...pedido,
    client_id: ctx.clientId,
    launch_id: launchId,
    created_by: userId,
    created_by_name: nombre,
    from_client: true,
  });
  if (error) return { error: "No se pudo enviar el pedido" };

  revalidar(ctx.slug);
  return { aviso: "Pedido enviado: te avisamos por acá cuando lo tomemos" };
}

export async function comentarPedidoPortal(fd: FormData): Promise<Resultado> {
  const quien = await quienEscribe(texto(fd, "slug"));
  if ("error" in quien) return quien;
  const { ctx, userId, nombre } = quien;

  const id = texto(fd, "request_id");
  if (!(await pedidoDelPortal(ctx, id))) return { error: "Pedido no encontrado" };
  const body = validarComentario(fd.get("body"));
  if (typeof body !== "string") return body;

  const db = supabaseAdmin();
  const { count: recientes } = await db
    .from("client_request_comments")
    .select("id", { count: "exact", head: true })
    .eq("client_id", ctx.clientId)
    .eq("from_client", true)
    .gte("created_at", new Date(Date.now() - 3_600_000).toISOString());
  if ((recientes ?? 0) >= MAX_COMENTARIOS_POR_HORA) {
    return { error: "Enviaste muchos comentarios en la última hora: esperá un rato" };
  }

  const { error } = await db.from("client_request_comments").insert({
    request_id: id,
    client_id: ctx.clientId,
    body,
    author_id: userId,
    author_name: nombre,
    from_client: true,
  });
  if (error) return { error: "No se pudo enviar el comentario" };
  await db.from("client_requests").update({ updated_at: new Date().toISOString() }).eq("id", id).eq("client_id", ctx.clientId);

  revalidar(ctx.slug, id);
  return { aviso: "Comentario enviado" };
}

/** El cliente aprueba o rechaza una aprobación abierta, con un comentario opcional. */
export async function decidirAprobacion(fd: FormData): Promise<Resultado> {
  const quien = await quienEscribe(texto(fd, "slug"));
  if ("error" in quien) return quien;
  const { ctx, userId, nombre } = quien;

  const id = texto(fd, "request_id");
  const pedido = await pedidoDelPortal(ctx, id);
  if (!pedido) return { error: "Pedido no encontrado" };
  const decision = texto(fd, "decision") as EstadoPedido;
  if (!decisionesCliente(pedido.kind, pedido.status).includes(decision)) {
    return { error: "Este pedido ya no se puede decidir" };
  }

  const comentario = texto(fd, "body");
  if (decision === "rechazada" && !comentario) return { error: "Contanos qué cambiarías para que lo podamos ajustar" };
  if (comentario.length > 5000) return { error: "El comentario es muy largo" };

  const db = supabaseAdmin();
  // El comentario va primero: si se guardara después y fallara, el pedido
  // quedaría rechazado sin el motivo, y ya no se podría volver a decidir.
  if (comentario) {
    const { error: errorComentario } = await db.from("client_request_comments").insert({
      request_id: id,
      client_id: ctx.clientId,
      body: comentario,
      author_id: userId,
      author_name: nombre,
      from_client: true,
    });
    if (errorComentario) return { error: "No se pudo guardar tu comentario: probá de nuevo" };
  }

  const ahora = new Date().toISOString();
  // Solo si sigue abierta: dos clicks o dos personas no deciden dos veces.
  const { data, error } = await db
    .from("client_requests")
    .update({ status: decision, closed_at: ahora, updated_at: ahora })
    .eq("id", id)
    .eq("client_id", ctx.clientId)
    .eq("status", "abierta")
    .select("id");
  if (error) return { error: "No se pudo guardar la decisión" };
  if (!data?.length) return { error: "Este pedido ya se decidió" };

  revalidar(ctx.slug, id);
  return { aviso: decision === "aprobada" ? "Aprobado. ¡Gracias!" : "Rechazado: lo ajustamos y te lo volvemos a mandar" };
}
