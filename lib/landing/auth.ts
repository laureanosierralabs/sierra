import "server-only";

import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { Miembro } from "@/lib/landing/tipos";
import { esUsuarioCliente, parsearUnidades, type Unidad } from "@/lib/unidades";

/** Roles del equipo interno (los que se eligen en la pantalla Equipo). */
export type Rol = "owner" | "member";

export interface Acceso {
  rol: Rol | "client";
  esOwner: boolean;
  /** Usuario de un cliente: solo el portal, nunca el panel interno. */
  esCliente: boolean;
  unidades: Unidad[];
}

/**
 * Traduce publicMetadata de Clerk a un permiso. Sin rol explícito asumimos
 * `member` (equipo interno); un cliente siempre llega con `role: "client"`.
 */
export function leerAcceso(metadata: unknown): Acceso {
  if (esUsuarioCliente(metadata)) {
    return { rol: "client", esOwner: false, esCliente: true, unidades: [] };
  }

  const m = metadata as { role?: unknown; units?: unknown } | undefined;
  const esOwner = m?.role === "owner";
  const unidades = parsearUnidades(m?.units);

  return {
    rol: esOwner ? "owner" : "member",
    esOwner,
    esCliente: false,
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
export const accesoActual = cache(async (): Promise<Acceso> => {
  const usuario = await usuarioActual();
  return leerAcceso(usuario?.publicMetadata);
});

/**
 * Usuario de Clerk de la sesión, leído una vez por request: el acceso y el
 * portal lo necesitan y cada lectura es una llamada a la API de Clerk.
 */
export const usuarioActual = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  const cliente = await clerkClient();
  return cliente.users.getUser(userId);
});

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
  // Los usuarios de clientes no son del equipo: nunca son responsables.
  return data
    .filter((u) => !esUsuarioCliente(u.publicMetadata))
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

  // Las invitaciones al portal se gestionan desde la ficha del cliente.
  return data.filter((i) => !esUsuarioCliente(i.publicMetadata)).map((i) => {
    const acceso = leerAcceso(i.publicMetadata);
    return {
      id: i.id,
      email: i.emailAddress,
      rol: acceso.rol as Rol,
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
    .filter((u) => !esUsuarioCliente(u.publicMetadata))
    .map((u) => {
      const acceso = leerAcceso(u.publicMetadata);
      return {
        id: u.id,
        nombre: nombreDe(u),
        email: u.emailAddresses[0]?.emailAddress ?? null,
        rol: acceso.rol as Rol,
        unidades: acceso.unidades,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
