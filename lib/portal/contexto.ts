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
  slug: string;
  /** Alguien del equipo viendo el portal de un cliente (soporte / vista previa). Solo lectura. */
  vistaInterna: boolean;
  /** Las cotizaciones las ven el cliente y el owner; el resto del equipo no. */
  verCotizaciones: boolean;
}

/** Un portal al que el usuario puede entrar. */
export interface PortalDisponible {
  slug: string;
  nombre: string;
  portada: string | null;
}

type FilaPortal = {
  client_id: string;
  clerk_org_id: string;
  slug: string;
  clients: { name: string; portal_cover_url?: string | null } | { name: string; portal_cover_url?: string | null }[] | null;
};

const clienteDe = (f: FilaPortal) => (Array.isArray(f.clients) ? f.clients[0] : f.clients) ?? null;
const nombreDe = (f: FilaPortal) => clienteDe(f)?.name ?? f.slug;

/**
 * Ids de las organizaciones de Clerk de las que el usuario de cliente es
 * miembro. La identidad vive en Clerk; el slug y el cliente, en client_orgs.
 *
 * Una invitación al portal no puede crear la membresía (el usuario todavía no
 * existe), así que lleva `portalOrgId` en la metadata y la membresía se crea
 * acá, la primera vez que entra.
 */
const organizacionesDelUsuario = cache(async (): Promise<string[]> => {
  const usuario = await usuarioActual();
  const acceso = await accesoActual();
  if (!usuario || !acceso.esCliente) return [];

  const clerk = await clerkClient();
  const listar = async () =>
    (await clerk.users.getOrganizationMembershipList({ userId: usuario.id, limit: 100 })).data.map(
      (m) => m.organization.id,
    );

  let ids = await listar();

  // `portalOrgId` es de UN solo uso: se consume en la primera visita. Si
  // quedara en la metadata, quitarle el acceso desde el panel no serviría:
  // la próxima visita lo volvería a sumar.
  const pendiente = (usuario.publicMetadata as { portalOrgId?: unknown }).portalOrgId;
  if (typeof pendiente === "string") {
    let consumir = true;
    if (!ids.includes(pendiente)) {
      try {
        await clerk.organizations.createOrganizationMembership({
          organizationId: pendiente,
          userId: usuario.id,
          role: "org:member",
        });
        // No se vuelve a listar: justo después de crearla, Clerk todavía puede
        // devolver la lista sin la membresía nueva y la primera visita quedaba
        // en "Tu acceso todavía no está listo".
        ids = [...ids, pendiente];
      } catch (e) {
        const codigo = (e as { errors?: { code?: string }[] } | null)?.errors?.[0]?.code;
        if (codigo === "already_a_member_in_organization") {
          // Creada en paralelo (otra pestaña o request): ya es miembro.
          ids = [...ids, pendiente];
        } else if (codigo !== "resource_not_found") {
          // Falla transitoria: se conserva para reintentar en la próxima
          // visita. Solo se descarta si la organización ya no existe.
          consumir = false;
        }
        console.error("[portal] no se pudo crear la membresía pendiente:", e);
      }
    }
    if (consumir) {
      // null borra la clave; el resto de la metadata (role) queda igual.
      await clerk.users
        .updateUserMetadata(usuario.id, { publicMetadata: { portalOrgId: null } })
        .catch((e) => console.error("[portal] no se pudo consumir portalOrgId:", e));
    }
  }

  return ids;
});

/**
 * Portales que el usuario puede abrir: los de sus organizaciones si es de un
 * cliente, todos si es del equipo con permiso de portales (vista interna:
 * el owner siempre), ninguno si es member sin ese permiso.
 */
export const portalesDisponibles = cache(async (): Promise<PortalDisponible[]> => {
  const acceso = await accesoActual();
  if (!acceso.esCliente && !acceso.verPortales) return [];

  let consulta = supabaseAdmin()
    .from("client_orgs")
    .select("client_id, clerk_org_id, slug, clients(name, portal_cover_url)");
  if (acceso.esCliente) {
    const ids = await organizacionesDelUsuario();
    if (ids.length === 0) return [];
    consulta = consulta.in("clerk_org_id", ids);
  }

  const { data, error } = await consulta;
  if (error) throw new Error("No se pudieron cargar los portales");
  return ((data ?? []) as FilaPortal[])
    .map((f) => ({ slug: f.slug, nombre: nombreDe(f), portada: clienteDe(f)?.portal_cover_url ?? null }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
});

/**
 * Resuelve el cliente de `/portal/<slug>`. Null = no existe o no le
 * corresponde (la página responde 404 en los dos casos, sin revelar cuál).
 *
 * - Usuario de cliente: solo si es miembro de la organización de ese portal.
 * - Owner, o member con permiso de portales: cualquier portal (vista interna).
 * - Member sin ese permiso: nunca.
 */
export const contextoPortal = cache(async (slug: string): Promise<ContextoPortal | null> => {
  const acceso = await accesoActual();
  if (!acceso.esCliente && !acceso.verPortales) return null;

  const { data, error } = await supabaseAdmin()
    .from("client_orgs")
    .select("client_id, clerk_org_id, slug, clients(name)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el portal");
  if (!data) return null;
  const fila = data as FilaPortal;

  if (acceso.esCliente && !(await organizacionesDelUsuario()).includes(fila.clerk_org_id)) {
    return null;
  }

  return {
    clientId: fila.client_id,
    clienteNombre: nombreDe(fila),
    orgId: fila.clerk_org_id,
    slug: fila.slug,
    vistaInterna: !acceso.esCliente,
    verCotizaciones: acceso.esCliente || acceso.esOwner,
  };
});
