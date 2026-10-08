import "server-only";
import { auth } from "@clerk/nextjs/server";
import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import type { FinanceData, FinanceRow } from "./personal-finance";
import { fetchAllFinanceRows } from "./personal-finance";

export async function requireFinanceOwner(): Promise<string> {
  const { userId } = await auth();
  if (!userId || !(await accesoActual()).esOwner)
    throw new Error("No autorizado para finanzas personales.");
  return userId;
}
export async function loadPersonalFinance(): Promise<FinanceData> {
  const owner = await requireFinanceOwner();
  const db = supabaseAdmin();
  const tables = [
    "finance_accounts",
    "finance_categories",
    "finance_schedules",
    "finance_obligations",
    "finance_goals",
    "finance_goal_milestones",
    "finance_goal_contributions",
    "movements",
  ];
  const rows = await Promise.all(
    tables.map((t) =>
      fetchAllFinanceRows<FinanceRow>((from, to) => {
        let q = db.from(t).select("*").eq("owner_id", owner);
        if (t === "movements")
          q = q.eq("ambito", "personal").order("fecha", { ascending: false });
        // The unique key breaks all date/creation ties for stable page boundaries.
        return q.order("id", { ascending: true }).range(from, to);
      }),
    ),
  );
  const [rate, projects, contextProjects, units] = await Promise.all([
    db.from("exchange_rates").select("*").eq("owner_id", owner).maybeSingle(),
    db.from("projects").select("id,name").order("name"),
    db.from("context_projects").select("slug,nombre").order("nombre"),
    db.from("context_units").select("slug,nombre").order("nombre"),
  ]);
  if (rate.error || projects.error || contextProjects.error || units.error)
    throw new Error("No se pudieron cargar las referencias financieras.");
  const [
    accounts,
    categories,
    schedules,
    obligations,
    goals,
    milestones,
    contributions,
    movements,
  ] = rows;
  return {
    accounts,
    categories,
    schedules,
    obligations,
    goals,
    milestones,
    contributions,
    movements,
    rate: rate.data,
    projects: projects.data ?? [],
    contextProjects: contextProjects.data ?? [],
    units: units.data ?? [],
  };
}
export async function financeRpc(
  owner: string,
  entity: string,
  operation: string,
  data: Record<string, unknown>,
) {
  // Authentication is checked here as well as at every action boundary.
  if (owner !== (await requireFinanceOwner()))
    throw new Error("No autorizado.");
  const { data: result, error } = await supabaseAdmin().rpc("finance_mutate", {
    p_owner: owner,
    p_entity: entity,
    p_operation: operation,
    p_data: data,
  });
  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
  return result;
}
