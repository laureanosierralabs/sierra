import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/landing/supabase";

/** Estado del portal de un cliente, para la ficha del cliente (solo owner). */
export interface EstadoPortal {
  slug: string;
  miembros: { userId: string; nombre: string; email: string | null }[];
  invitaciones: { id: string; email: string; creada: string }[];
}

/** Null = el cliente todavía no tiene portal. */
export async function estadoPortalCliente(clientId: string): Promise<EstadoPortal | null> {
  const { data } = await supabaseAdmin()
    .from("client_orgs")
    .select("clerk_org_id")
    .eq("client_id", clientId)
    .maybeSingle();
  const orgId = data?.clerk_org_id as string | undefined;
  if (!orgId) return null;

  const clerk = await clerkClient();
  const [org, membresias, invitaciones] = await Promise.all([
    clerk.organizations.getOrganization({ organizationId: orgId }),
    clerk.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
    clerk.invitations.getInvitationList({ status: "pending", limit: 100 }),
  ]);

  return {
    slug: org.slug ?? "",
    miembros: membresias.data.map((m) => {
      const u = m.publicUserData;
      const nombre = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
      return {
        userId: u?.userId ?? "",
        nombre: nombre || u?.identifier || "Sin nombre",
        email: u?.identifier ?? null,
      };
    }),
    invitaciones: invitaciones.data
      .filter((i) => (i.publicMetadata as { portalOrgId?: unknown }).portalOrgId === orgId)
      .map((i) => ({
        id: i.id,
        email: i.emailAddress,
        creada: new Date(i.createdAt).toISOString().slice(0, 10),
      })),
  };
}
