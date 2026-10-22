"use server";

import { descifrar } from "@/lib/landing/cifrado";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { contextoPortal } from "@/lib/portal/contexto";

/**
 * Revela la contraseña de un acceso en el portal. Solo de ESTE cliente (sale
 * del contexto del portal, nunca del navegador) y solo si el owner lo marcó
 * como visible. Una inexistente y una ajena dan el mismo error.
 */
export async function revelarAccesoPortal(slug: string, id: string): Promise<{ error: string } | { secreto: string }> {
  const ctx = await contextoPortal(slug);
  if (!ctx) return { error: "No encontrado" };

  const { data } = await supabaseAdmin()
    .from("client_resources")
    .select("secret_encrypted")
    .eq("id", id)
    .eq("client_id", ctx.clientId)
    .eq("portal_visible", true)
    .maybeSingle();
  const cifrado = (data?.secret_encrypted as string | null | undefined) ?? null;
  if (!cifrado) return { error: "No encontrado" };

  try {
    const secreto = descifrar(cifrado);
    return secreto === null ? { error: "No se pudo leer la contraseña" } : { secreto };
  } catch {
    return { error: "No se pudo leer la contraseña" };
  }
}
