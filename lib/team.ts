import "server-only";

import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import type { TeamMember, TeamProject } from "@/lib/team-fields";

export async function requireTeamOwner() {
  const access = await accesoActual();
  return access.esOwner;
}

export function teamLoadError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  if (code === "42P01" || code === "PGRST205") {
    return "Equipo todavía no está configurado en la base de datos. Es necesario aplicar la migración 20261006120000_team_members.sql y volver a abrir esta sección.";
  }
  return "No se pudo cargar el equipo. Revisa la conexión con la base de datos e intenta nuevamente.";
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabaseAdmin().from("team_members").select("*").order("created_at").order("id");
  if (error) throw error;
  return data ?? [];
}

export async function getTeamMember(id: string): Promise<TeamMember | null> {
  const { data, error } = await supabaseAdmin().from("team_members").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Both existing catalogs, without task, document or credential contents. */
export async function getTeamProjects(): Promise<TeamProject[]> {
  const db = supabaseAdmin();
  const [web, context] = await Promise.all([
    db.from("projects").select("id,name,status").order("name"),
    db.from("context_projects").select("slug,nombre,estado").order("nombre"),
  ]);
  if (web.error) throw web.error;
  if (context.error) throw context.error;
  return [
    ...(web.data ?? []).map((p) => ({ ...p, source: "projects" as const })),
    ...(context.data ?? []).map((p) => ({ id: p.slug, name: p.nombre, status: p.estado, source: "context_projects" as const })),
  ];
}
