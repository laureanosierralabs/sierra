"use client";

import { DonutChartCard } from "@/components/common/charts/donut-chart-card";
import { HorizontalBarChartCard } from "@/components/common/charts/horizontal-bar-chart-card";
import type { Porcion } from "@/components/landing/finanzas/datos-graficos";
import { formatearMonto, type Moneda } from "@/lib/landing/tipos";

function formatoDe(moneda: Moneda) {
  return (valor: number) => formatearMonto(valor, moneda);
}

function total(filas: Porcion[]): number {
  return filas.reduce((t, f) => t + f.value, 0);
}

export function GraficoCotizadoPorEstado({ filas, moneda }: { filas: Porcion[]; moneda: Moneda }) {
  return (
    <DonutChartCard
      title="Cotizado por estado"
      description={`Importe total de cada estado · ${moneda}`}
      data={filas}
      centerValue={formatearMonto(total(filas), moneda)}
      centerLabel="Cotizado"
      formatValue={formatoDe(moneda)}
      isEmpty={filas.length === 0}
      emptyMessage={`No hay cotizaciones con importe en ${moneda}.`}
    />
  );
}

export function GraficoEgresosPorMiembro({ filas, moneda }: { filas: Porcion[]; moneda: Moneda }) {
  return (
    <HorizontalBarChartCard
      title="Comprometido por miembro"
      description={`Total de los acuerdos con el equipo · ${moneda}`}
      data={filas}
      valueLabel={`Comprometido (${moneda})`}
      formatValue={formatoDe(moneda)}
      isEmpty={filas.length === 0}
      emptyMessage={`No hay acuerdos con importe en ${moneda}.`}
    />
  );
}

export function GraficoGastosPorCategoria({ filas, moneda }: { filas: Porcion[]; moneda: Moneda }) {
  return (
    <DonutChartCard
      title="Gasto mensual por categoría"
      description={`Gastos vigentes este mes, sin los únicos · ${moneda}`}
      data={filas}
      centerValue={formatearMonto(total(filas), moneda)}
      centerLabel="Por mes"
      formatValue={formatoDe(moneda)}
      isEmpty={filas.length === 0}
      emptyMessage={`No hay gastos recurrentes vigentes en ${moneda}.`}
    />
  );
}
