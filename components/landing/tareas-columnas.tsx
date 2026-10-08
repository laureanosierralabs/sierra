import Link from "next/link";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { BorrarTarea } from "@/components/landing/borrar";
import { EstadoSelect } from "@/components/landing/estado-select";
import { TareaForm } from "@/components/landing/tarea-form";
import { Prioridad, Vencimiento } from "@/components/landing/ui";
import {
  ESTADOS_TAREA,
  PRIORIDADES,
  type Miembro,
  type Proyecto,
  type Tarea,
} from "@/lib/landing/tipos";

const SIN_DATO = <span className="text-text-tertiary">—</span>;

/** Ordena por la posición en la lista de valores, no alfabéticamente. */
function ordenPor<T extends string>(valores: readonly T[], clave: (t: Tarea) => T) {
  return (a: Row<Tarea>, b: Row<Tarea>) =>
    valores.indexOf(clave(a.original)) - valores.indexOf(clave(b.original));
}

interface OpcionesColumnas {
  /** Dentro de un proyecto la columna Proyecto sobra, y borrar revalida ese proyecto. */
  proyectoActual?: string;
}

/** Mismas columnas que la tabla anterior: Tarea, Proyecto, Responsable, Estado, Prioridad, Deadline. */
export function crearColumnasTareas(
  proyectos: Pick<Proyecto, "id" | "name">[],
  miembros: Miembro[],
  { proyectoActual }: OpcionesColumnas = {},
): ColumnDef<Tarea>[] {
  const nombrePor = new Map(miembros.map((m) => [m.id, m.nombre]));
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));

  return [
    {
      id: "title",
      header: "Tarea",
      accessorFn: (t) => t.title,
      cell: ({ row }) => (
        <Link
          href={`/landing-pages/tasks/${row.original.id}`}
          className="font-medium text-text-primary hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    ...(proyectoActual
      ? []
      : [
          {
            id: "project",
            header: "Proyecto",
            accessorFn: (t: Tarea) =>
              t.project_id ? (proyectoPor.get(t.project_id) ?? "") : "",
            cell: ({ getValue }: { getValue: () => unknown }) =>
              (getValue() as string) || SIN_DATO,
          } satisfies ColumnDef<Tarea>,
        ]),
    {
      id: "assignee",
      header: "Responsable",
      accessorFn: (t) =>
        t.assignee_ids
          .map((id) => nombrePor.get(id))
          .filter((n): n is string => Boolean(n))
          .join(", "),
      cell: ({ getValue }) => getValue<string>() || SIN_DATO,
    },
    {
      id: "status",
      header: "Estado",
      accessorFn: (t) => t.status,
      sortingFn: ordenPor(ESTADOS_TAREA, (t) => t.status),
      cell: ({ row }) => (
        <EstadoSelect id={row.original.id} valor={row.original.status} tipo="tarea" />
      ),
    },
    {
      id: "priority",
      header: "Prioridad",
      accessorFn: (t) => t.priority,
      sortingFn: ordenPor(PRIORIDADES, (t) => t.priority),
      cell: ({ row }) => <Prioridad prioridad={row.original.priority} />,
    },
    {
      id: "due_date",
      header: "Deadline",
      accessorFn: (t) => t.due_date ?? undefined,
      sortUndefined: 1,
      cell: ({ row }) => (
        <Vencimiento
          fecha={row.original.due_date}
          cerrado={row.original.status === "completada"}
        />
      ),
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex items-center justify-end gap-3">
          <TareaForm miembros={miembros} proyectos={proyectos} tarea={row.original} />
          <BorrarTarea id={row.original.id} projectId={proyectoActual} />
        </span>
      ),
    },
  ];
}
