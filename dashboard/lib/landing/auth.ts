import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Miembro } from "@/lib/landing/tipos";
import { parsearUnidades, type Unidad } from "@/lib/unidades";

export type Rol = "owner" | "member";

export interface Acceso {
  rol: Rol;
  esOwner: boolean;
  unidades: Unidad[];
}

/**
 * Traduce publicMetadata de Clerk a un permiso. Sin rol explícito asumimos
 * `member`, que es el acceso más restringido: el default seguro.
 */
export function leerAcceso(metadata: unknown): Acceso {
  const m = metadata as { role?: unknown; units?: unknown } | undefined;
  const esOwner = m?.role === "owner";
  const unidades = parsearUnidades(m?.units);

  return {
    rol: esOwner ? "owner" : "member",
    esOwner,
    // Un member sin units declaradas cae a landing-pages, que era el único
    // acceso posible antes de que existiera este campo.
    unidades: esOwner
      ? []
      : unidades.length > 0
        ? unidades
        : ["landing-pages"],
  };
}

/**
 * Acceso del usuario actual. Se lee del usuario y no de sessionClaims: el
 * token de Core 3 no incluye publicMetadata.
 */
export async function accesoActual(): Promise<Acceso> {
  const { userId } = await auth();
  if (!userId) return leerAcceso(undefined);

  const cliente = await clerkClient();
  const usuario = await cliente.users.getUser(userId);
  return leerAcceso(usuario.publicMetadata);
}

function nombreDe(u: {
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { emailAddress: string }[];
}): string {
  const nombre = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return nombre || u.emailAddresses[0]?.emailAddress || "Sin nombre";
}

/** Miembros del workspace para poblar los selects de responsable. */
export async function listarMiembros(): Promise<Miembro[]> {
  const client = await clerkClient();
  const { data } = await client.users.getUserList({ limit: 100 });
  return data
    .map((u) => ({ id: u.id, nombre: nombreDe(u) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export interface Invitacion {
  id: string;
  email: string;
  rol: Rol;
  unidades: Unidad[];
  creada: string;
}

/** Invitaciones enviadas que todavía no se aceptaron. */
export async function listarInvitaciones(): Promise<Invitacion[]> {
  const client = await clerkClient();
  const { data } = await client.invitations.getInvitationList({
    status: "pending",
    limit: 50,
  });

  return data.map((i) => {
    const acceso = leerAcceso(i.publicMetadata);
    return {
      id: i.id,
      email: i.emailAddress,
      rol: acceso.rol,
      unidades: acceso.unidades,
      creada: new Date(i.createdAt).toISOString().slice(0, 10),
    };
  });
}

export interface MiembroDetalle extends Miembro {
  email: string | null;
  rol: Rol;
  unidades: Unidad[];
}

/** Igual que listarMiembros pero con email y acceso, para la pantalla Equipo. */
export async function listarMiembrosDetalle(): Promise<MiembroDetalle[]> {
  const client = await clerkClient();
  const { data } = await client.users.getUserList({ limit: 100 });

  return data
    .map((u) => {
      const acceso = leerAcceso(u.publicMetadata);
      return {
        id: u.id,
        nombre: nombreDe(u),
        email: u.emailAddresses[0]?.emailAddress ?? null,
        rol: acceso.rol,
        unidades: acceso.unidades,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
