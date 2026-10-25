import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";
import type { ComponenteUI } from "@/lib/componentes/tipos";

const COLUMNAS =
  "id, title, category, description, code, code_language, prompt, install_command, reference_url, preview_url, tags, created_by, created_at, updated_at";

/** Todos los componentes, los más nuevos primero. La búsqueda se hace en el cliente. */
export async function listarComponentes(): Promise<ComponenteUI[]> {
  const { data, error } = await supabaseAdmin()
    .from("ui_components")
    .select(COLUMNAS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los componentes: ${error.message}`);
  return (data ?? []) as ComponenteUI[];
}

export async function obtenerComponente(id: string): Promise<ComponenteUI | null> {
  // Un id que no es uuid haría fallar la consulta: se trata como "no existe".
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabaseAdmin().from("ui_components").select(COLUMNAS).eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo leer el componente: ${error.message}`);
  return (data as ComponenteUI | null) ?? null;
}
