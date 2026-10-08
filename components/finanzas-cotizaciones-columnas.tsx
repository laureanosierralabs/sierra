import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { EstadoCotizacionPill, EstadoPagoPill } from "@/components/landing/ui";
import { Badge } from "@/components/tailgrids/core/badge";
import {
  codigoCotizacion,
  esCuentaPorCobrar,
  formatearMonto,
  pendienteDeCobro,
  type Cotizacion,
} from "@/lib/landing/tipos";

const SIN_DATO = <span className="text-text-tertiary">—</span>;

interface DatosColumnas {
  /** Cliente que paga: se muestra la empresa si la tiene. */
  nombrePor: Map<string, string>;
  proyectoPor: Map<string, string>;
}

/** Cliente, Cotización, Proyectos, Total, Cobrado, Pendiente, Estado. */
export function crearColumnasFinanzasCotizaciones({
  nombrePor,
  proyectoPor,
}: DatosColumnas): ColumnDef<Cotizacion>[] {
  const nombresProyectos = (q: Cotizacion) =>
    q.project_ids.map((id) => proyectoPor.get(id)).filter((n): n is string => Boolean(n));

  return [
    {
      id: "client",
      header: "Cliente",
      accessorFn: (q) => (q.client_id ? (nombrePor.get(q.client_id) ?? "") : ""),
      cell: ({ row }) => {
        const { client_id } = row.original;
        if (!client_id) return SIN_DATO;
        return (
          <Link href={`/landing-pages/clients/${client_id}`} className="hover:underline">
            {nombrePor.get(client_id) ?? "—"}
          </Link>
        );
      },
    },
    {
      id: "title",
      header: "Cotización",
      accessorFn: (q) => q.numero,
      cell: ({ row }) => (
        <>
          <Link
            href={`/landing-pages/quotes/${row.original.id}`}
            className="block font-medium text-text-primary hover:underline"
          >
            {row.original.title}
          </Link>
          <span className="text-xs tabular-nums text-text-tertiary">
            {codigoCotizacion(row.original.numero)}
          </span>
        </>
      ),
    },
    {
      id: "projects",
      header: "Proyectos",
      accessorFn: (q) => nombresProyectos(q)[0] ?? "",
      cell: ({ row }) => {
        const nombres = nombresProyectos(row.original);
        if (nombres.length === 0) return SIN_DATO;
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
      id: "total",
      header: "Total",
      accessorFn: (q) => q.total_amount ?? undefined,
      sortUndefined: 1,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatearMonto(row.original.total_amount, row.original.currency)}
        </span>
      ),
    },
    {
      id: "paid",
      header: "Cobrado",
      accessorFn: (q) => q.amount_paid,
      cell: ({ row }) =>
        row.original.amount_paid > 0 ? (
          <span className="tabular-nums text-badge-success-text">
            {formatearMonto(row.original.amount_paid, row.original.currency)}
          </span>
        ) : (
          SIN_DATO
        ),
    },
    {
      id: "pending",
      header: "Pendiente",
      accessorFn: (q) => pendienteDeCobro(q),
      cell: ({ row }) => {
        const pendiente = pendienteDeCobro(row.original);
        if (pendiente <= 0) return SIN_DATO;
        return (
          <span
            className={`tabular-nums ${
              esCuentaPorCobrar(row.original) ? "text-badge-warning-text" : "text-text-tertiary"
            }`}
          >
            {formatearMonto(pendiente, row.original.currency)}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Estado",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <EstadoCotizacionPill estado={row.original.commercial_status} />
          <EstadoPagoPill estado={row.original.payment_status} />
        </span>
      ),
    },
  ];
}
