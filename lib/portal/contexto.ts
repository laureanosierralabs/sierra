import "server-only";

import { cache } from "react";
import { clerkClient } from "@clerk/nextjs/server";
import { accesoActual, usuarioActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";

/**
 * De quién es lo que se muestra en el portal. Todo dato del portal se lee
 * con este contexto: `lib/portal/*` nunca consulta sin `clientId`.
 */
export interface ContextoPortal {
  clientId: string;
  clienteNombre: string;
  orgId: string;
  orgSlug: string;
  /** El owner viendo el portal de un cliente (soporte / vista previa). */
  vistaInterna: boolean;
}

export interface OrgPortal {
  id: string;
  slug: string;
  nombre: string;
}

/**
 * Organizaciones (clientes) a las que pertenece el usuario de cliente.
 *
 * Una invitación al portal no puede crear la membresía (el usuario todavía no
 * existe), así que lleva `portalOrgId` en la metadata y la membresía se crea
 * acá, la primera vez que entra. Es idempotente: si ya es miembro, no hace nada.
 */
export const organizacionesDelUsuario = cache(async (): Promise<OrgPortal[]> => {
  const usuario = await usuarioActual();
  const acceso = await accesoActual();
  if (!usuario || !acceso.esCliente) return [];

  const clerk = await clerkClient();
  const listar = async () =>
    (await clerk.users.getOrganizationMembershipList({ userId: usuario.id, limit: 100 })).data;

  let membresias = await listar();

  // `portalOrgId` es de UN solo uso: se consume en la primera visita. Si
  // quedara en la metadata, quitarle el acceso desde el panel no serviría:
  // la próxima visita lo volvería a sumar.
  const pendiente = (usuario.publicMetadata as { portalOrgId?: unknown }).portalOrgId;
  if (typeof pendiente === "string") {
    if (!membresias.some((m) => m.organization.id === pendiente)) {
      try {
        await clerk.organizations.createOrganizationMembership({
          organizationId: pendiente,
          userId: usuario.id,
          role: "org:member",
        });
        membresias = await listar();
      } catch (e) {
        // Organización borrada o membresía creada en paralelo: se sigue con
        // lo que haya, sin bloquear el resto de sus organizaciones.
        console.error("[portal] no se pudo crear la membresía pendiente:", e);
      }
    }
    // null borra la clave; el resto de la metadata (role) queda igual.
    await clerk.users
      .updateUserMetadata(usuario.id, { publicMetadata: { portalOrgId: null } })
      .catch((e) => console.error("[portal] no se pudo consumir portalOrgId:", e));
  }

  return membresias
    .map((m) => ({ id: m.organization.id, slug: m.organization.slug ?? "", nombre: m.organization.name }))
    .filter((o) => o.slug)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
});

/**
 * Resuelve el cliente de `/portal/<slug>`. Null = no existe o no le
 * corresponde (la página responde 404 en los dos casos, sin revelar cuál).
 *
 * - Usuario de cliente: solo organizaciones de las que es miembro.
 * - Owner: cualquier organización vinculada a un cliente (vista interna).
 * - Member del equipo: nunca.
 */
export const contextoPortal = cache(async (slug: string): Promise<ContextoPortal | null> => {
  const acceso = await accesoActual();
  let org: OrgPortal | null = null;

  if (acceso.esCliente) {
    org = (await organizacionesDelUsuario()).find((o) => o.slug === slug) ?? null;
  } else if (acceso.esOwner) {
    try {
      const clerk = await clerkClient();
      const o = await clerk.organizations.getOrganization({ slug });
      org = { id: o.id, slug: o.slug ?? slug, nombre: o.name };
    } catch {
      org = null;
    }
  }
  if (!org) return null;

  const { data, error } = await supabaseAdmin()
    .from("client_orgs")
    .select("client_id, clients(name)")
    .eq("clerk_org_id", org.id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el portal");
  if (!data) return null;

  const cliente = (data as { clients: { name: string } | { name: string }[] | null }).clients;
  const nombre = (Array.isArray(cliente) ? cliente[0]?.name : cliente?.name) ?? org.nombre;

  return {
    clientId: data.client_id as string,
    clienteNombre: nombre,
    orgId: org.id,
    orgSlug: org.slug,
    vistaInterna: !acceso.esCliente,
  };
});
