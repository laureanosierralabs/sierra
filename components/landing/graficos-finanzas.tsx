"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { nombreMes } from "@/lib/landing/meses";

export interface PuntoMes {
  mes: string;
  ingresos: number;
  egresos: number;
  resultado: number;
}

export interface PuntoMargen {
  nombre: string;
  margenPct: number;
}

const EJE = { fontSize: 11, fill: "var(--text-3)" };

function Caja({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-e1">
      {children}
    </div>
  );
}

function money(v: number): string {
  return `$${Math.round(v).toLocaleString("es-AR")}`;
}

/** Tooltip propio: el de Recharts no hereda los tokens del tema. */
function Tip({
  active,
  payload,
  label,
  sufijo,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  sufijo?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-e2">
      <p className="mb-1 text-xs font-medium capitalize">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tnum text-xs" style={{ color: p.color }}>
          {p.name}: {sufijo ? `${(p.value ?? 0).toFixed(1)}${sufijo}` : money(p.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

/** Tres series y nada más: ingresos, egresos y el resultado que dejan. */
export function EvolucionMensual({ datos }: { datos: PuntoMes[] }) {
  if (datos.length === 0) {
    return (
      <Caja>
        <p className="py-10 text-center text-sm text-text-3">
          Todavía no hay meses con movimiento.
        </p>
      </Caja>
    );
  }

  return (
    <Caja>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={EJE}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={(m: string) => nombreMes(m).split(" ")[0].slice(0, 3)}
          />
          <YAxis
            tick={EJE}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={money}
          />
          <Tooltip
            content={<Tip />}
            labelFormatter={(m) => (typeof m === "string" ? nombreMes(m) : "")}
            cursor={{ fill: "var(--surface-2)" }}
          />
          <Bar
            dataKey="ingresos"
            name="Ingresos"
            fill="var(--ok)"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="egresos"
            name="Egresos"
            fill="var(--critical)"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Line
            type="monotone"
            dataKey="resultado"
            name="Resultado"
            stroke="var(--text)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--surface)" }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap items-center gap-4 px-1 text-xs text-text-3">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-ok" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-critical" /> Egresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-text" /> Resultado
        </span>
      </div>
    </Caja>
  );
}

/** Barras horizontales: el nombre del proyecto se lee sin rotar la cabeza. */
export function MargenPorProyecto({ datos }: { datos: PuntoMargen[] }) {
  if (datos.length === 0) return null;

  return (
    <Caja>
      <ResponsiveContainer width="100%" height={Math.max(datos.length * 34, 120)}>
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
        >
          <CartesianGrid stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={EJE}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 100]}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            tick={EJE}
            tickLine={false}
            axisLine={false}
            width={130}
          />
          <Tooltip content={<Tip sufijo="%" />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="margenPct" name="Margen" radius={[0, 3, 3, 0]} maxBarSize={18}>
            {datos.map((d, i) => (
              <Cell
                key={i}
                fill={d.margenPct < 0 ? "var(--critical)" : "var(--ok)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Caja>
  );
}
