"use client";

import dynamic from "next/dynamic";
import { ChartCard } from "@/components/common/charts/chart-card";
import type { PuntoCobrado } from "@/lib/inicio";

/** Recharts se baja aparte: la tarjeta con su altura fija ocupa el lugar mientras tanto. */
const Contenido = dynamic(
  () =>
    import("@/components/inicio/grafico-cobrado-contenido").then((m) => m.GraficoCobradoContenido),
  {
    loading: () => (
      <ChartCard title="Cobrado por mes" height={220}>
        <div className="h-full w-full animate-pulse rounded-md bg-card-border/30" />
      </ChartCard>
    ),
  },
);

export function GraficoCobrado({ puntos }: { puntos: PuntoCobrado[] }) {
  return <Contenido puntos={puntos} />;
}
