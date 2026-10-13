"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { slugify } from "@/lib/escritura";
import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { esUsuarioCliente } from "@/lib/unidades";

/**
 * Acceso de clientes al portal. Todo exige owner: dar acceso a un tercero es
 * la decisión más sensible del panel.
 */
async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner puede gestionar el portal");
  return userId;
}

async function orgDelCliente(clientId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from("client_orgs")
    .select("clerk_org_id")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new Error("No se pudo leer el portal del cliente");
  return (data?.clerk_org_id as string | undefined) ?? null;
}

function revalidarCliente(clientId: string) {
  revalidatePath(`/landing-pages/clients/${clientId}`);
}

/**
 * Crea la organización de Clerk del cliente y la vincula. Sin `createdBy`: si
 * no, el owner quedaría como miembro de cada cliente.
 */
export async function habilitarPortal(clientId: string) {
  await exigirOwner();
  if (await orgDelCliente(clientId)) return;

  const { data: cliente } = await supabaseAdmin()
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .maybeSingle();
  if (!cliente) throw new Error("El cliente no existe");

  const clerk = await clerkClient();
  const base = slugify(cliente.name as string) || "cliente";
  let org;
  try {
    org = await clerk.organizations.createOrganization({ name: cliente.name as string, slug: base });
  } catch {
    // Slug ocupado (otro cliente con el mismo nombre): sufijo corto aleatorio.
    org = await clerk.organizations.createOrganization({
      name: cliente.name as string,
      slug: `${base}-${randomBytes(2).toString("hex")}`,
    });
  }

  const { error } = await supabaseAdmin()
    .from("client_orgs")
    .insert({ client_id: clientId, clerk_org_id: org.id });
  if (error) {
    // Sin vínculo la organización queda huérfana: se borra para no acumular.
    await clerk.organizations.deleteOrganization(org.id).catch(() => undefined);
    throw new Error("No se pudo habilitar el portal");
  }

  revalidarCliente(clientId);
}

/**
 * Invita a una persona del cliente. Si ya tiene cuenta de cliente (un growth
 * operator con varias marcas), se la suma directo a esta organización. Una
 * cuenta del equipo nunca se convierte en cliente.
 */
export async function invitarAlPortal(fd: FormData) {
  await exigirOwner();

  const clientId = String(fd.get("client_id") ?? "");
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email inválido");

  const orgId = await orgDelCliente(clientId);
  if (!orgId) throw new Error("Primero habilitá el portal del cliente");

  const clerk = await clerkClient();
  const { data: existentes } = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  const existente = existentes[0];

  if (existente) {
    if (!esUsuarioCliente(existente.publicMetadata)) {
      throw new Error("Ese email es de una cuenta del equipo: no se puede usar para el portal");
    }
    try {
      await clerk.organizations.createOrganizationMembership({
        organizationId: orgId,
        userId: existente.id,
        role: "org:member",
      });
    } catch {
      throw new Error("Esa persona ya tiene acceso a este portal");
    }
  } else {
    // Una invitación pendiente al mismo email (del equipo o de otro portal)
    // no se pisa: `ignoreExisting` podría dejar viva la anterior con otro rol.
    const { data: pendientes } = await clerk.invitations.getInvitationList({
      status: "pending",
      limit: 100,
    });
    const previa = pendientes.find((i) => i.emailAddress.toLowerCase() === email);
    if (previa) {
      const meta = previa.publicMetadata as { role?: unknown; portalOrgId?: unknown };
      if (meta.role === "client" && meta.portalOrgId === orgId) return;
      throw new Error(
        "Ese email ya tiene una invitación pendiente (del equipo o de otro portal). Revocala primero.",
      );
    }
    try {
      await clerk.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role: "client", portalOrgId: orgId },
        ignoreExisting: true,
      });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "No se pudo invitar");
    }
  }

  revalidarCliente(clientId);
}

export async function quitarAccesoPortal(clientId: string, userId: string) {
  await exigirOwner();
  const orgId = await orgDelCliente(clientId);
  if (!orgId) return;

  const clerk = await clerkClient();
  await clerk.organizations.deleteOrganizationMembership({ organizationId: orgId, userId });
  revalidarCliente(clientId);
}

export async function revocarInvitacionPortal(clientId: string, invitationId: string) {
  await exigirOwner();
  const orgId = await orgDelCliente(clientId);

  const clerk = await clerkClient();
  // La SDK no trae "obtener una invitación": se busca entre las pendientes.
  const { data: pendientes } = await clerk.invitations.getInvitationList({
    status: "pending",
    limit: 100,
  });
  const invitacion = pendientes.find((i) => i.id === invitationId);
  // Solo invitaciones de ESTE portal: el id viene del cliente del navegador.
  const meta = invitacion?.publicMetadata as { portalOrgId?: unknown } | undefined;
  if (!invitacion || !orgId || meta?.portalOrgId !== orgId) {
    throw new Error("Invitación no encontrada");
  }
  await clerk.invitations.revokeInvitation(invitationId);
  revalidarCliente(clientId);
}
