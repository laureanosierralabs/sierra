"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { validarComponente } from "@/lib/componentes/tipos";

/**
 * Biblioteca de componentes. Cualquiera del equipo agrega y edita; borrar es
 * del owner, igual que en la biblioteca de propuestas. El autor de un
 * componente nuevo sale siempre de la sesión, nunca del formulario.
 */
type Resultado = { error: string } | undefined;

async function exigirEquipo() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner, esCliente } = await accesoActual();
  if (esCliente) throw new Error("No autorizado");
  return { userId, esOwner };
}

const RUTA = "/landing-pages/componentes";

export async function guardarComponente(fd: FormData): Promise<Resultado> {
  const { userId } = await exigirEquipo();

  const v = validarComponente(Object.fromEntries(fd.entries()));
  if (!v.ok) return { error: v.error };

  const id = String(fd.get("id") ?? "").trim();
  const db = supabaseAdmin();

  if (id) {
    const { error } = await db
      .from("ui_components")
      .update({ ...v.datos, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: `No se pudo guardar: ${error.message}` };
    revalidatePath(`${RUTA}/${id}`);
  } else {
    const { error } = await db.from("ui_components").insert({ ...v.datos, created_by: userId });
    if (error) return { error: `No se pudo guardar: ${error.message}` };
  }
  revalidatePath(RUTA);
}

export async function borrarComponente(id: string): Promise<void | { error: string }> {
  const { esOwner } = await exigirEquipo();
  if (!esOwner) return { error: "Solo el owner puede borrar componentes" };

  const { error } = await supabaseAdmin().from("ui_components").delete().eq("id", id);
  if (error) return { error: `No se pudo borrar: ${error.message}` };
  revalidatePath(RUTA);
}
