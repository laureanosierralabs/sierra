import Link from "next/link";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { BorrarProyecto } from "@/components/landing/borrar";
import { DuplicarProyecto } from "@/components/landing/duplicar-proyecto";
import { EstadoSelect } from "@/components/landing/estado-select";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { Prioridad, TipoPaginaBadge, Vencimiento } from "@/components/landing/ui";
import type { ResumenCotizado } from "@/lib/landing/datos";
import {
  ESTADOS_PROYECTO,
  PRIORIDADES,
  formatearMonto,
  nombreCliente,
  type Cliente,
  type Miembro,
  type Proyecto,
} from "@/lib/landing/tipos";

const SIN_DATO = <span className="text-text-tertiary">—</span>;

/** Ordena por la posición en la lista de valores, no alfabéticamente. */
function ordenPor<T extends string>(valores: readonly T[], clave: (p: Proyecto) => T) {
  return (a: Row<Proyecto>, b: Row<Proyecto>) =>
    valores.indexOf(clave(a.original)) - valores.indexOf(clave(b.original));
}

interface DatosColumnas {
  clientes: Cliente[];
  miembros: Miembro[];
  clientePor: Map<string, string>;
  nombreMiembro: Map<string, string>;
  cotizado: Map<string, ResumenCotizado>;
  /** La columna de cotización solo existe para el owner. */
  verCotizacion: boolean;
}

/** Proyecto, Cliente, Tipo, Estado, Responsable, [Cotización], Deadline, Prioridad. */
export function crearColumnasProyectos({
  clientes,
  miembros,
  clientePor,
  nombreMiembro,
  cotizado,
  verCotizacion,
}: DatosColumnas): ColumnDef<Proyecto>[] {
  const columnaCotizacion: ColumnDef<Proyecto>[] = verCotizacion
    ? [
        {
          id: "quote",
          header: "Cotización",
          accessorFn: (p) => cotizado.get(p.id)?.total ?? undefined,
          sortUndefined: 1,
          cell: ({ row }) => {
            const c = cotizado.get(row.original.id);
            return c ? (
              <span className="tabular-nums">{formatearMonto(c.total, c.currency)}</span>
            ) : (
              SIN_DATO
            );
          },
        },
      ]
    : [];

  return [
    {
      id: "name",
      header: "Proyecto",
      accessorFn: (p) => p.name,
      cell: ({ row }) => (
        <Link
          href={`/landing-pages/projects/${row.original.id}`}
          className="font-medium text-text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "client",
      header: "Cliente",
      accessorFn: (p) => nombreCliente(p, clientePor) ?? "",
      cell: ({ getValue }) => getValue<string>() || SIN_DATO,
    },
    {
      id: "page_type",
      header: "Tipo",
      accessorFn: (p) => p.page_type ?? "",
      cell: ({ row }) =>
        row.original.page_type ? <TipoPaginaBadge tipo={row.original.page_type} /> : SIN_DATO,
    },
    {
      id: "status",
      header: "Estado",
      accessorFn: (p) => p.status,
      sortingFn: ordenPor(ESTADOS_PROYECTO, (p) => p.status),
      cell: ({ row }) => (
        <EstadoSelect id={row.original.id} valor={row.original.status} tipo="proyecto" />
      ),
    },
    {
      id: "assignee",
      header: "Responsable",
      accessorFn: (p) =>
        p.assignee_ids
          .map((id) => nombreMiembro.get(id))
          .filter((n): n is string => Boolean(n))
          .join(", "),
      cell: ({ getValue }) => getValue<string>() || SIN_DATO,
    },
    ...columnaCotizacion,
    {
      id: "due_date",
      header: "Deadline",
      accessorFn: (p) => p.due_date ?? undefined,
      sortUndefined: 1,
      cell: ({ row }) => (
        <Vencimiento
          fecha={row.original.due_date}
          cerrado={row.original.status === "entregado"}
        />
      ),
    },
    {
      id: "priority",
      header: "Prioridad",
      accessorFn: (p) => p.priority,
      sortingFn: ordenPor(PRIORIDADES, (p) => p.priority),
      cell: ({ row }) => <Prioridad prioridad={row.original.priority} />,
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex items-center justify-end gap-3">
          <ProyectoForm miembros={miembros} clientes={clientes} proyecto={row.original} />
          <DuplicarProyecto id={row.original.id} />
          <BorrarProyecto id={row.original.id} />
        </span>
      ),
    },
  ];
}
