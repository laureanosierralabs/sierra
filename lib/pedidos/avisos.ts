import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { leerAcceso } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { enviarEmail, resendConfigurado } from "@/lib/email/resend";
import { emailsUnicos, urlBaseApp } from "@/lib/email/pedido-comun";
import { pedidoNuevoEmail } from "@/lib/email/pedido-nuevo";
import { pedidoResueltoEmail } from "@/lib/email/pedido-resuelto";
import { LABEL_TIPO_PEDIDO, type Pedido } from "@/lib/pedidos/tipos";
import { esUsuarioCliente } from "@/lib/unidades";

/**
 * Avisos por mail de los pedidos. Todo es "mejor esfuerzo": nada de acá lanza
 * ni bloquea la acción que lo dispara; si algo falla, se loguea y listo.
 */

let avisoSinResend = false;

/** true si hay con qué enviar. Si no, lo avisa en el log una sola vez. */
function puedeEnviar(): boolean {
  if (resendConfigurado()) return true;
  if (!avisoSinResend) {
    avisoSinResend = true;
    console.warn("[pedidos] Resend no está configurado: no se envían avisos de pedidos por mail");
  }
  return false;
}

const baseApp = () =>
  urlBaseApp({ APP_URL: process.env.APP_URL, VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL });

type UsuarioClerk = Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]>>;

const emailDe = (u: UsuarioClerk) => (u.primaryEmailAddress ?? u.emailAddresses[0])?.emailAddress ?? null;

/** Emails del equipo asignado a los proyectos activos del cliente. */
async function emailsAsignados(clientId: string): Promise<string[]> {
  const db = supabaseAdmin();
  const { data: proyectos } = await db.from("projects").select("id").eq("client_id", clientId).neq("status", "entregado");
  const ids = (proyectos ?? []).map((p) => p.id as string);
  if (!ids.length) return [];

  const { data: asignados } = await db.from("project_assignees").select("user_id").in("project_id", ids);
  const userIds = [...new Set((asignados ?? []).map((a) => a.user_id as string))];
  if (!userIds.length) return [];

  const clerk = await clerkClient();
  const { data } = await clerk.users.getUserList({ userId: userIds, limit: 100 });
  // Los usuarios de clientes no son del equipo: nunca reciben avisos internos.
  return emailsUnicos(data.filter((u) => !esUsuarioCliente(u.publicMetadata)).map(emailDe));
}

/** Emails de los owners (Clerk) y, si no hay ninguno, OWNER_EMAIL. */
async function emailsOwners(): Promise<string[]> {
  const clerk = await clerkClient();
  const { data } = await clerk.users.getUserList({ limit: 100 });
  const owners = emailsUnicos(data.filter((u) => leerAcceso(u.publicMetadata).esOwner).map(emailDe));
  if (owners.length) return owners;
  return emailsUnicos((process.env.OWNER_EMAIL ?? "").split(/[\s,;]+/));
}

/**
 * Avisa al equipo de un pedido recién creado por un cliente. Va al equipo
 * asignado a los proyectos del cliente; sin proyecto o sin asignados, a los owners.
 */
export async function avisarPedidoNuevo(pedidoId: string): Promise<void> {
  try {
    if (!puedeEnviar()) return;
    const base = baseApp();
    if (!base) {
      console.warn("[pedidos] falta APP_URL / VERCEL_PROJECT_PRODUCTION_URL: no se puede armar el link del aviso");
      return;
    }

    const { data } = await supabaseAdmin()
      .from("client_requests")
      .select("id, client_id, kind, title, description, priority, clients(name)")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!data) return;
    const p = data as unknown as Pick<Pedido, "id" | "client_id" | "kind" | "title" | "description" | "priority"> & {
      clients: { name: string } | { name: string }[] | null;
    };
    const cliente = (Array.isArray(p.clients) ? p.clients[0] : p.clients)?.name ?? "Un cliente";

    let destinatarios = await emailsAsignados(p.client_id);
    if (!destinatarios.length) destinatarios = await emailsOwners();
    if (!destinatarios.length) {
      console.warn("[pedidos] pedido nuevo sin destinatarios (ni asignados ni owners)");
      return;
    }

    const mail = pedidoNuevoEmail({
      cliente,
      titulo: p.title,
      tipo: LABEL_TIPO_PEDIDO[p.kind],
      urgente: p.priority === "urgente",
      descripcion: p.description,
      url: `${base}/landing-pages/pedidos/${p.id}`,
    });
    for (const to of destinatarios) {
      const r = await enviarEmail({ to, ...mail });
      if (!r.ok) console.error("[pedidos] no se pudo avisar del pedido nuevo:", r.error);
    }
  } catch (e) {
    console.error("[pedidos] falló el aviso de pedido nuevo:", e);
  }
}

