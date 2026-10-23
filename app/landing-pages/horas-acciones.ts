"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { accesoActual, nombreDe, usuarioActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { fechaValida, horaValida, MAX_NOTAS, minutosEntre } from "@/lib/horas/tipos";

/**
 * Carga de horas. Cualquiera del equipo carga las suyas; editar o borrar una
 * fila ajena solo lo puede el owner. El dueño de una fila nueva sale siempre
 * de la sesión, nunca del formulario.
 */
type Resultado = { error: string } | undefined;

async function exigirEquipo() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");
  const { esOwner, esCliente } = await accesoActual();
  if (esCliente) throw new Error("No autorizado");
  return { userId, esOwner };
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

/**
 * La fila existe y quien la toca es su dueño o el owner. Una carga ya pagada
 * solo la toca el owner: cambiarla cambiaría lo que se pagó.
 */
async function puedeTocar(id: string, userId: string, esOwner: boolean): Promise<boolean> {
  const { data } = await supabaseAdmin()
    .from("time_entries")
    .select("user_id, team_payment_id")
    .eq("id", id)
    .maybeSingle();
  if (!data) return false;
  return esOwner || (data.user_id === userId && !data.team_payment_id);
}

export async function guardarHora(fd: FormData): Promise<Resultado> {
  const { userId, esOwner } = await exigirEquipo();

  const id = texto(fd, "id") || null;
  const fecha = fechaValida(texto(fd, "work_date"));
  const inicio = horaValida(texto(fd, "start_time"));
  const fin = horaValida(texto(fd, "end_time"));
  const notas = texto(fd, "notes");
  const cliente = texto(fd, "client_id") || null;

  if (!fecha) return { error: "Falta el día" };
  if (!inicio || !fin) return { error: "Faltan la hora de comienzo o la de finalización" };
  if (minutosEntre(inicio, fin) === null) return { error: "Revisá el horario: una carga no puede durar más de 16 horas ni empezar y terminar a la misma hora" };
  if (!notas) return { error: "Contá qué trabajaste" };
  if (notas.length > MAX_NOTAS) return { error: `El comentario no puede pasar de ${MAX_NOTAS} caracteres` };

  const db = supabaseAdmin();
  if (cliente) {
    const { data } = await db.from("clients").select("id").eq("id", cliente).maybeSingle();
    if (!data) return { error: "Ese cliente no existe" };
  }

  const campos = {
    work_date: fecha,
    start_time: inicio,
    end_time: fin,
    notes: notas,
    client_id: cliente,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    if (!(await puedeTocar(id, userId, esOwner))) return { error: "No podés editar esta carga" };
    let cambio = db.from("time_entries").update(campos).eq("id", id);
    // Además del chequeo previo: el equipo solo modifica sus filas sin pagar.
    if (!esOwner) cambio = cambio.eq("user_id", userId).is("team_payment_id", null);
    const { error } = await cambio;
    if (error) return { error: "No se pudo guardar: probá de nuevo" };
  } else {
    const usuario = await usuarioActual();
    const { error } = await db.from("time_entries").insert({
      ...campos,
      user_id: userId,
      user_name: usuario ? nombreDe(usuario) : "Sin nombre",
    });
    if (error) return { error: "No se pudo guardar: probá de nuevo" };
  }

  revalidatePath("/landing-pages/horas");
}

export async function borrarHora(id: string): Promise<Resultado> {
  const { userId, esOwner } = await exigirEquipo();
  if (!(await puedeTocar(id, userId, esOwner))) return { error: "No podés borrar esta carga" };
  let borrado = supabaseAdmin().from("time_entries").delete().eq("id", id);
  if (!esOwner) borrado = borrado.eq("user_id", userId).is("team_payment_id", null);
  const { error } = await borrado;
  if (error) return { error: "No se pudo borrar: probá de nuevo" };
  revalidatePath("/landing-pages/horas");
}
