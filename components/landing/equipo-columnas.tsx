import type { ColumnDef } from "@tanstack/react-table";
import { EditarAcceso, QuitarMiembro } from "@/components/landing/equipo-gestion";
import { Avatar, AvatarFallback } from "@/components/tailgrids/core/avatar";
import { Badge } from "@/components/tailgrids/core/badge";
import type { MiembroDetalle } from "@/lib/landing/auth";
import { DEFINICIONES } from "@/lib/unidades";

const SIN_DATO = <span className="text-text-tertiary">—</span>;

interface DatosColumnas {
  /** Editar y quitar son del owner; para un member la columna no existe. */
  esOwner: boolean;
  proyectosPor: Map<string, number>;
  tareasPor: Map<string, number>;
}

function nombreUnidades(m: MiembroDetalle): string {
  return m.rol === "owner" ? "Todas" : m.unidades.map((u) => DEFINICIONES[u].nombre).join(", ");
}

/** Nombre, Email, Rol, Unidades, Proyectos activos, Tareas pendientes, [Acciones]. */
export function crearColumnasEquipo({
  esOwner,
  proyectosPor,
  tareasPor,
}: DatosColumnas): ColumnDef<MiembroDetalle>[] {
  const columnaAcciones: ColumnDef<MiembroDetalle>[] = esOwner
    ? [
        {
          id: "acciones",
          header: () => <span className="sr-only">Acciones</span>,
          enableSorting: false,
          cell: ({ row }) => (
            <span className="flex items-center justify-end gap-3">
              <EditarAcceso miembro={row.original} />
              <QuitarMiembro id={row.original.id} />
            </span>
          ),
        },
      ]
    : [];

  return [
    {
      id: "name",
      header: "Nombre",
      accessorFn: (m) => m.nombre,
      cell: ({ row }) => (
        <span className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{row.original.nombre.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-text-primary">{row.original.nombre}</span>
        </span>
      ),
    },
    {
      id: "email",
      header: "Email",
      accessorFn: (m) => m.email ?? "",
      cell: ({ getValue }) => getValue<string>() || SIN_DATO,
    },
    {
      id: "role",
      header: "Rol",
      accessorFn: (m) => m.rol,
      cell: ({ row }) =>
        row.original.rol === "owner" ? (
          <Badge color="blue">Owner</Badge>
        ) : (
          <Badge color="gray">Builder</Badge>
        ),
    },
    {
      id: "units",
      header: "Unidades",
      accessorFn: nombreUnidades,
      cell: ({ getValue }) => getValue<string>() || SIN_DATO,
    },
    {
      id: "projects",
      header: "Proyectos activos",
      accessorFn: (m) => proyectosPor.get(m.id) ?? 0,
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
    },
    {
      id: "tasks",
      header: "Tareas pendientes",
      accessorFn: (m) => tareasPor.get(m.id) ?? 0,
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>()}</span>,
    },
    ...columnaAcciones,
  ];
}