/** Autor del pedido si es el cliente; si no se sabe, los miembros (no admin) del portal. */
async function emailsDelCliente(
  clientId: string,
  autor: { createdBy: string; fromClient: boolean },
): Promise<string[]> {
  const clerk = await clerkClient();
  if (autor.fromClient && autor.createdBy) {
    try {
      const email = emailDe(await clerk.users.getUser(autor.createdBy));
      if (email) return [email];
    } catch {
      // Usuario borrado: se cae a los miembros del portal.
    }
  }
  const { data: org } = await supabaseAdmin().from("client_orgs").select("clerk_org_id").eq("client_id", clientId).maybeSingle();
  const orgId = org?.clerk_org_id as string | undefined;
  if (!orgId) return [];
  const { data } = await clerk.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 });
  // Los org:admin son del equipo (el owner que creó la organización).
  return emailsUnicos(data.filter((m) => m.role !== "org:admin").map((m) => m.publicUserData?.identifier ?? null));
}

/**
 * Avisa al cliente que su pedido quedó resuelto. Llamar solo cuando el equipo
 * acaba de pasarlo a "resuelta" (no en cualquier cambio de estado).
 */
export async function avisarPedidoResuelto(pedidoId: string): Promise<void> {
  try {
    if (!puedeEnviar()) return;
    const base = baseApp();
    if (!base) {
      console.warn("[pedidos] falta APP_URL / VERCEL_PROJECT_PRODUCTION_URL: no se puede armar el link del aviso");
      return;
    }

    const db = supabaseAdmin();
    const { data } = await db
      .from("client_requests")
      .select("id, client_id, title, created_by, from_client, status")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!data) return;
    const p = data as unknown as Pick<Pedido, "id" | "client_id" | "title" | "from_client" | "status"> & { created_by: string };
    // Si lo reabrieron antes de que corriera el aviso, ya no corresponde.
    if (p.status !== "resuelta") return;

    // Sin portal no hay a dónde mandarlo: el cliente no tiene cómo verlo.
    const { data: org } = await db.from("client_orgs").select("slug").eq("client_id", p.client_id).maybeSingle();
    const slug = org?.slug as string | undefined;
    if (!slug) return;

    const destinatarios = await emailsDelCliente(p.client_id, { createdBy: p.created_by, fromClient: p.from_client });
    if (!destinatarios.length) {
      console.warn("[pedidos] pedido resuelto sin destinatarios en el cliente");
      return;
    }

    const { data: comentarios } = await db
      .from("client_request_comments")
      .select("body, author_name")
      .eq("request_id", p.id)
      .eq("from_client", false)
      .order("created_at", { ascending: false })
      .limit(1);
    const ultimo = comentarios?.[0] as { body: string; author_name: string | null } | undefined;

    const mail = pedidoResueltoEmail({
      titulo: p.title,
      comentario: ultimo?.body ?? null,
      autorComentario: ultimo?.author_name ?? null,
      url: `${base}/portal/${slug}/pedidos/${p.id}`,
    });
    for (const to of destinatarios) {
      const r = await enviarEmail({ to, ...mail });
      if (!r.ok) console.error("[pedidos] no se pudo avisar del pedido resuelto:", r.error);
    }
  } catch (e) {
    console.error("[pedidos] falló el aviso de pedido resuelto:", e);
  }
}
