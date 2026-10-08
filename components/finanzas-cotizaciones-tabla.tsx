"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/common/data-table/data-table";
import { crearColumnasFinanzasCotizaciones } from "@/components/finanzas-cotizaciones-columnas";
import type { Cotizacion } from "@/lib/landing/tipos";

const OBTENER_ID = (q: Cotizacion) => q.id;
const IR_A_LA_COTIZACION = (q: Cotizacion) => `/landing-pages/quotes/${q.id}`;

export function FinanzasCotizacionesTabla({
  cotizaciones,
  clientes,
  proyectos,
}: {
  cotizaciones: Cotizacion[];
  /** Pares [id, nombre a mostrar]. */
  clientes: [string, string][];
  proyectos: [string, string][];
}) {
  const columnas = useMemo(
    () =>
      crearColumnasFinanzasCotizaciones({
        nombrePor: new Map(clientes),
        proyectoPor: new Map(proyectos),
      }),
    [clientes, proyectos],
  );

  return (
    <DataTable
      columns={columnas}
      data={cotizaciones}
      label="Ingresos por cotización"
      getRowId={OBTENER_ID}
      getRowHref={IR_A_LA_COTIZACION}
    />
  );
}
