"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MenuKebab1 } from "@tailgrids/icons";
import { Badge } from "@/components/tailgrids/core/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";
import { duracionTexto, type EntradaHora } from "@/lib/horas/tipos";

const DIA = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const SIN_DATO = <span className="text-text-tertiary">—</span>;

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

interface Opciones {
  verPersona: boolean;
  nombreCliente: Map<string, string>;
  puedeTocar: (e: EntradaHora) => boolean;
  onEditar: (e: EntradaHora) => void;
  onBorrar: (e: EntradaHora) => void;
}

/** Fecha, persona (solo vista de equipo), horario, duración, trabajo, cliente y acciones. */
export function crearColumnasHoras({ verPersona, nombreCliente, puedeTocar, onEditar, onBorrar }: Opciones): ColumnDef<EntradaHora>[] {
  const columnas: ColumnDef<EntradaHora>[] = [
    {
      id: "fecha",
      header: "Fecha",
      // Día y hora juntos: ordenar por fecha deja cada día en orden horario.
      accessorFn: (e) => `${e.work_date} ${e.start_time}`,
      cell: ({ row }) => (
        <span className="whitespace-nowrap capitalize tabular-nums text-text-primary">
          {DIA.format(new Date(`${row.original.work_date}T00:00:00Z`)).replace(".", "")}
        </span>
      ),
    },
  ];

  if (verPersona) {
    columnas.push({
      id: "persona",
      header: "Persona",
      accessorFn: (e) => e.user_name,
      cell: ({ row }) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-xs font-semibold text-primary-500"
          >
            {iniciales(row.original.user_name)}
          </span>
          {row.original.user_name}
        </span>
      ),
    });
  }

  columnas.push(
    {
      id: "horario",
      header: "Horario",
      accessorFn: (e) => e.start_time,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums text-text-secondary">
          {row.original.start_time} – {row.original.end_time}
        </span>
      ),
    },
    {
      id: "duracion",
      header: "Duración",
      accessorFn: (e) => e.minutes,
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums text-text-primary">
          {duracionTexto(row.original.minutes)}
        </span>
      ),
    },
    {
      id: "trabajo",
      header: "Qué se trabajó",
      accessorFn: (e) => e.notes,
      enableSorting: false,
      cell: ({ row }) => (
        <p className="line-clamp-2 min-w-56 max-w-xl text-text-secondary" title={row.original.notes}>
          {row.original.notes}
        </p>
      ),
    },
    {
      id: "cliente",
      header: "Cliente",
      accessorFn: (e) => (e.client_id ? (nombreCliente.get(e.client_id) ?? "") : ""),
      cell: ({ row }) => {
        const nombre = row.original.client_id ? nombreCliente.get(row.original.client_id) : null;
        return nombre ? (
          <Badge color="gray" size="sm" className="whitespace-nowrap rounded-md">
            {nombre}
          </Badge>
        ) : (
          SIN_DATO
        );
      },
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) =>
        puedeTocar(row.original) ? (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Acciones de la carga del ${row.original.work_date}`}
                className="flex size-8 items-center justify-center rounded-md text-text-tertiary hover:bg-background-gray-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-5"
              >
                <MenuKebab1 />
              </DropdownMenuTrigger>
              <DropdownMenuContent placement="bottom end">
                <DropdownMenuItem id="editar" onAction={() => onEditar(row.original)} className="px-3 py-2">
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem id="borrar" onAction={() => onBorrar(row.original)} className="px-3 py-2 text-error-500">
                  Borrar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null,
    },
  );

  return columnas;
}
