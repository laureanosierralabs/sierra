"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { getTeamMember, requireTeamOwner, teamLoadError } from "@/lib/team";
import { emptyTeamMember, isTeamMemberId, parseTeamUpdate } from "@/lib/team-fields";

function refreshTeam(id: string) {
  revalidatePath("/equipo");
  revalidatePath(`/equipo/${id}`);
  revalidatePath("/");
}

export async function createTeamMember(fd: FormData): Promise<{ error?: string; id?: string }> {
  if (!(await requireTeamOwner())) return { error: "Sin acceso para editar el equipo." };
  const id = randomUUID();
  try {
    let profile;
    try {
      profile = parseTeamUpdate(fd, emptyTeamMember(id));
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Revisa los datos del formulario." };
    }
    const { data, error } = await supabaseAdmin().from("team_members")
      .insert({ id, ...profile }).select("id").single();
    if (error) throw error;
    if (!data) return { error: "No se pudo crear el perfil. Intenta nuevamente." };
  } catch (error) {
    return { error: `${teamLoadError(error)} No se creó el perfil.` };
  }
  refreshTeam(id);
  return { id };
}

export async function deleteTeamMember(id: string): Promise<{ error?: string }> {
  if (!(await requireTeamOwner())) return { error: "Sin acceso para editar el equipo." };
  if (!isTeamMemberId(id)) return { error: "El identificador de la persona no es válido." };
  try {
    const { data, error } = await supabaseAdmin().from("team_members")
      .delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return { error: "Esta persona ya no existe en el equipo." };
  } catch (error) {
    return { error: `${teamLoadError(error)} No se eliminó el perfil.` };
  }
  refreshTeam(id);
  return {};
}

export async function updateTeamMember(id: string, fd: FormData): Promise<{ error?: string }> {
  if (!(await requireTeamOwner())) return { error: "Sin acceso para editar el equipo." };
  if (!isTeamMemberId(id)) return { error: "El identificador de la persona no es válido." };
  let update;
  try {
    const member = await getTeamMember(id);
    if (!member) return { error: "Esta persona ya no existe en el equipo." };
    try {
      update = parseTeamUpdate(fd, member);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Revisa los datos del formulario." };
    }
    // Existing project links are intentionally excluded from profile edits.
    const { data, error } = await supabaseAdmin().from("team_members")
      .update({ ...update, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return { error: "No se guardó el perfil: esta persona ya no existe." };
  } catch (error) {
    return { error: `${teamLoadError(error)} Tus cambios no se guardaron.` };
  }
  refreshTeam(id);
  return {};
}
