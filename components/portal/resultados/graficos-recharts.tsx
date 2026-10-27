"use client";

import { useId, useSyncExternalStore, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  COLOR_REGISTROS,
  COLOR_VISITAS,
  COLORES_FUENTES,
  diaCorto,
  diaLargo,
  numero,
} from "@/components/portal/resultados/formato";
import type { PuntoDia } from "@/lib/lanzamientos/resultados";

/* Gráficos del portal: recharts con colores explícitos para el fondo oscuro. */

const EJE = { fill: "rgba(255,255,255,0.5)", fontSize: 11 } as const;
const REJILLA = "rgba(255,255,255,0.08)";

const suscribirMovimiento = (cb: () => void) => {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** Quien pidió menos movimiento no ve los gráficos dibujarse. */
function useMovimientoReducido() {
  return useSyncExternalStore(
    suscribirMovimiento,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

const compacto = (n: number) => n.toLocaleString("es-AR", { notation: "compact", maximumFractionDigits: 1 });

interface PropsTooltip {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}

/** Caja oscura del tooltip; cada gráfico decide qué cuenta adentro. */
function CajaTooltip<T>({ active, payload, children }: PropsTooltip & { children: (fila: T) => ReactNode }) {
  const fila = payload?.[0]?.payload as T | undefined;
  if (!active || !fila) return null;
  return (
    <div className="rounded-xl bg-neutral-900/95 px-3 py-2 text-xs text-white shadow-xl ring-1 ring-white/15 backdrop-blur">
      {children(fila)}
    </div>
  );
}

function FilaTooltip({ color, nombre, valor }: { color: string; nombre: string; valor: string }) {
  return (
    <p className="mt-1 flex items-center justify-between gap-5">
      <span className="flex items-center gap-1.5 text-white/70">
        <span aria-hidden="true" className="size-2 rounded-full" style={{ background: color }} />
        {nombre}
      </span>
      <span className="font-semibold tabular-nums">{valor}</span>
    </p>
  );
}

interface FilaArea {
  dia: string;
  etiqueta: string;
  visitantes: number;
  registros: number;
}

/**
 * Visitas y registros por día. Con visitas medidas lleva dos escalas (visitas
 * a la izquierda, registros a la derecha): si no, los registros quedarían
 * aplastados contra el piso. El tooltip siempre dice los valores reales.
 */
export function GraficoVisitasRegistros({
  serie,
  conVisitas,
  resumen,
}: {
  serie: PuntoDia[];
  conVisitas: boolean;
  resumen: string;
}) {
  const id = useId().replace(/:/g, "");
  const reducido = useMovimientoReducido();
  const datos: FilaArea[] = serie.map((d) => ({
    dia: d.dia,
    etiqueta: diaCorto(d.dia),
    visitantes: d.visitantes,
    registros: d.registros,
  }));
  const puntos = datos.length <= 3;

  return (
    <div role="img" aria-label={resumen} className="h-65 w-full sm:h-75">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`${id}-v`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_VISITAS} stopOpacity={0.22} />
              <stop offset="100%" stopColor={COLOR_VISITAS} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_REGISTROS} stopOpacity={0.5} />
              <stop offset="100%" stopColor={COLOR_REGISTROS} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={REJILLA} vertical={false} />
          <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={EJE} dy={8} interval="preserveStartEnd" minTickGap={28} />
          {conVisitas && (
            <YAxis yAxisId="v" axisLine={false} tickLine={false} tick={EJE} width={36} allowDecimals={false} tickFormatter={compacto} />
          )}
          <YAxis
            yAxisId="r"
            orientation={conVisitas ? "right" : "left"}
            axisLine={false}
            tickLine={false}
            tick={{ ...EJE, fill: conVisitas ? COLOR_REGISTROS : EJE.fill }}
            width={36}
            allowDecimals={false}
            tickFormatter={compacto}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.25)", strokeDasharray: "4 4" }}
            content={(p) => (
              <CajaTooltip<FilaArea> {...p}>
                {(f) => (
                  <>
                    <p className="font-semibold capitalize">{diaLargo(f.dia)}</p>
                    {conVisitas && <FilaTooltip color={COLOR_VISITAS} nombre="Visitantes" valor={numero(f.visitantes)} />}
                    <FilaTooltip color={COLOR_REGISTROS} nombre="Registros" valor={numero(f.registros)} />
                  </>
                )}
              </CajaTooltip>
            )}
          />
          {conVisitas && (
            <Area
              yAxisId="v"
              type="monotone"
              dataKey="visitantes"
              stroke={COLOR_VISITAS}
              strokeWidth={1.75}
              fill={`url(#${id}-v)`}
              dot={puntos ? { r: 3, fill: COLOR_VISITAS, strokeWidth: 0 } : false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={!reducido}
            />
          )}
          <Area
            yAxisId="r"
            type="monotone"
            dataKey="registros"
            stroke={COLOR_REGISTROS}
            strokeWidth={2.25}
            fill={`url(#${id}-r)`}
            dot={puntos ? { r: 3.5, fill: COLOR_REGISTROS, strokeWidth: 0 } : false}
            activeDot={{ r: 4.5, strokeWidth: 0 }}
            isAnimationActive={!reducido}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ventas por día, con los ingresos del día en el tooltip. */
export function GraficoVentas({ serie, resumen }: { serie: PuntoDia[]; resumen: string }) {
  const reducido = useMovimientoReducido();
  const datos = serie.map((d) => ({ dia: d.dia, etiqueta: diaCorto(d.dia), ventas: d.ventas, ingresos: d.ingresos }));

  return (
    <div role="img" aria-label={resumen} className="h-50 w-full sm:h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={REJILLA} vertical={false} />
          <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={EJE} dy={8} interval="preserveStartEnd" minTickGap={28} />
          <YAxis axisLine={false} tickLine={false} tick={EJE} width={32} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={(p) => (
              <CajaTooltip<(typeof datos)[number]> {...p}>
                {(f) => (
                  <>
                    <p className="font-semibold capitalize">{diaLargo(f.dia)}</p>
                    <FilaTooltip color={COLOR_REGISTROS} nombre="Ventas" valor={numero(f.ventas)} />
                    {f.ingresos && <FilaTooltip color="#ffffff" nombre="Ingresos" valor={f.ingresos} />}
                  </>
                )}
              </CajaTooltip>
            )}
          />
          <Bar dataKey="ventas" fill={COLOR_REGISTROS} radius={[5, 5, 0, 0]} maxBarSize={36} isAnimationActive={!reducido} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Dona de participación; el total va en el centro. */
export function GraficoDona({
  datos,
  total,
  etiquetaTotal,
  resumen,
}: {
  datos: { nombre: string; valor: number }[];
  total: number;
  etiquetaTotal: string;
  resumen: string;
}) {
  const reducido = useMovimientoReducido();
  return (
    <div role="img" aria-label={resumen} className="relative mx-auto size-48 shrink-0 sm:size-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={(p) => (
              <CajaTooltip<{ nombre: string; valor: number }> {...p}>
                {(f) => (
                  <>
                    <p className="font-semibold">{f.nombre}</p>
                    <p className="tabular-nums text-white/70">
                      {numero(f.valor)} ({Math.round((f.valor / total) * 1000) / 10}%)
                    </p>
                  </>
                )}
              </CajaTooltip>
            )}
          />
          <Pie
            data={datos}
            dataKey="valor"
            nameKey="nombre"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={datos.length > 1 ? 2 : 0}
            stroke="none"
            isAnimationActive={!reducido}
          >
            {datos.map((d, i) => (
              <Cell key={d.nombre} fill={COLORES_FUENTES[i % COLORES_FUENTES.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold tracking-tight tabular-nums">{numero(total)}</span>
        <span className="text-[11px] text-white/55">{etiquetaTotal}</span>
      </div>
    </div>
  );
}

/** Línea mínima de una tarjeta de KPI: sin ejes, sin tooltip; solo la forma de la serie. */
export function Sparkline({ valores, color = COLOR_REGISTROS }: { valores: (number | null)[]; color?: string }) {
  const id = useId().replace(/:/g, "");
  const reducido = useMovimientoReducido();
  if (valores.length < 2 || valores.every((v) => v === null)) return null;
  const datos = valores.map((v, i) => ({ i, v }));

  return (
    <div aria-hidden="true" className="h-9 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 3, right: 1, left: 1, bottom: 1 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, "dataMax"]} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${id})`}
            dot={false}
            connectNulls
            isAnimationActive={!reducido}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
