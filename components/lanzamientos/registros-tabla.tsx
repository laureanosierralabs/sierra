"use client";

import { useMemo } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import type { PaginaLanzamiento, Registro } from "@/lib/lanzamientos/tipos";

const SIN_DATO = <span className="text-text-tertiary">—</span>;
const MAS_NUEVOS_PRIMERO: SortingState = [{ id: "fecha", desc: true }];
const OBTENER_ID = (r: Registro) => r.id;

/* Fecha y hora en Buenos Aires: fija, para que servidor y navegador coincidan. */
const FECHA_HORA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function columnaLanding(nombrePagina: Map<string, string>): ColumnDef<Registro> {
  return {
    id: "landing",
    header: "Landing",
    accessorFn: (r) => (r.page_id ? (nombrePagina.get(r.page_id) ?? "") : ""),
    cell: ({ getValue }) => getValue<string>() || SIN_DATO,
  };
}

/**
 * Quién se registró: buscable y paginado. La landing se elige en el filtro
 * del panel (gobierna toda la vista); con una sola elegida, la columna
 * Landing sobra y no se muestra.
 */
export function RegistrosTabla({
  registros,
  paginas,
  mostrarLanding = true,
  acciones,
}: {
  registros: Registro[];
  paginas: Pick<PaginaLanzamiento, "id" | "name">[];
  mostrarLanding?: boolean;
  acciones?: React.ReactNode;
}) {
  const nombrePagina = useMemo(() => new Map(paginas.map((p) => [p.id, p.name])), [paginas]);

  const columnas = useMemo<ColumnDef<Registro>[]>(
    () => [
      {
        id: "nombre",
        header: "Nombre",
        accessorFn: (r) => r.name ?? "",
        cell: ({ row }) =>
          row.original.name ? (
            <span className="font-medium text-text-primary">{row.original.name}</span>
          ) : (
            SIN_DATO
          ),
      },
      { id: "email", header: "Email", accessorFn: (r) => r.email },
      {
        id: "telefono",
        header: "Teléfono",
        accessorFn: (r) => r.phone ?? "",
        cell: ({ row }) =>
          row.original.phone ? <span className="tabular-nums">{row.original.phone}</span> : SIN_DATO,
      },
      ...(mostrarLanding ? [columnaLanding(nombrePagina)] : []),
      {
        id: "fuente",
        header: "Fuente",
        accessorFn: (r) => r.utm_source ?? "",
        cell: ({ row }) => {
          const { utm_source, utm_content } = row.original;
          if (!utm_source) return SIN_DATO;
          return (
            <span title={utm_content ?? undefined}>
              {utm_source}
              {utm_content ? <span className="text-text-tertiary"> · {utm_content}</span> : null}
            </span>
          );
        },
      },
      {
        id: "fecha",
        header: "Fecha",
        accessorFn: (r) => r.registered_at,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-secondary">
            {FECHA_HORA.format(new Date(row.original.registered_at))}
          </span>
        ),
      },
    ],
    [nombrePagina, mostrarLanding],
  );

  return (
    <DataTable
      columns={columnas}
      data={registros}
      label="Registros"
      getRowId={OBTENER_ID}
      searchable
      searchPlaceholder="Buscar por nombre, email o teléfono…"
      paginate
      pageSize={25}
      initialSorting={MAS_NUEVOS_PRIMERO}
      toolbarActions={acciones}
      emptyState={
        registros.length === 0 ? (
          <EmptyState variant="inline">Todavía no entró ningún registro.</EmptyState>
        ) : undefined
      }
    />
  );
}
