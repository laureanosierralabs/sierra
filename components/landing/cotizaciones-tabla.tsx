"use client";

import { useMemo } from "react";
import type { SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table/data-table";
import type { DataTableFacet } from "@/components/common/data-table/types";
import { EmptyState } from "@/components/common/empty-state";
import { crearColumnasCotizaciones } from "@/components/landing/cotizaciones-columnas";
import {
  ESTADOS_COTIZACION,
  ESTADOS_PAGO,
  LABEL_ESTADO_COTIZACION,
  LABEL_ESTADO_PAGO,
  type Cliente,
  type Cotizacion,
  type Proyecto,
} from "@/lib/landing/tipos";

const OBTENER_ID = (q: Cotizacion) => q.id;
const IR_A_LA_COTIZACION = (q: Cotizacion) => `/landing-pages/quotes/${q.id}`;
const MAS_NUEVAS_PRIMERO: SortingState = [{ id: "date", desc: true }];

export function CotizacionesTabla({
  cotizaciones,
  clientes,
  proyectos,
}: {
  cotizaciones: Cotizacion[];
  clientes: Cliente[];
  proyectos: Proyecto[];
}) {
  const nombrePor = useMemo(() => new Map(clientes.map((c) => [c.id, c.name])), [clientes]);

  const columnas = useMemo(
    () =>
      crearColumnasCotizaciones({
        clientes,
        proyectos,
        nombrePor,
        proyectoPor: new Map(proyectos.map((p) => [p.id, p.name])),
      }),
    [clientes, proyectos, nombrePor],
  );

  // El filtro de cliente compara contra el nombre que muestra la columna, y
  // solo ofrece clientes que tienen alguna cotización.
  const facets = useMemo<DataTableFacet[]>(() => {
    const conCotizacion = [
      ...new Set(
        cotizaciones
          .map((q) => (q.client_id ? nombrePor.get(q.client_id) : undefined))
          .filter((n): n is string => Boolean(n)),
      ),
    ].sort((a, b) => a.localeCompare(b, "es"));

    return [
      {
        columnId: "client",
        label: "Cliente",
        options: conCotizacion.map((n) => ({ label: n, value: n })),
      },
      {
        columnId: "status",
        label: "Estado",
        options: ESTADOS_COTIZACION.map((e) => ({ label: LABEL_ESTADO_COTIZACION[e], value: e })),
      },
      {
        columnId: "payment",
        label: "Pago",
        options: ESTADOS_PAGO.map((e) => ({ label: LABEL_ESTADO_PAGO[e], value: e })),
      },
    ];
  }, [cotizaciones, nombrePor]);

  return (
    <DataTable
      columns={columnas}
      data={cotizaciones}
      label="Cotizaciones"
      getRowId={OBTENER_ID}
      getRowHref={IR_A_LA_COTIZACION}
      searchable
      searchPlaceholder="Buscar cotización…"
      facets={facets}
      paginate
      initialSorting={MAS_NUEVAS_PRIMERO}
      // Con filtros activos y sin coincidencias, el texto por defecto ("Sin
      // resultados") es el correcto; este solo aplica a la tabla vacía.
      emptyState={
        cotizaciones.length === 0 ? (
          <EmptyState variant="inline">Todavía no hay cotizaciones.</EmptyState>
        ) : undefined
      }
    />
  );
}
