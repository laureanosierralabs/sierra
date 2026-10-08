"use server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { financeRpc, requireFinanceOwner } from "@/lib/personal-finance-server";
import {
  entityFields,
  parseEntity,
  parseMoney,
  today,
  validDate,
  preservedHistoricalQuote,
  type FinanceRow,
  type Entity,
} from "@/lib/personal-finance";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
async function historicalQuote(
  owner: string,
  fd: FormData,
  currency: string,
  date: string,
) {
  if (currency === "USD")
    return { exchange_rate: null, exchange_quoted_at: null };
  const explicit = text(fd, "exchange_rate");
  if (text(fd, "entity") === "movement" && text(fd, "id")) {
    const { data: existing, error } = await supabaseAdmin()
      .from("movements")
      .select("id,owner_id,moneda,fecha,exchange_rate,exchange_quoted_at")
      .eq("owner_id", owner)
      .eq("ambito", "personal")
      .eq("id", text(fd, "id"))
      .maybeSingle();
    if (error || !existing)
      throw new Error("Movimiento personal no encontrado.");
    const preserved = preservedHistoricalQuote(
      existing as FinanceRow,
      currency,
      date,
      explicit,
    );
    if (preserved) return preserved;
  }
  if (explicit) {
    const rate = Number(explicit.replace(",", "."));
    if (!Number.isFinite(rate) || rate <= 0 || rate > 1000000000)
      throw new Error("Cotización inválida.");
    return {
      exchange_rate: rate,
      // Manual historical rate is recorded now; no provider observation time is invented.
      exchange_quoted_at: new Date().toISOString(),
    };
  }
  if (date !== today())
    throw new Error(
      "Para ARS con fecha anterior o futura, indicar la cotización histórica.",
    );
  const { data, error } = await supabaseAdmin()
    .from("exchange_rates")
    .select("*")
    .eq("owner_id", owner)
    .maybeSingle();
  if (
    error ||
    !data?.rate ||
    !data.quoted_at ||
    (!data.manual && Date.now() - Date.parse(data.quoted_at) > 3600000)
  )
    throw new Error(
      "Actualizar cotización o indicar una cotización manual para este movimiento.",
    );
  return {
    exchange_rate: Number(data.rate),
    exchange_quoted_at: data.quoted_at,
  };
}
export async function mutateFinance(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const owner = await requireFinanceOwner();
    const entity = text(fd, "entity") as Entity;
    const operation = text(fd, "operation") || "save";
    if (
      !["movement", ...Object.keys(entityFields)].includes(entity) ||
      !["save", "delete", "pay", "cancel"].includes(operation)
    )
      throw new Error("Operación inválida.");
    let data: Record<string, unknown> = { id: text(fd, "id") || undefined };
    if (["delete", "cancel"].includes(operation)) {
      if (!data.id || text(fd, "confirmed") !== "yes")
        throw new Error("Confirmar la operación.");
    } else if (entity === "movement" || operation === "pay") {
      const currency = text(fd, "moneda");
      const date = text(fd, "fecha");
      if (!["USD", "ARS"].includes(currency) || !validDate(date))
        throw new Error("Moneda o fecha inválida.");
      data = {
        ...data,
        monto: parseMoney(text(fd, "monto")),
        moneda: currency,
        fecha: date,
        account_id: text(fd, "account_id"),
        request_id: text(fd, "request_id") || undefined,
        ...(await historicalQuote(owner, fd, currency, date)),
      };
      if (operation === "pay") {
        if (!["obligation", "schedule"].includes(entity))
          throw new Error("Pago inválido.");
        data[entity === "obligation" ? "obligation_id" : "schedule_id"] = text(
          fd,
          "linked_id",
        );
      } else {
        const concept = text(fd, "concepto");
        const category = text(fd, "categoria");
        const type = text(fd, "tipo");
        const status =
          text(fd, "estado") || (type === "ingreso" ? "cobrado" : "pagado");
        if (
          !concept ||
          concept.length > 160 ||
          !category ||
          category.length > 120 ||
          !["ingreso", "egreso"].includes(type) ||
          !["pendiente", "pagado", "cobrado"].includes(status)
        )
          throw new Error("Completar concepto, categoría y tipo válidos.");
        data = {
          ...data,
          concepto: concept,
          categoria: category,
          tipo: type,
          estado: status,
          notas: text(fd, "notas") || null,
          origin: text(fd, "origin") || "Personal",
          recurring: fd.get("recurring") === "on",
          related_business: text(fd, "related_business") || null,
          related_project: text(fd, "related_project") || null,
          related_context_project: text(fd, "related_context_project") || null,
        };
      }
    } else
      data = {
        ...data,
        ...parseEntity(entity as Exclude<Entity, "movement">, fd),
        ...(["account", "contribution"].includes(entity)
          ? { request_id: text(fd, "request_id") || undefined }
          : {}),
      };
    await financeRpc(owner, entity, operation, data);
    revalidatePath("/finanzas/personal");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo guardar.",
    };
  }
}
export async function seedFinance(): Promise<{ ok: boolean; error?: string }> {
  try {
    const owner = await requireFinanceOwner();
    const expected =
      process.env.FINANCE_INITIAL_OWNER_ID ??
      "user_3Jhi2ofDzdnN0wrxodZ3KGFja8S";
    if (owner !== expected)
      throw new Error("La carga inicial corresponde solamente a Laureano.");
    const { error } = await supabaseAdmin().rpc("finance_seed_initial", {
      p_owner: owner,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/finanzas/personal");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo inicializar.",
    };
  }
}
export async function updateFinanceRate(
  fd: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const owner = await requireFinanceOwner();
    const db = supabaseAdmin();
    const mode = text(fd, "mode");
    const { data: previous, error: readError } = await db
      .from("exchange_rates")
      .select("*")
      .eq("owner_id", owner)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (mode === "refresh" && previous?.manual)
      throw new Error(
        "El override manual sigue activo. Desactivarlo explícitamente para usar la API.",
      );
    let rate: number;
    let quotedAt: string;
    let source: string;
    if (mode === "manual") {
      rate = Number(text(fd, "rate").replace(",", "."));
      if (!Number.isFinite(rate) || rate <= 0 || rate > 1000000000)
        throw new Error("Cotización inválida.");
      quotedAt = new Date().toISOString();
      source = "Manual";
    } else if (mode === "refresh" || mode === "automatic") {
      // Provider adapter: ARS per USD, MEP selling price. No paid service/key.
      const response = await fetch("https://dolarapi.com/v1/dolares/bolsa", {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok)
        throw new Error(
          "Proveedor de cotización no disponible. Se conserva la última cotización.",
        );
      const quote = await response.json();
      rate = Number(quote.venta);
      quotedAt = String(quote.fechaActualizacion);
      source = "DolarAPI · MEP venta";
      const timestamp = Date.parse(quotedAt);
      if (
        !Number.isFinite(rate) ||
        rate <= 0 ||
        !Number.isFinite(timestamp) ||
        timestamp > Date.now() + 300000
      )
        throw new Error("Respuesta de cotización inválida.");
    } else throw new Error("Modo de cotización inválido.");
    const { error } = await db.from("exchange_rates").upsert({
      owner_id: owner,
      rate,
      quoted_at: quotedAt,
      source,
      manual: mode === "manual",
      updated_at: new Date().toISOString(),
      seed_version: previous?.seed_version ?? 0,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/finanzas/personal");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la cotización. Se conserva la anterior.",
    };
  }
}
