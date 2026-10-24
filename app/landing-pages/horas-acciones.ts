"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { accesoActual, nombreDe, usuarioActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import {
  detallePagoHoras,
  fechaValida,
  horaValida,
  MAX_NOTAS,
  minutosEntre,
  tituloPagoHoras,
} from "@/lib/horas/tipos";
import { MONEDAS, type Moneda } from "@/lib/landing/tipos";

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

/** Cargas por pago: holgado para un mes de trabajo. */
const MAX_CARGAS_POR_PAGO = 500;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Paga horas pendientes de una persona: crea un acuerdo por horas a su nombre
 * ("Horas · Octubre 2026", "10 h × USD 10"), le registra el pago y marca las
 * cargas como pagadas. Queda en Finanzas como egreso del equipo y en sus Mis
 * cobros. Si algo falla a mitad de camino se deshace lo hecho: nunca queda un
 * pago sin sus horas ni horas marcadas sin pago.
 */
export async function pagarHoras(fd: FormData): Promise<Resultado | { aviso: string }> {
  const { esOwner } = await exigirEquipo();
  if (!esOwner) return { error: "Solo el owner puede pagar horas" };

  const ids = [...new Set(texto(fd, "entry_ids").split(",").map((v) => v.trim()).filter(Boolean))];
  if (ids.length === 0) return { error: "Elegí las horas a pagar" };
  if (ids.length > MAX_CARGAS_POR_PAGO || ids.some((id) => !UUID.test(id))) return { error: "Selección inválida" };

  const montoTexto = texto(fd, "amount").replace(",", ".");
  const monto = Number(montoTexto);
  if (!montoTexto || !Number.isFinite(monto) || monto <= 0) return { error: "El monto tiene que ser mayor a cero" };
  const moneda = texto(fd, "currency") as Moneda;
  if (!(MONEDAS as readonly string[]).includes(moneda)) return { error: "Moneda inválida" };
  const tarifaTexto = texto(fd, "rate").replace(",", ".");
  const tarifa = tarifaTexto && Number(tarifaTexto) > 0 ? Number(tarifaTexto) : null;
  const pagadoEl = fechaValida(texto(fd, "paid_on")) ?? new Date().toISOString().slice(0, 10);
  const medio = texto(fd, "method").slice(0, 120) || null;

  const db = supabaseAdmin();
  const { data: cargas, error: errCargas } = await db
    .from("time_entries")
    .select("id, user_id, user_name, work_date, minutes, team_payment_id")
    .in("id", ids);
  if (errCargas) return { error: "No se pudieron leer las horas" };
  if (!cargas || cargas.length !== ids.length) return { error: "Alguna de las horas ya no existe: recargá la página" };
  if (cargas.some((c) => c.team_payment_id)) return { error: "Alguna de las horas ya está pagada" };
  const personas = new Set(cargas.map((c) => c.user_id as string));
  if (personas.size !== 1) return { error: "Elegí horas de una sola persona" };

  const persona = cargas[0];
  const minutos = cargas.reduce((t, c) => t + Number(c.minutes), 0);

  const { data: acuerdo, error: errAcuerdo } = await db
    .from("team_agreements")
    .insert({
      member_name: persona.user_name,
      member_user_id: persona.user_id,
      title: tituloPagoHoras(cargas.map((c) => c.work_date as string)),
      total_amount: monto,
      currency: moneda,
      agreed_on: pagadoEl,
      notes: detallePagoHoras(minutos, tarifa, moneda),
    })
    .select("id")
    .single();
  if (errAcuerdo || !acuerdo) return { error: "No se pudo registrar el pago: probá de nuevo" };

  // Borrar el acuerdo deshace también el pago (on delete cascade) y libera las
  // horas (team_payment_id on delete set null).
  const deshacer = () => db.from("team_agreements").delete().eq("id", acuerdo.id);

  const { data: pago, error: errPago } = await db
    .from("team_payments")
    .insert({ agreement_id: acuerdo.id, amount: monto, paid_on: pagadoEl, method: medio, notes: `${cargas.length} cargas de horas` })
    .select("id")
    .single();
  if (errPago || !pago) {
    await deshacer();
    return { error: "No se pudo registrar el pago: probá de nuevo" };
  }

  const { data: marcadas, error: errMarca } = await db
    .from("time_entries")
    .update({ team_payment_id: pago.id })
    .in("id", ids)
    .eq("user_id", persona.user_id)
    .is("team_payment_id", null)
    .select("id");
  if (errMarca || (marcadas ?? []).length !== ids.length) {
    await deshacer();
    return { error: "Las horas cambiaron mientras se pagaban: recargá la página y probá de nuevo" };
  }

  revalidatePath("/landing-pages/horas");
  revalidatePath("/landing-pages/finanzas");
  revalidatePath("/landing-pages/mis-cobros");
  return { aviso: `Pago registrado: ${detallePagoHoras(minutos, tarifa, moneda)} = ${moneda} ${monto}` };
}
