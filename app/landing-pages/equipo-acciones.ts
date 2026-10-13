"use server";

import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { esUsuarioCliente, parsearUnidades } from "@/lib/unidades";

/**
 * Gestión del equipo. Todo pasa por acá y todo exige owner: un member no
 * puede cambiar roles ni invitar, aunque llame la acción directamente.
 */
async function exigirOwner() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const { esOwner } = await accesoActual();
  if (!esOwner) throw new Error("Solo el owner puede gestionar el equipo");

  return userId;
}

/**
 * Las cuentas de clientes se gestionan desde el portal de cada cliente: acá
 * no se les cambia el rol ni se las borra, aunque llegue su id.
 */
async function exigirDelEquipo(userId: string) {
  const client = await clerkClient();
  const usuario = await client.users.getUser(userId).catch(() => null);
  if (!usuario) throw new Error("El usuario no existe");
  if (esUsuarioCliente(usuario.publicMetadata)) {
    throw new Error("Es una cuenta de cliente: se gestiona desde la ficha del cliente");
  }
}

export async function invitarMiembro(fd: FormData) {
  await exigirOwner();

  const email = String(fd.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email inválido");
  }

  const rol = String(fd.get("role") ?? "member");
  const unidades = parsearUnidades(fd.getAll("units").map(String));

  if (rol !== "owner" && unidades.length === 0) {
    throw new Error("Elegí al menos una unidad para el miembro");
  }

  const client = await clerkClient();

  // Una invitación pendiente al portal para el mismo email no se pisa con
  // una del equipo: `ignoreExisting` podría dejar viva la de cliente.
  const { data: pendientes } = await client.invitations.getInvitationList({
    status: "pending",
    limit: 100,
  });
  const previa = pendientes.find((i) => i.emailAddress.toLowerCase() === email.toLowerCase());
  if (previa && esUsuarioCliente(previa.publicMetadata)) {
    throw new Error("Ese email tiene una invitación pendiente al portal de un cliente. Revocala primero.");
  }

  try {
    await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata:
        rol === "owner" ? { role: "owner" } : { role: "member", units: unidades },
      ignoreExisting: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo invitar";
    throw new Error(msg);
  }

  revalidatePath("/landing-pages/team");
}

export async function cambiarAcceso(fd: FormData) {
  const yo = await exigirOwner();

  const userId = String(fd.get("user_id") ?? "");
  if (!userId) throw new Error("Falta el usuario");

  const rol = String(fd.get("role") ?? "member");
  const unidades = parsearUnidades(fd.getAll("units").map(String));

  // Quitarse el propio owner deja el panel sin nadie que pueda gestionarlo.
  if (userId === yo && rol !== "owner") {
    throw new Error("No podés quitarte a vos mismo el rol de owner");
  }

  if (rol !== "owner" && unidades.length === 0) {
    throw new Error("Elegí al menos una unidad");
  }

  const client = await clerkClient();
  await exigirDelEquipo(userId);
  await client.users.updateUserMetadata(userId, {
    publicMetadata:
      rol === "owner" ? { role: "owner" } : { role: "member", units: unidades },
  });

  revalidatePath("/landing-pages/team");
  revalidatePath("/", "layout");
}

export async function revocarInvitacion(id: string) {
  await exigirOwner();

  const client = await clerkClient();
  await client.invitations.revokeInvitation(id);

  revalidatePath("/landing-pages/team");
}

export async function quitarMiembro(userId: string) {
  const yo = await exigirOwner();

  if (userId === yo) {
    throw new Error("No podés eliminar tu propia cuenta desde acá");
  }

  const client = await clerkClient();
  await exigirDelEquipo(userId);
  await client.users.deleteUser(userId);

  revalidatePath("/landing-pages/team");
}
