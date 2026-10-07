"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { getTeamMember, getTeamProjects, requireTeamOwner, teamLoadError } from "@/lib/team";
import { parseTeamUpdate } from "@/lib/team-fields";

export async function updateTeamMember(id: string, fd: FormData): Promise<{ error?: string }> {
  if (!(await requireTeamOwner())) return { error: "Sin acceso para editar el equipo." };
  let update;
  try {
    const [member, projects] = await Promise.all([getTeamMember(id), getTeamProjects()]);
    if (!member) return { error: "Esta persona ya no existe en el equipo." };
    try {
      update = parseTeamUpdate(fd, member, projects);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Revisa los datos del formulario." };
    }
    // One update persists profile, categories and all project links together.
    const { data, error } = await supabaseAdmin().from("team_members")
      .update({ ...update, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return { error: "No se guardó el perfil: esta persona ya no existe." };
  } catch (error) {
    return { error: `${teamLoadError(error)} Tus cambios no se guardaron.` };
  }
  revalidatePath("/equipo");
  revalidatePath(`/equipo/${id}`);
  revalidatePath("/");
  return {};
}
