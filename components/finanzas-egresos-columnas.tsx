import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { EstadoPagoPill } from "@/components/landing/ui";
import { Badge } from "@/components/tailgrids/core/badge";
import {
  codigoAcuerdo,
  formatearMonto,
  pendienteDePago,
  type AcuerdoEquipo,
} from "@/lib/landing/tipos";

const SIN_DATO = <span className="text-text-tertiary">—</span>;

/** Acuerdo, Para, Proyectos, Fecha, Monto, Pagado, Resta, Estado. */
export function crearColumnasEgresos(proyectoPor: Map<string, string>): ColumnDef<AcuerdoEquipo>[] {
  const nombresProyectos = (a: AcuerdoEquipo) =>
    a.project_ids.map((id) => proyectoPor.get(id)).filter((n): n is string => Boolean(n));

  return [
    {
      id: "title",
      header: "Acuerdo",
      accessorFn: (a) => a.numero,
      cell: ({ row }) => (
        <>
          <Link
            href={`/landing-pages/finanzas/acuerdo/${row.original.id}`}
            className="block font-medium text-text-primary hover:underline"
          >
            {row.original.title}
          </Link>
          <span className="text-xs tabular-nums text-text-tertiary">
            {codigoAcuerdo(row.original.numero)}
          </span>
        </>
      ),
    },
    {
      id: "member",
      header: "Para",
      accessorFn: (a) => a.member_name,
    },
    {
      id: "projects",
      header: "Proyectos",
      accessorFn: (a) => nombresProyectos(a)[0] ?? "",
      cell: ({ row }) => {
        const nombres = nombresProyectos(row.original);
        if (nombres.length === 0) return <span className="text-text-tertiary">Por horas</span>;
        return (
          <span title={nombres.join(" · ")} className="inline-flex items-center gap-1.5">
            <span className="truncate">{nombres[0]}</span>
            {nombres.length > 1 && (
              <Badge color="gray" size="sm" className="rounded-md px-1.5">
                +{nombres.length - 1}
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      id: "agreed_on",
      header: "Fecha",
      accessorFn: (a) => a.agreed_on ?? undefined,
      sortUndefined: 1,
      cell: ({ row }) =>
        row.original.agreed_on ? (
          <span className="tabular-nums">{row.original.agreed_on}</span>
        ) : (
          SIN_DATO
        ),
    },
    {
      id: "total",
      header: "Monto",
      accessorFn: (a) => a.total_amount ?? undefined,
      sortUndefined: 1,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatearMonto(row.original.total_amount, row.original.currency)}
        </span>
      ),
    },
    {
      id: "paid",
      header: "Pagado",
      accessorFn: (a) => a.amount_paid,
      cell: ({ row }) =>
        row.original.amount_paid > 0 ? (
          <span className="tabular-nums">
            {formatearMonto(row.original.amount_paid, row.original.currency)}
          </span>
        ) : (
          SIN_DATO
        ),
    },
    {
      id: "remaining",
      header: "Resta",
      accessorFn: (a) => pendienteDePago(a),
      cell: ({ row }) => {
        const resta = pendienteDePago(row.original);
        return resta > 0 ? (
          <span className="tabular-nums text-badge-warning-text">
            {formatearMonto(resta, row.original.currency)}
          </span>
        ) : (
          SIN_DATO
        );
      },
    },
    {
      id: "status",
      header: "Estado",
      enableSorting: false,
      cell: ({ row }) => <EstadoPagoPill estado={row.original.payment_status} />,
    },
  ];
}
