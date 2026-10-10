import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { BorrarCotizacion } from "@/components/landing/borrar";
import { CotizacionForm } from "@/components/landing/cotizacion-form";
import { DuplicarCotizacion } from "@/components/landing/duplicar-cotizacion";
import { EnlaceBoton } from "@/components/landing/enlace-boton";
import { EstadoSelect } from "@/components/landing/estado-select";
import { EstadoPagoPill } from "@/components/landing/ui";
import { Badge } from "@/components/tailgrids/core/badge";
import {
  ESTADOS_COTIZACION,
  ESTADOS_PAGO,
  codigoCotizacion,
  fechaCorta,
  fechaCotizacion,
  formatearMonto,
  pendienteDeCobro,
  type Cliente,
  type Cotizacion,
  type Proyecto,
} from "@/lib/landing/tipos";

const SIN_DATO = <span className="text-text-tertiary">—</span>;

interface DatosColumnas {
  clientes: Cliente[];
  proyectos: Proyecto[];
  nombrePor: Map<string, string>;
  proyectoPor: Map<string, string>;
}

/** Cotización, Fecha, Cliente, Proyectos, Total, Estado, Pago, Pendiente, Documento. */
export function crearColumnasCotizaciones({
  clientes,
  proyectos,
  nombrePor,
  proyectoPor,
}: DatosColumnas): ColumnDef<Cotizacion>[] {
  const nombresProyectos = (q: Cotizacion) =>
    q.project_ids.map((id) => proyectoPor.get(id)).filter((n): n is string => Boolean(n));

  return [
    {
      id: "title",
      header: "Cotización",
      // El valor es texto para que el buscador encuentre por título o código;
      // el orden sigue siendo por número.
      accessorFn: (q) => `${q.title} ${codigoCotizacion(q.numero)}`,
      sortingFn: (a, b) => a.original.numero - b.original.numero,
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
      id: "date",
      header: "Fecha",
      // AAAA-MM-DD ordena bien como texto.
      accessorFn: (q) => fechaCotizacion(q),
      cell: ({ getValue }) => (
        <span className="tabular-nums text-text-secondary">{fechaCorta(getValue<string>())}</span>
      ),
    },
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
      id: "projects",
      header: "Proyectos",
      accessorFn: (q) => nombresProyectos(q)[0] ?? "",
      // Con varios proyectos se nombra el primero y se cuenta el resto: la
      // lista entera no entra sin romper la tabla.
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
      id: "status",
      header: "Estado",
      accessorFn: (q) => q.commercial_status,
      sortingFn: (a, b) =>
        ESTADOS_COTIZACION.indexOf(a.original.commercial_status) -
        ESTADOS_COTIZACION.indexOf(b.original.commercial_status),
      cell: ({ row }) => (
        <EstadoSelect id={row.original.id} valor={row.original.commercial_status} tipo="cotizacion" />
      ),
    },
    {
      // El pago no se edita acá: sale de los cobros registrados, y tocarlo a
      // mano lo pondría en desacuerdo con el historial.
      id: "payment",
      header: "Pago",
      accessorFn: (q) => q.payment_status,
      sortingFn: (a, b) =>
        ESTADOS_PAGO.indexOf(a.original.payment_status) -
        ESTADOS_PAGO.indexOf(b.original.payment_status),
      cell: ({ row }) => <EstadoPagoPill estado={row.original.payment_status} />,
    },
    {
      id: "pending",
      header: "Pendiente",
      accessorFn: (q) => pendienteDeCobro(q),
      cell: ({ row }) => {
        const pendiente = pendienteDeCobro(row.original);
        return pendiente > 0 ? (
          <span className="tabular-nums text-badge-warning-text">
            {formatearMonto(pendiente, row.original.currency)}
          </span>
        ) : (
          SIN_DATO
        );
      },
    },
    {
      id: "document",
      header: "Documento",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.proposal_url ? (
          <EnlaceBoton href={row.original.proposal_url} externo className="px-2 py-1 text-xs">
            Ver cotización
          </EnlaceBoton>
        ) : (
          SIN_DATO
        ),
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex items-center justify-end gap-3">
          <CotizacionForm clientes={clientes} proyectos={proyectos} cotizacion={row.original} />
          <DuplicarCotizacion id={row.original.id} />
          <BorrarCotizacion id={row.original.id} />
        </span>
      ),
    },
  ];
}
