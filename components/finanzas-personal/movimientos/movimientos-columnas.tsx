import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/tailgrids/core/badge";
import { money, type FinanceRow } from "@/lib/personal-finance";
import { cn } from "@/utils/cn";
import { accountName, estadoMovimiento } from "../tipos";
import { MovimientoAcciones } from "./movimiento-acciones";

interface ColumnasOptions {
  accounts: FinanceRow[];
  onEdit: (row: FinanceRow) => void;
  onCancel: (row: FinanceRow) => void;
}

/** Fecha, concepto, categoría, cuenta, estado, monto (nativo + ≈ USD) y acciones. */
export function crearColumnasMovimientos({
  accounts,
  onEdit,
  onCancel,
}: ColumnasOptions): ColumnDef<FinanceRow>[] {
  return [
    {
      id: "fecha",
      header: "Fecha",
      accessorFn: (m) => String(m.fecha),
      cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{String(row.original.fecha)}</span>,
    },
    {
      id: "concepto",
      header: "Concepto",
      accessorFn: (m) => String(m.concepto),
      cell: ({ row }) => (
        <div className="min-w-40">
          <p className="font-medium text-text-primary">{String(row.original.concepto)}</p>
          {row.original.notas && (
            <p className="mt-0.5 line-clamp-1 text-xs text-text-tertiary">{String(row.original.notas)}</p>
          )}
        </div>
      ),
    },
    {
      id: "categoria",
      header: "Categoría",
      accessorFn: (m) => String(m.categoria ?? "Sin categoría"),
    },
    {
      id: "cuenta",
      header: "Cuenta",
      accessorFn: (m) => accountName(accounts, m.account_id),
      cell: ({ row }) => (
        <div>
          <p>{accountName(accounts, row.original.account_id)}</p>
          <p className="text-xs text-text-tertiary">{String(row.original.origin ?? "Personal")}</p>
        </div>
      ),
    },
    {
      id: "estado",
      header: "Estado",
      accessorFn: (m) => estadoMovimiento(m).label,
      cell: ({ row }) => {
        const estado = estadoMovimiento(row.original);
        return (
          <Badge size="sm" color={estado.color}>
            {estado.label}
          </Badge>
        );
      },
    },
    {
      // Ordena por USD histórico (comparable entre monedas). El facet "Moneda" filtra por `moneda`.
      id: "monto",
      header: "Monto",
      accessorFn: (m) => Number(m.usd_amount ?? 0),
      filterFn: (row, _columnId, value) => row.original.moneda === value,
      meta: { headerClassName: "text-right" },
      cell: ({ row }) => {
        const m = row.original;
        const incoming = m.tipo === "ingreso";
        return (
          <div className="text-right whitespace-nowrap tabular-nums">
            <p
              className={cn(
                "font-semibold",
                incoming ? "text-success-500" : "text-text-primary",
                m.cancelled_at && "text-text-tertiary line-through",
              )}
            >
              {incoming ? "+" : "−"}
              {money(m.monto, m.moneda)}
            </p>
            {m.moneda !== "USD" && (
              <p className="text-xs text-text-tertiary">
                ≈ {m.usd_amount === null ? "sin conversión" : money(m.usd_amount, "USD")}
                {m.exchange_rate ? ` · ARS/USD ${m.exchange_rate}` : ""}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <MovimientoAcciones row={row.original} onEdit={onEdit} onCancel={onCancel} />
        </div>
      ),
    },
  ];
}
