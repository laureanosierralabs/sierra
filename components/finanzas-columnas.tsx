import type { ColumnDef } from "@tanstack/react-table";
import { BorrarMovimiento } from "@/components/borrar-movimiento";
import { CAT_LABEL, fmt } from "@/components/finanzas-formato";
import { MovimientoForm } from "@/components/movimiento-form";
import { Badge } from "@/components/tailgrids/core/badge";
import type { Ambito, EstadoMov, Movimiento } from "@/lib/finanzas";
import { cn } from "@/utils/cn";

type Tono = NonNullable<React.ComponentProps<typeof Badge>["color"]>;

const TONO_ESTADO: Record<EstadoMov, Tono> = {
  pagado: "gray",
  cobrado: "success",
  pendiente: "warning",
};

const LABEL_ESTADO: Record<EstadoMov, string> = {
  pagado: "Pagado",
  cobrado: "Cobrado",
  pendiente: "Pendiente",
};

/** Fecha, Concepto, Categoría, Estado, Monto y acciones. */
export function crearColumnasMovimientos(ambito: Ambito): ColumnDef<Movimiento>[] {
  return [
    {
      id: "fecha",
      header: "Fecha",
      accessorFn: (m) => m.fecha,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-secondary tabular-nums">
          {row.original.fecha}
        </span>
      ),
    },
    {
      id: "concepto",
      header: "Concepto",
      accessorFn: (m) => m.concepto,
      cell: ({ row }) => (
        <>
          <span>{row.original.concepto}</span>
          {row.original.persona && (
            <span className="ml-2 text-xs text-text-tertiary">{row.original.persona}</span>
          )}
        </>
      ),
    },
    {
      id: "categoria",
      header: "Categoría",
      accessorFn: (m) => CAT_LABEL[m.categoria] ?? m.categoria,
      cell: ({ getValue }) => <span className="text-text-secondary">{getValue<string>()}</span>,
    },
    {
      id: "estado",
      header: "Estado",
      accessorFn: (m) => m.estado,
      cell: ({ row }) => (
        <Badge color={TONO_ESTADO[row.original.estado] ?? "gray"}>
          {LABEL_ESTADO[row.original.estado] ?? row.original.estado}
        </Badge>
      ),
    },
    {
      id: "monto",
      header: "Monto",
      accessorFn: (m) => (m.tipo === "ingreso" ? m.monto : -m.monto),
      meta: { headerClassName: "text-right" },
      cell: ({ row }) => {
        const m = row.original;
        return (
          <span
            className={cn(
              "block text-right font-semibold whitespace-nowrap tabular-nums",
              m.tipo === "ingreso" ? "text-badge-success-text" : "text-badge-error-text",
            )}
          >
            {m.tipo === "ingreso" ? "+" : "−"}
            {fmt(m.monto, m.moneda)}
          </span>
        );
      },
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-3">
          <MovimientoForm ambito={ambito} movimiento={row.original} />
          <BorrarMovimiento id={row.original.id} ambito={ambito} />
        </div>
      ),
    },
  ];
}
