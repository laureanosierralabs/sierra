import type { ColumnDef } from "@tanstack/react-table";
import { BorrarGastoFijo } from "@/components/landing/borrar";
import { GastoForm } from "@/components/landing/gasto-form";
import { Badge } from "@/components/tailgrids/core/badge";
import {
  LABEL_CATEGORIA_GASTO,
  LABEL_PERIODO,
  costoMensual,
  formatearMonto,
  gastoVigente,
  type GastoFijo,
} from "@/lib/landing/tipos";
import { cn } from "@/utils/cn";

/** Gasto, Categoría, Monto, Periodicidad, Por mes. `hoy` es AAAA-MM. */
export function crearColumnasGastos(hoy: string): ColumnDef<GastoFijo>[] {
  // Un gasto dado de baja sigue en la lista, pero apagado: ya no pesa.
  const apagado = (g: GastoFijo) => !gastoVigente(g, hoy);

  return [
    {
      id: "name",
      header: "Gasto",
      accessorFn: (g) => g.name,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2">
          <span
            className={cn(
              "font-medium",
              apagado(row.original) ? "text-text-tertiary" : "text-text-primary",
            )}
          >
            {row.original.name}
          </span>
          {apagado(row.original) && row.original.period !== "once" && (
            <Badge color="gray" size="sm" className="rounded-md px-1.5">
              Dado de baja
            </Badge>
          )}
        </span>
      ),
    },
    {
      id: "category",
      header: "Categoría",
      accessorFn: (g) => LABEL_CATEGORIA_GASTO[g.category],
    },
    {
      id: "amount",
      header: "Monto",
      accessorFn: (g) => g.amount,
      cell: ({ row }) => (
        <span className={cn("tabular-nums", apagado(row.original) && "text-text-tertiary")}>
          {formatearMonto(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      id: "period",
      header: "Periodicidad",
      accessorFn: (g) => LABEL_PERIODO[g.period],
    },
    {
      id: "monthly",
      header: "Por mes",
      accessorFn: (g) => (g.period === "once" ? undefined : costoMensual(g)),
      sortUndefined: 1,
      // Un gasto único no se prorratea: no se repite.
      cell: ({ row }) =>
        row.original.period === "once" ? (
          <span className="text-text-tertiary">—</span>
        ) : (
          <span className={cn("tabular-nums", apagado(row.original) && "text-text-tertiary")}>
            {formatearMonto(costoMensual(row.original), row.original.currency)}
          </span>
        ),
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex items-center justify-end gap-3">
          <GastoForm gasto={row.original} />
          <BorrarGastoFijo id={row.original.id} />
        </span>
      ),
    },
  ];
}
