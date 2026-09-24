import "server-only";

import { supabaseAdmin } from "@/lib/landing/supabase";

export type Ambito = "negocio" | "personal";
export type TipoMov = "ingreso" | "egreso";
export type Moneda = "ARS" | "USD";
export type EstadoMov = "pagado" | "pendiente" | "cobrado";

export interface Movimiento {
  id: string;
  fecha: string;
  ambito: Ambito;
  tipo: TipoMov;
  monto: number;
  moneda: Moneda;
  categoria: string;
  concepto: string;
  unidad?: string;
  cliente?: string;
  proyecto?: string;
  persona?: string;
  estado: EstadoMov;
  comprobante?: string;
  notas?: string;
}

export async function getMovimientos(): Promise<Movimiento[]> {
  const { data, error } = await supabaseAdmin()
    .from("movements")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron leer los movimientos: ${error.message}`);
  }
  return (data ?? []) as Movimiento[];
}

/** Total por moneda. Nunca convierte — pesos y dólares van separados. */
export interface TotalMoneda {
  ARS: number;
  USD: number;
}

function vacio(): TotalMoneda {
  return { ARS: 0, USD: 0 };
}

export interface ResumenMensual {
  mes: string; // AAAA-MM
  ingresos: TotalMoneda;
  egresos: TotalMoneda;
  balance: TotalMoneda;
}

/** Balance del ámbito, agrupado por mes, con pesos y dólares separados. */
export async function resumenPorMes(
  ambito: Ambito,
): Promise<ResumenMensual[]> {
  const movs = (await getMovimientos()).filter((m) => m.ambito === ambito);
  const porMes = new Map<string, ResumenMensual>();

  for (const m of movs) {
    const mes = m.fecha.slice(0, 7);
    if (!porMes.has(mes)) {
      porMes.set(mes, {
        mes,
        ingresos: vacio(),
        egresos: vacio(),
        balance: vacio(),
      });
    }
    const r = porMes.get(mes)!;
    const destino = m.tipo === "ingreso" ? r.ingresos : r.egresos;
    destino[m.moneda] += m.monto;
    r.balance[m.moneda] += m.tipo === "ingreso" ? m.monto : -m.monto;
  }

  return [...porMes.values()].sort((a, b) => b.mes.localeCompare(a.mes));
}

/** Egresos agrupados por categoría, del ámbito y mes dados. */
export async function egresosPorCategoria(
  ambito: Ambito,
  mes?: string,
): Promise<{ categoria: string; total: TotalMoneda }[]> {
  const movs = (await getMovimientos()).filter(
    (m) =>
      m.ambito === ambito &&
      m.tipo === "egreso" &&
      (!mes || m.fecha.startsWith(mes)),
  );
  const porCat = new Map<string, TotalMoneda>();
  for (const m of movs) {
    if (!porCat.has(m.categoria)) porCat.set(m.categoria, vacio());
    porCat.get(m.categoria)![m.moneda] += m.monto;
  }
  return [...porCat.entries()].map(([categoria, total]) => ({ categoria, total }));
}
