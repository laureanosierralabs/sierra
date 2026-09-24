"use server";

import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { parsearUnidades } from "@/lib/unidades";

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
  await client.users.deleteUser(userId);

  revalidatePath("/landing-pages/team");
}
