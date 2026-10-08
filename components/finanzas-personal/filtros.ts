import { matchesFinanceFilters, type FinanceRow } from "@/lib/personal-finance";
import type { FinanceQuery } from "./tipos";

type FilterEntity = "movement" | "schedule" | "obligation" | "account";

/**
 * La anulación es un timestamp aparte del estado de pago: los movimientos
 * anulados (y los compromisos cancelados) se ocultan salvo que se pidan.
 * `status=all` los incluye; `status=cancelled` muestra solo esos.
 */
export function visibleRow(row: FinanceRow, query: FinanceQuery, entity: FilterEntity) {
  const cancelled = entity === "movement" ? !!row.cancelled_at : row.status === "cancelled";
  if (query.status === "cancelled")
    return cancelled && matchesFinanceFilters(row, { ...query, status: "" }, entity);
  if (!query.status && cancelled) return false;
  return matchesFinanceFilters(
    row,
    query.status === "all" ? { ...query, status: "" } : query,
    entity,
  );
}
