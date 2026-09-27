import { Suspense } from "react";
import type { Balance, PorMoneda } from "@/lib/landing/balance";
import { formatearMonto, type Moneda } from "@/lib/landing/tipos";
import { FiltroMes } from "@/components/landing/filtro-mes";
import { nombreMes } from "@/lib/landing/meses";
import { Tabla, TablaHead } from "@/components/landing/tabla";

export function textoMontos(total: PorMoneda, signo = false): string {
  const partes = (Object.entries(total) as [Moneda, number][])
    .filter(([, v]) => Math.round(v * 100) !== 0)
    .map(([m, v]) => {
      const t = formatearMonto(Math.abs(v), m);
      return signo && v < 0 ? `-${t}` : t;
    });
  return partes.length > 0 ? partes.join(" · ") : "—";
}

function signoDe(total: PorMoneda): "pos" | "neg" | "cero" {
  const vals = Object.values(total);
  if (vals.some((v) => v > 0.005)) return "pos";
  if (vals.some((v) => v < -0.005)) return "neg";
  return "cero";
}

/** Indicador compacto: el número manda, la etiqueta acompaña. */
function Indicador({
  titulo,
  detalle,
  total,
  clase,
}: {
  titulo: string;
  detalle: string;
  total: PorMoneda;
  clase?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
      <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-3">
        {titulo}
      </p>
      <p className={`tnum mt-1.5 text-xl font-bold ${clase ?? "text-text"}`}>
        {textoMontos(total)}
      </p>
      <p className="mt-0.5 text-[0.6875rem] text-text-3">{detalle}</p>
    </div>
  );
}

export function Resumen({ balance }: { balance: Balance }) {
  const real = signoDe(balance.resultadoReal);

  return (
    <section className="mb-8">
      <div className="mb-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        <Indicador
          titulo="Cobrado"
          detalle="Ya entró"
          total={balance.cobrado}
          clase="text-ok"
        />
        <Indicador
          titulo="Por cobrar"
          detalle="Aprobado, impago"
          total={balance.porCobrar}
          clase="text-warn"
        />
        <Indicador
          titulo="Previsión"
          detalle="Sin aprobar"
          total={balance.prevision}
          clase="text-text-2"
        />
        <Indicador
          titulo="Por pagar equipo"
          detalle="Comprometido"
          total={balance.porPagar}
          clase="text-critical"
        />
        <Indicador
          titulo="Gasto fijo"
          detalle="Por mes"
          total={balance.gastoMensual}
          clase="text-text-2"
        />
      </div>

      <div className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-3">
          Resultado real
        </p>
        <p
          className={`tnum mt-1.5 text-2xl font-bold ${
            real === "neg" ? "text-critical" : real === "pos" ? "text-ok" : "text-text"
          }`}
        >
          {textoMontos(balance.resultadoReal, true)}
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-text-3">
          Cobrado − pagado al equipo − gastos. Solo caja efectiva.
        </p>
      </div>
    </section>
  );
}

export function BalanceMensual({
  balance,
  mes,
}: {
  balance: Balance;
  mes?: string;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold">
          Balance por mes
          {mes && (
            <span className="ml-2 text-sm font-normal capitalize text-text-3">
              {nombreMes(mes)}
            </span>
          )}
        </h2>
        <Suspense fallback={null}>
          <FiltroMes meses={balance.mesesDisponibles} />
        </Suspense>
      </div>

      {balance.meses.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-sm text-text-3">
          {mes
            ? "No hubo movimientos en ese mes."
            : "Todavía no hay movimientos con fecha."}
        </p>
      ) : (
        <Tabla filas={balance.meses.length}>
          <table className="w-full min-w-200 text-sm">
            <TablaHead columnas={[
                  "Mes",
                  "Ingresos cobrados",
                  "Equipo pagado",
                  "Gastos",
                  "Resultado real",
                ]} />
            <tbody>
              {balance.meses.map((m) => {
                const s = signoDe(m.resultado);
                return (
                  <tr
                    key={m.mes}
                    className="fila-hover border-b border-line last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium capitalize">
                      {nombreMes(m.mes)}
                    </td>
                    <td className="tnum px-4 py-2.5 text-ok">
                      {textoMontos(m.ingresos)}
                    </td>
                    <td className="tnum px-4 py-2.5 text-text-2">
                      {textoMontos(m.costosEquipo)}
                    </td>
                    <td className="tnum px-4 py-2.5 text-text-2">
                      {textoMontos(m.gastos)}
                    </td>
                    <td
                      className={`tnum px-4 py-2.5 font-medium ${
                        s === "neg"
                          ? "text-critical"
                          : s === "pos"
                            ? "text-ok"
                            : "text-text-2"
                      }`}
                    >
                      {textoMontos(m.resultado, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Tabla>
      )}
    </section>
  );
}
