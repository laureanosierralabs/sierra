"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { crearColumnasCotizaciones } from "@/components/landing/cotizaciones-columnas";
import type { Cliente, Cotizacion, Proyecto } from "@/lib/landing/tipos";

const OBTENER_ID = (q: Cotizacion) => q.id;
const IR_A_LA_COTIZACION = (q: Cotizacion) => `/landing-pages/quotes/${q.id}`;

export function CotizacionesTabla({
  cotizaciones,
  clientes,
  proyectos,
}: {
  cotizaciones: Cotizacion[];
  clientes: Cliente[];
  proyectos: Proyecto[];
}) {
  const columnas = useMemo(
    () =>
      crearColumnasCotizaciones({
        clientes,
        proyectos,
        nombrePor: new Map(clientes.map((c) => [c.id, c.name])),
        proyectoPor: new Map(proyectos.map((p) => [p.id, p.name])),
      }),
    [clientes, proyectos],
  );

  return (
    <DataTable
      columns={columnas}
      data={cotizaciones}
      label="Cotizaciones"
      getRowId={OBTENER_ID}
      getRowHref={IR_A_LA_COTIZACION}
      emptyState={<EmptyState variant="inline">Todavía no hay cotizaciones.</EmptyState>}
    />
  );
}
