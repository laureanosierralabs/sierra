import type { ColumnDef } from "@tanstack/react-table";
import { signoDe, textoMontos } from "@/components/finanzas-montos";
import type { Mes } from "@/lib/landing/balance";
import { nombreMes } from "@/lib/landing/meses";

const COLOR_RESULTADO = {
  neg: "text-badge-error-text",
  pos: "text-badge-success-text",
  cero: "text-text-secondary",
} as const;

/** Mes, Ingresos cobrados, Equipo pagado, Gastos, Resultado real. */
export function crearColumnasBalance(): ColumnDef<Mes>[] {
  return [
    {
      id: "mes",
      header: "Mes",
      // El mes viene como AAAA-MM: ordenar por texto es ordenar por fecha.
      accessorFn: (m) => m.mes,
      cell: ({ row }) => (
        <span className="font-medium text-text-primary capitalize">{nombreMes(row.original.mes)}</span>
      ),
    },
    {
      id: "ingresos",
      header: "Ingresos cobrados",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums text-badge-success-text">
          {textoMontos(row.original.ingresos)}
        </span>
      ),
    },
    {
      id: "equipo",
      header: "Equipo pagado",
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{textoMontos(row.original.costosEquipo)}</span>,
    },
    {
      id: "gastos",
      header: "Gastos",
      enableSorting: false,
      cell: ({ row }) => <span className="tabular-nums">{textoMontos(row.original.gastos)}</span>,
    },
    {
      id: "resultado",
      header: "Resultado real",
      enableSorting: false,
      cell: ({ row }) => (
        <span className={`font-medium tabular-nums ${COLOR_RESULTADO[signoDe(row.original.resultado)]}`}>
          {textoMontos(row.original.resultado, true)}
        </span>
      ),
    },
  ];
}
