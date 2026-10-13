"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { slugify } from "@/lib/escritura";
import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { UNIDADES, type Unidad } from "@/lib/unidades";

/**
 * Sesión + acceso a la unidad. Una Server Action se puede invocar aunque la
 * pantalla esté oculta, así que el permiso se verifica acá y no en la UI.
 * Una unidad desconocida queda solo para el owner.
 */
async function exigirUnidad(unidad: string | null | undefined) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner, unidades } = await accesoActual();
  if (esOwner) return;
  const conocida = (UNIDADES as readonly string[]).includes(unidad ?? "");
  if (!conocida || !unidades.includes(unidad as Unidad))
    throw new Error("No tenés acceso a esta unidad");
}

/** La unidad sale de la base, nunca del form: si no, se podría declarar cualquiera. */
async function unidadDe(tabla: "context_projects" | "context_clients", slug: string) {
  const { data, error } = await supabaseAdmin()
    .from(tabla)
    .select("unidad")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer: ${error.message}`);
  if (!data) throw new Error("No existe");
  return data.unidad as string;
}

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
  await exigirUnidad(await unidadDe("context_projects", slug));

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
  await exigirUnidad(await unidadDe("context_clients", slug));

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
  await exigirUnidad(unidad);

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

  // 23505 = slug repetido: el mensaje crudo de Postgres revelaría que existe en otra unidad.
  if (error)
    throw new Error(error.code === "23505" ? "Ya existe uno con ese nombre" : "No se pudo crear");

  revalidatePath(`/unidad/${unidad}`);
  revalidatePath("/");
}

export async function crearCliente(fd: FormData) {
  const nombre = texto(fd, "nombre");
  const unidad = texto(fd, "unidad");
  if (!nombre) throw new Error("Falta el nombre");
  if (!unidad) throw new Error("Falta la unidad");
  await exigirUnidad(unidad);

  const { error } = await supabaseAdmin().from("context_clients").insert({
    slug: slugify(nombre),
    unidad,
    nombre,
    estado: "activo",
    contexto: texto(fd, "contexto") || null,
  });

  // 23505 = slug repetido: el mensaje crudo de Postgres revelaría que existe en otra unidad.
  if (error)
    throw new Error(error.code === "23505" ? "Ya existe uno con ese nombre" : "No se pudo crear");
  revalidatePath(`/unidad/${unidad}`);
}
