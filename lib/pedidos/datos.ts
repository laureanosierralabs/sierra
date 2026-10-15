import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type { ComentarioPedido, Pedido } from "@/lib/pedidos/tipos";

/**
 * Lecturas de pedidos. Las que sirven al portal reciben el `clientId` y
 * filtran por él; la bandeja (todos los clientes) es solo del panel.
 * No se selecciona el id de Clerk de quien escribió: no le sirve a nadie.
 */
const COLUMNAS =
  "id, client_id, launch_id, kind, title, description, priority, status, link, created_by_name, from_client, created_at, updated_at, closed_at";
const COLUMNAS_COMENTARIO = "id, request_id, body, author_name, from_client, created_at";

export async function pedidosDeCliente(clientId: string): Promise<Pedido[]> {
  const { data, error } = await supabaseAdmin()
    .from("client_requests")
    .select(COLUMNAS)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("No se pudieron leer los pedidos");
  return (data ?? []) as Pedido[];
}

export interface DetallePedido {
  pedido: Pedido;
  comentarios: ComentarioPedido[];
}

/** Null si no existe o es de otro cliente (mismo 404 en los dos casos). */
export async function pedidoDeCliente(clientId: string, id: string): Promise<DetallePedido | null> {
  const db = supabaseAdmin();
  const { data: pedido, error } = await db
    .from("client_requests")
    .select(COLUMNAS)
    .eq("client_id", clientId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo leer el pedido");
  if (!pedido) return null;

  const { data: comentarios, error: errComentarios } = await db
    .from("client_request_comments")
    .select(COLUMNAS_COMENTARIO)
    .eq("client_id", clientId)
    .eq("request_id", id)
    .order("created_at")
    .limit(500);
  if (errComentarios) throw new Error("No se pudieron leer los comentarios");

  return { pedido: pedido as Pedido, comentarios: (comentarios ?? []) as ComentarioPedido[] };
}

/** Cliente dueño de un pedido: el panel entra por id y de acá saca el filtro. */
export async function clienteDePedido(id: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin().from("client_requests").select("client_id").eq("id", id).maybeSingle();
  if (error) throw new Error("No se pudo leer el pedido");
  return (data?.client_id as string | undefined) ?? null;
}

export interface PedidoBandeja extends Pedido {
  cliente: string;
}

/**
 * Bandeja del panel: pedidos de todos los clientes. Solo para el equipo. Los
 * abiertos se leen siempre todos (un pedido viejo sin resolver no puede
 * desaparecer); de los cerrados, los más recientes.
 */
export async function bandejaPedidos(): Promise<PedidoBandeja[]> {
  const db = supabaseAdmin();
  const columnas = `${COLUMNAS}, clients(name)`;
  const [abiertos, cerrados] = await Promise.all([
    db.from("client_requests").select(columnas).in("status", ["abierta", "en_curso"]).order("created_at", { ascending: false }),
    db
      .from("client_requests")
      .select(columnas)
      .not("status", "in", "(abierta,en_curso)")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (abiertos.error || cerrados.error) throw new Error("No se pudieron leer los pedidos");
  return [...(abiertos.data ?? []), ...(cerrados.data ?? [])].map((fila) => {
    const { clients, ...p } = fila as unknown as Pedido & { clients: { name: string } | { name: string }[] | null };
    const nombre = Array.isArray(clients) ? clients[0]?.name : clients?.name;
    return { ...p, cliente: nombre ?? "—" };
  });
}
