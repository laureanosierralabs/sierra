"use server";

import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/escritura";
import { supabaseAdmin } from "@/lib/landing/supabase";

const ESTADOS_PROYECTO = [
  "activo",
  "por-empezar",
  "bloqueado",
  "pausado",
  "terminado",
];
const ESTADOS_CLIENTE = ["activo", "stand-by", "inactivo", "prospecto"];
const PRIORIDADES = ["alta", "media", "baja"];

function texto(fd: FormData, campo: string): string {
  return String(fd.get(campo) ?? "").trim();
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Edita los campos operativos de un proyecto. Solo toca estado, prioridad,
 * entrega, próximo paso y estado actual. La bitácora se ANTEPONE: nunca se
 * pisa lo que ya estaba escrito.
 */
export async function editarProyecto(fd: FormData) {
  const slug = texto(fd, "slug");
  if (!slug) throw new Error("Falta el proyecto");

  const estado = texto(fd, "estado");
  if (estado && !ESTADOS_PROYECTO.includes(estado)) {
    throw new Error("Estado inválido");
  }
  const prioridad = texto(fd, "prioridad");
  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    throw new Error("Prioridad inválida");
  }
  const entrega = texto(fd, "entrega");
  if (entrega && !/^\d{4}-\d{2}-\d{2}$/.test(entrega)) {
    throw new Error("Fecha de entrega inválida");
  }

  const db = supabaseAdmin();

  const cambios: Record<string, unknown> = { actualizado: hoy() };
  if (estado) cambios.estado = estado;
  if (prioridad) cambios.prioridad = prioridad;
  if (entrega) cambios.entrega = entrega;

  const proximoPaso = texto(fd, "proximoPaso");
  if (proximoPaso) cambios.proximo_paso = proximoPaso;

  const estadoActual = texto(fd, "estadoActual");
  if (estadoActual) cambios.estado_actual = estadoActual;

  const nota = texto(fd, "bitacora");
  if (nota) {
    const { data } = await db
      .from("context_projects")
      .select("bitacora")
      .eq("slug", slug)
      .maybeSingle();

    const previa: string[] = data?.bitacora ?? [];
    cambios.bitacora = [`${hoy()} — ${nota}`, ...previa];
  }

  const { error } = await db
    .from("context_projects")
    .update(cambios)
    .eq("slug", slug);

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);

  revalidatePath(`/proyecto/${slug}`);
  revalidatePath("/");
}

/** Cambia solo el estado de un cliente. */
export async function cambiarEstadoCliente(
  _archivo: string,
  estado: string,
  slug: string,
  unidad: string,
) {
  if (!ESTADOS_CLIENTE.includes(estado)) throw new Error("Estado inválido");

  const { error } = await supabaseAdmin()
    .from("context_clients")
    .update({ estado })
    .eq("slug", slug);

  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  revalidatePath(`/unidad/${unidad}`);
}

export async function crearProyecto(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const unidad = texto(fd, "unidad");
  if (!nombre) throw new Error("Falta el nombre");
  if (!unidad) throw new Error("Falta la unidad");

  const entrega = texto(fd, "entrega");
  if (entrega && !/^\d{4}-\d{2}-\d{2}$/.test(entrega)) {
    throw new Error("Fecha de entrega inválida");
  }

  const { error } = await supabaseAdmin().from("context_projects").insert({
    slug: slugify(nombre),
    unidad,
    nombre,
    cliente: texto(fd, "cliente") || null,
    estado: "por-empezar",
    prioridad: "media",
    entrega: entrega || null,
    actualizado: hoy(),
    proximo_paso: texto(fd, "proximoPaso") || null,
    estado_actual: "Sin comenzar.",
  });

  if (error) throw new Error(`No se pudo crear: ${error.message}`);

  revalidatePath(`/unidad/${unidad}`);
  revalidatePath("/");
}

export async function crearCliente(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const unidad = texto(fd, "unidad");
  if (!nombre) throw new Error("Falta el nombre");
  if (!unidad) throw new Error("Falta la unidad");

  const { error } = await supabaseAdmin().from("context_clients").insert({
    slug: slugify(nombre),
    unidad,
    nombre,
    estado: "activo",
    contexto: texto(fd, "contexto") || null,
  });

  if (error) throw new Error(`No se pudo crear: ${error.message}`);
  revalidatePath(`/unidad/${unidad}`);
}
