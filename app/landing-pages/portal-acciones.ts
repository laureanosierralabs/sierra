"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { slugify } from "@/lib/escritura";
import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { esUsuarioCliente } from "@/lib/unidades";

/**
 * Acceso de clientes al portal. Todo exige owner: dar acceso a un tercero es
 * la decisión más sensible del panel.
 *
 * Los fallos se DEVUELVEN como `{ error }` en vez de lanzarse: en producción
 * Next reemplaza el mensaje de un Error lanzado por uno genérico, y acá hace
 * falta saber por qué falló (suele ser configuración de Clerk).
 */
type Resultado = { error: string } | undefined;

async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner puede gestionar el portal");
  return userId;
}

/** Mensaje legible de un error de la API de Clerk (trae `errors[].longMessage`). */
function motivo(e: unknown, respaldo: string): string {
  const errores = (e as { errors?: { longMessage?: string; message?: string }[] } | null)?.errors;
  const detalle = errores?.[0]?.longMessage ?? errores?.[0]?.message;
  if (detalle) return `${respaldo}: ${detalle}`;
  return e instanceof Error && e.message ? `${respaldo}: ${e.message}` : respaldo;
}

async function orgDelCliente(clientId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from("client_orgs")
    .select("clerk_org_id")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el portal del cliente: ${error.message}`);
  return (data?.clerk_org_id as string | undefined) ?? null;
}

function revalidarCliente(clientId: string) {
  revalidatePath(`/landing-pages/clients/${clientId}`);
}

/** Slug del portal: el nombre del cliente, con sufijo si ya está tomado. */
async function slugLibre(nombre: string): Promise<string> {
  const base = slugify(nombre) || "cliente";
  const { data } = await supabaseAdmin().from("client_orgs").select("slug").eq("slug", base).maybeSingle();
  return data ? `${base}-${randomBytes(2).toString("hex")}` : base;
}

/** Crea la organización de Clerk del cliente y la vincula a su ficha. */
export async function habilitarPortal(clientId: string): Promise<Resultado> {
  const ownerId = await exigirOwner();

  try {
    if (await orgDelCliente(clientId)) return;

    const { data: cliente } = await supabaseAdmin()
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .maybeSingle();
    if (!cliente) return { error: "El cliente no existe" };
    const nombre = cliente.name as string;

    const clerk = await clerkClient();
    let org;
    try {
      // Sin slug (función opcional de Clerk) y sin `createdBy`: así el owner
      // no queda como miembro de cada cliente.
      org = await clerk.organizations.createOrganization({ name: nombre });
    } catch (sinCreador) {
      try {
        // Algunas instancias exigen un creador: el owner queda como admin de
        // la organización (no aparece en la lista de accesos del cliente).
        org = await clerk.organizations.createOrganization({ name: nombre, createdBy: ownerId });
      } catch {
        return { error: motivo(sinCreador, "Clerk no pudo crear la organización") };
      }
    }

    const { error } = await supabaseAdmin()
      .from("client_orgs")
      .insert({ client_id: clientId, clerk_org_id: org.id, slug: await slugLibre(nombre) });
    if (error) {
      // Sin vínculo la organización queda huérfana: se borra para no acumular.
      await clerk.organizations.deleteOrganization(org.id).catch(() => undefined);
      return { error: `No se pudo guardar el vínculo del portal: ${error.message}` };
    }

    revalidarCliente(clientId);
  } catch (e) {
    return { error: motivo(e, "No se pudo habilitar el portal") };
  }
}

/**
 * Invita a una persona del cliente. Si ya tiene cuenta de cliente (un growth
 * operator con varias marcas), se la suma directo a esta organización. Una
 * cuenta del equipo nunca se convierte en cliente.
 */
export async function invitarAlPortal(fd: FormData): Promise<Resultado | { aviso: string }> {
  await exigirOwner();

  const clientId = String(fd.get("client_id") ?? "");
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email inválido" };

  try {
    const orgId = await orgDelCliente(clientId);
    if (!orgId) return { error: "Primero habilitá el portal del cliente" };

    const clerk = await clerkClient();
    const { data: existentes } = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
    const existente = existentes[0];

    if (existente) {
      if (!esUsuarioCliente(existente.publicMetadata)) {
        return { error: "Ese email es de una cuenta del equipo: no se puede usar para el portal" };
      }
      try {
        await clerk.organizations.createOrganizationMembership({
          organizationId: orgId,
          userId: existente.id,
          role: "org:member",
        });
      } catch (e) {
        return { error: motivo(e, "No se pudo sumar a esa persona (¿ya tiene acceso?)") };
      }
      revalidarCliente(clientId);
      // No sale mail: ya tiene cuenta, entra con su login de siempre.
      return { aviso: `${email} ya tenía cuenta de cliente: se le sumó este portal. No le llega mail, entra con su login.` };
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
        if (meta.role === "client" && meta.portalOrgId === orgId) {
          return {
            aviso: `${email} ya tenía una invitación pendiente a este portal: no se manda otra. Si no la encuentra (revisar spam), revocala e invitala de nuevo.`,
          };
        }
        return {
          error:
            "Ese email ya tiene una invitación pendiente (del equipo o de otro portal). Revocala primero.",
        };
      }
      // El link del mail lleva a NUESTRA pantalla de registro, en su versión
      // para clientes (con la marca y el texto del portal), no a la de Clerk.
      const h = await headers();
      const host = h.get("x-forwarded-host") ?? h.get("host");
      await clerk.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role: "client", portalOrgId: orgId },
        ignoreExisting: true,
        ...(host ? { redirectUrl: `https://${host}/sign-up?para=cliente` } : {}),
      });
    }

    revalidarCliente(clientId);
    return { aviso: `Invitación enviada a ${email}. Le llega un mail de Clerk (puede caer en spam).` };
  } catch (e) {
    return { error: motivo(e, "No se pudo invitar") };
  }
}

export async function quitarAccesoPortal(clientId: string, userId: string): Promise<Resultado> {
  await exigirOwner();
  try {
    const orgId = await orgDelCliente(clientId);
    if (!orgId) return;

    const clerk = await clerkClient();
    await clerk.organizations.deleteOrganizationMembership({ organizationId: orgId, userId });
    revalidarCliente(clientId);
  } catch (e) {
    return { error: motivo(e, "No se pudo quitar el acceso") };
  }
}

export async function revocarInvitacionPortal(
  clientId: string,
  invitationId: string,
): Promise<Resultado> {
  await exigirOwner();
  try {
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
      return { error: "Invitación no encontrada" };
    }
    await clerk.invitations.revokeInvitation(invitationId);
    revalidarCliente(clientId);
  } catch (e) {
    return { error: motivo(e, "No se pudo revocar la invitación") };
  }
}
