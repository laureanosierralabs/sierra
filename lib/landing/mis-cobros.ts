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
  team_payments: (Omit<PagoRecibido, "amount"> & { amount: number | string })[] | null;
};

/** Acuerdos de la persona logueada, del más nuevo al más viejo. */
export async function misAcuerdos(): Promise<MiAcuerdo[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const { data, error } = await supabaseAdmin()
    .from("team_agreements")
    .select(
      "id, numero, title, total_amount, currency, amount_paid, payment_status, payment_terms, agreed_on, agreement_projects(projects(id, name)), team_payments(id, amount, paid_on, method)",
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
      .map((p) => ({ ...p, amount: Number(p.amount) }))
      .sort((a, b) => b.paid_on.localeCompare(a.paid_on)),
  }));
}

export interface TotalPorMoneda {
  moneda: Moneda;
  acordado: number;
  cobrado: number;
  pendiente: number;
}

/** Totales separados por moneda: sumar USD con ARS daría un número sin sentido. */
export function totalesPorMoneda(acuerdos: MiAcuerdo[]): TotalPorMoneda[] {
  const porMoneda = new Map<Moneda, TotalPorMoneda>();
  for (const a of acuerdos) {
    const t = porMoneda.get(a.currency) ?? { moneda: a.currency, acordado: 0, cobrado: 0, pendiente: 0 };
    t.acordado += a.total_amount ?? 0;
    t.cobrado += a.amount_paid;
    t.pendiente += Math.max((a.total_amount ?? 0) - a.amount_paid, 0);
    porMoneda.set(a.currency, t);
  }
  return [...porMoneda.values()];
}
