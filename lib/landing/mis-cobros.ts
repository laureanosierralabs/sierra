import "server-only";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/landing/supabase";
import type { EstadoPago, Moneda } from "@/lib/landing/tipos";

/**
 * Lo que una persona del equipo cobra: sus acuerdos y los pagos recibidos.
 *
 * El filtro es SIEMPRE la cuenta de la sesión, leída acá: nunca un id que
 * venga de la página. Así nadie puede ver los cobros de otro, ni siquiera
 * armando la URL o la llamada a mano. Las notas del acuerdo no se exponen:
 * son anotaciones internas de quien paga.
 */

export interface PagoRecibido {
  id: string;
  amount: number;
  paid_on: string;
  method: string | null;
  /** Horas que cubrió este pago (Horas → pagadas); null si no viene de horas cargadas. */
  horas: { minutos: number; desde: string; hasta: string } | null;
}

export interface MiAcuerdo {
  id: string;
  numero: number;
  title: string;
  total_amount: number | null;
  currency: Moneda;
  amount_paid: number;
  payment_status: Exclude<EstadoPago, "not_applicable">;
  payment_terms: string | null;
  agreed_on: string | null;
  proyectos: { id: string; name: string }[];
  pagos: PagoRecibido[];
}

type Fila = Omit<MiAcuerdo, "proyectos" | "pagos" | "total_amount" | "amount_paid"> & {
  total_amount: number | string | null;
  amount_paid: number | string;
  agreement_projects: { projects: { id: string; name: string } | { id: string; name: string }[] | null }[] | null;
  team_payments:
    | (Omit<PagoRecibido, "amount" | "horas"> & {
        amount: number | string;
        time_entries: { minutes: number | string; work_date: string }[] | null;
      })[]
    | null;
};

function horasDelPago(filas: { minutes: number | string; work_date: string }[] | null): PagoRecibido["horas"] {
  if (!filas || filas.length === 0) return null;
  const dias = filas.map((f) => f.work_date).sort();
  return {
    minutos: filas.reduce((t, f) => t + Number(f.minutes), 0),
    desde: dias[0],
    hasta: dias[dias.length - 1],
  };
}

/** Acuerdos de la persona logueada, del más nuevo al más viejo. */
export async function misAcuerdos(): Promise<MiAcuerdo[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const { data, error } = await supabaseAdmin()
    .from("team_agreements")
    .select(
      "id, numero, title, total_amount, currency, amount_paid, payment_status, payment_terms, agreed_on, agreement_projects(projects(id, name)), team_payments(id, amount, paid_on, method, time_entries(minutes, work_date))",
    )
    .eq("member_user_id", userId)
    .order("numero", { ascending: false });

  if (error) throw new Error("No se pudieron leer tus cobros");

  return ((data ?? []) as unknown as Fila[]).map((f) => ({
    id: f.id,
    numero: f.numero,
    title: f.title,
    total_amount: f.total_amount === null ? null : Number(f.total_amount),
    currency: f.currency,
    amount_paid: Number(f.amount_paid),
    payment_status: f.payment_status,
    payment_terms: f.payment_terms,
    agreed_on: f.agreed_on,
    proyectos: (f.agreement_projects ?? [])
      .map((v) => (Array.isArray(v.projects) ? v.projects[0] : v.projects))
      .filter((p): p is { id: string; name: string } => Boolean(p)),
    pagos: (f.team_payments ?? [])
      .map(({ time_entries, ...p }) => ({ ...p, amount: Number(p.amount), horas: horasDelPago(time_entries) }))
      .sort((a, b) => b.paid_on.localeCompare(a.paid_on)),
  }));
}
