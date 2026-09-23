import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type {
  Cliente,
  Cotizacion,
  Proyecto,
  Recurso,
  Tarea,
} from "@/lib/landing/tipos";

export async function listarProyectos(): Promise<Proyecto[]> {
  const { data, error } = await supabaseAdmin()
    .from("projects")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`No se pudieron leer los proyectos: ${error.message}`);
  return data ?? [];
}

export async function listarTareas(): Promise<Tarea[]> {
  const { data, error } = await supabaseAdmin()
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`No se pudieron leer las tareas: ${error.message}`);
  return data ?? [];
}

export async function obtenerProyecto(id: string): Promise<Proyecto | null> {
  const { data, error } = await supabaseAdmin()
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer el proyecto: ${error.message}`);
  return data;
}

/** Tareas del proyecto en orden de kanban. */
export async function listarTareasDeProyecto(
  projectId: string,
): Promise<Tarea[]> {
  const { data, error } = await supabaseAdmin()
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudieron leer las tareas: ${error.message}`);
  return data ?? [];
}

export async function listarRecursos(projectId: string): Promise<Recurso[]> {
  const { data, error } = await supabaseAdmin()
    .from("project_resources")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudieron leer los recursos: ${error.message}`);
  return data ?? [];
}

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabaseAdmin()
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudieron leer los clientes: ${error.message}`);
  return data ?? [];
}

export async function obtenerCliente(id: string): Promise<Cliente | null> {
  const { data, error } = await supabaseAdmin()
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer el cliente: ${error.message}`);
  return data;
}

export async function listarCotizaciones(): Promise<Cotizacion[]> {
  const { data, error } = await supabaseAdmin()
    .from("quotes")
    .select("*")
    .order("sent_at", { ascending: false, nullsFirst: false });

  if (error)
    throw new Error(`No se pudieron leer las cotizaciones: ${error.message}`);
  return data ?? [];
}
