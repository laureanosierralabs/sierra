import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { EstadoProyectoPill, Vencimiento } from "@/components/landing/ui";
import { ESTADOS_PROYECTO, type EstadoProyecto } from "@/lib/landing/tipos";

/** Fila ya resuelta en el servidor: nombres en lugar de ids. */
export interface ProyectoInicio {
  id: string;
  name: string;
  cliente: string;
  status: EstadoProyecto;
  responsables: string;
  due_date: string | null;
}

const SIN_DATO = <span className="text-text-tertiary">—</span>;

/** Proyecto, Cliente, Estado, Responsable, Entrega. */
export function crearColumnasInicioProyectos(): ColumnDef<ProyectoInicio>[] {
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
      accessorFn: (p) => p.cliente,
      cell: ({ getValue }) => getValue<string>() || SIN_DATO,
    },
    {
      id: "status",
      header: "Estado",
      accessorFn: (p) => p.status,
      sortingFn: (a, b) =>
        ESTADOS_PROYECTO.indexOf(a.original.status) - ESTADOS_PROYECTO.indexOf(b.original.status),
      cell: ({ row }) => <EstadoProyectoPill estado={row.original.status} />,
    },
    {
      id: "assignee",
      header: "Responsable",
      accessorFn: (p) => p.responsables,
      cell: ({ getValue }) => getValue<string>() || SIN_DATO,
    },
    {
      id: "due_date",
      header: "Entrega",
      accessorFn: (p) => p.due_date ?? undefined,
      sortUndefined: 1,
      cell: ({ row }) => (
        <Vencimiento fecha={row.original.due_date} cerrado={row.original.status === "entregado"} />
      ),
    },
  ];
}
