"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { avisarPedidoResuelto } from "@/lib/pedidos/avisos";
import { accesoActual, usuarioActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import {
  estaCerrado,
  transicionesEquipo,
  validarComentario,
  validarPedido,
  type EstadoPedido,
  type Pedido,
} from "@/lib/pedidos/tipos";

/**
 * Pedidos desde el panel: el equipo (owner y members) los gestiona. Un
 * usuario de cliente nunca llega acá (el proxy lo confina al portal, y igual
 * se vuelve a chequear).
 */
type Resultado = { error: string } | { aviso: string };

async function quienEscribe(): Promise<{ userId: string; nombre: string; esOwner: boolean } | { error: string }> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "No autorizado" };
  const { esCliente, esOwner } = await accesoActual();
  if (esCliente) return { error: "No autorizado" };
  // Lo ve el cliente en su portal: el nombre de pila, nunca el email de alguien del equipo.
  return { userId: usuario.id, nombre: usuario.firstName?.trim() || "Equipo", esOwner };
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

async function slugDe(clientId: string): Promise<string | null> {
  const { data } = await supabaseAdmin().from("client_orgs").select("slug").eq("client_id", clientId).maybeSingle();
  return (data?.slug as string | undefined) ?? null;
}

async function revalidar(clientId: string, id?: string) {
  revalidatePath("/landing-pages/pedidos", "layout");
  revalidatePath(`/landing-pages/clients/${clientId}`);
  const slug = await slugDe(clientId);
  if (slug) {
    revalidatePath(`/portal/${slug}`);
    revalidatePath(`/portal/${slug}/pedidos`);
    if (id) revalidatePath(`/portal/${slug}/pedidos/${id}`);
  }
}

/** Le pide al cliente que apruebe algo (un copy, un diseño, una landing antes de publicarla). */
export async function crearAprobacion(fd: FormData): Promise<Resultado> {
  const quien = await quienEscribe();
  if ("error" in quien) return quien;

  const pedido = validarPedido({ ...Object.fromEntries(fd), kind: "aprobacion" }, ["aprobacion"]);
  if ("error" in pedido) return pedido;

  const db = supabaseAdmin();
  const clientId = texto(fd, "client_id");
  const { data: cliente } = await db.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!cliente) return { error: "El cliente no existe" };

  // Los lanzamientos son del owner: un member no los ve, tampoco los vincula.
  const launchId = quien.esOwner ? texto(fd, "launch_id") || null : null;
  if (launchId) {
    const { data } = await db.from("launches").select("id").eq("id", launchId).eq("client_id", clientId).maybeSingle();
    if (!data) return { error: "Ese lanzamiento no es de este cliente" };
  }

  const { error } = await db.from("client_requests").insert({
    ...pedido,
    client_id: clientId,
    launch_id: launchId,
    created_by: quien.userId,
    created_by_name: quien.nombre,
    from_client: false,
  });
  if (error) return { error: "No se pudo crear la aprobación" };

  await revalidar(clientId);
  const slug = await slugDe(clientId);
  return {
    aviso: slug
      ? "Aprobación enviada: el cliente la ve en su portal"
      : "Aprobación creada. Este cliente todavía no tiene portal: habilitalo para que la vea",
  };
}

/** Mueve un pedido de estado, solo por las transiciones permitidas para el equipo. */
export async function cambiarEstadoPedido(id: string, estado: EstadoPedido): Promise<Resultado> {
  const quien = await quienEscribe();
  if ("error" in quien) return quien;

  const db = supabaseAdmin();
  const { data: actual } = await db.from("client_requests").select("client_id, kind, status").eq("id", id).maybeSingle();
  if (!actual) return { error: "Pedido no encontrado" };
  const p = actual as Pick<Pedido, "client_id" | "kind" | "status">;
  if (!transicionesEquipo(p.kind, p.status).includes(estado)) return { error: "Ese cambio de estado no está permitido" };

  const ahora = new Date().toISOString();
  // Solo si nadie lo cambió en el medio.
  const { data, error } = await db
    .from("client_requests")
    .update({ status: estado, updated_at: ahora, closed_at: estaCerrado(estado) ? ahora : null })
    .eq("id", id)
    .eq("status", p.status)
    .select("id");
  if (error) return { error: "No se pudo cambiar el estado" };
  if (!data?.length) return { error: "Alguien lo cambió recién: recargá la página" };

  // Solo la transición hacia "resuelta" avisa al cliente (el update de arriba
  // ya garantiza que antes estaba en otro estado). Después de responder y sin bloquear.
  if (estado === "resuelta") after(() => avisarPedidoResuelto(id));

  await revalidar(p.client_id, id);
  return { aviso: "Estado actualizado" };
}

export async function comentarPedido(fd: FormData): Promise<Resultado> {
  const quien = await quienEscribe();
  if ("error" in quien) return quien;

  const id = texto(fd, "request_id");
  const db = supabaseAdmin();
  const { data: pedido } = await db.from("client_requests").select("client_id").eq("id", id).maybeSingle();
  if (!pedido) return { error: "Pedido no encontrado" };
  const body = validarComentario(fd.get("body"));
  if (typeof body !== "string") return body;

  const clientId = pedido.client_id as string;
  const { error } = await db.from("client_request_comments").insert({
    request_id: id,
    client_id: clientId,
    body,
    author_id: quien.userId,
    author_name: quien.nombre,
    from_client: false,
  });
  if (error) return { error: "No se pudo enviar el comentario" };
  await db.from("client_requests").update({ updated_at: new Date().toISOString() }).eq("id", id);

  await revalidar(clientId, id);
  return { aviso: "Comentario enviado" };
}
