import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { leerAcceso } from "@/lib/landing/auth";

/** Emails separados por coma o espacio, en minúscula y sin repetir. */
export function emailsDeTexto(texto: string | undefined): string[] {
  return [
    ...new Set(
      (texto ?? "")
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
    ),
  ];
}

/**
 * Emails de los owners (usuarios de Clerk con `publicMetadata.role = "owner"`).
 * Si Clerk no responde o no hay ninguno, cae a la variable OWNER_EMAIL.
 */
export async function emailsDeOwners(): Promise<string[]> {
  try {
    const clerk = await clerkClient();
    const { data } = await clerk.users.getUserList({ limit: 100 });
    const emails = data
      .filter((u) => leerAcceso(u.publicMetadata).esOwner)
      .map((u) => (u.primaryEmailAddress?.emailAddress ?? u.emailAddresses[0]?.emailAddress ?? "").toLowerCase())
      .filter(Boolean);
    if (emails.length > 0) return [...new Set(emails)];
  } catch (e) {
    console.error("[lanzamientos] no se pudieron listar los owners en Clerk:", e);
  }
  return emailsDeTexto(process.env.OWNER_EMAIL);
}
