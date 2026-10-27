"use client";

import dynamic from "next/dynamic";

/* Recharts se baja aparte; cada placeholder tiene el mismo tamaño que el gráfico. */

const Bloque = ({ className }: { className: string }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-xl bg-white/5 ${className}`} />
);

export const GraficoVisitasRegistros = dynamic(
  () => import("@/components/portal/resultados/graficos-recharts").then((m) => m.GraficoVisitasRegistros),
  { loading: () => <Bloque className="h-65 w-full sm:h-75" /> },
);

export const GraficoVentas = dynamic(
  () => import("@/components/portal/resultados/graficos-recharts").then((m) => m.GraficoVentas),
  { loading: () => <Bloque className="h-50 w-full sm:h-60" /> },
);

export const GraficoDona = dynamic(
  () => import("@/components/portal/resultados/graficos-recharts").then((m) => m.GraficoDona),
  { loading: () => <Bloque className="mx-auto size-48 shrink-0 rounded-full sm:size-52" /> },
);

const SparklineImpl = dynamic(
  () => import("@/components/portal/resultados/graficos-recharts").then((m) => m.Sparkline),
  { loading: () => <Bloque className="h-9 w-full" /> },
);

type PropsSparkline = { valores: (number | null)[]; color?: string };

export function Sparkline(props: PropsSparkline) {
  // Misma regla que el gráfico real: sin serie suficiente no se dibuja nada.
  if (props.valores.length < 2 || props.valores.every((v) => v === null)) return null;
  return <SparklineImpl {...props} />;
}
