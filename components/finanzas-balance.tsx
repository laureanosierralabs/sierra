import { Suspense } from "react";
import { calcularBalance, type PorMoneda } from "@/lib/landing/balance";
import { listarGastosFijos } from "@/lib/landing/datos";
import {
  LABEL_CATEGORIA_GASTO,
  LABEL_PERIODO,
  costoMensual,
  formatearMonto,
  gastoVigente,
  type Moneda,
} from "@/lib/landing/tipos";
import { GastoForm } from "@/components/landing/gasto-form";
import { BorrarGastoFijo } from "@/components/landing/borrar";
import { FiltroMes } from "@/components/landing/filtro-mes";
import { nombreMes } from "@/lib/landing/meses";

function textoMontos(total: PorMoneda, signo = false): string {
  const partes = (Object.entries(total) as [Moneda, number][])
    .filter(([, v]) => Math.round(v * 100) !== 0)
    .map(([m, v]) => {
      const t = formatearMonto(Math.abs(v), m);
      return signo && v < 0 ? `-${t}` : t;
    });
  return partes.length > 0 ? partes.join(" · ") : "—";
}

function Bloque({
  titulo,
  detalle,
  total,
  clase,
}: {
  titulo: string;
  detalle: string;
  total: PorMoneda;
  clase: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-e1">
      <p className="eyebrow">{titulo}</p>
      <p className={`tnum mt-2 text-2xl font-bold ${clase}`}>
        {textoMontos(total)}
      </p>
      <p className="mt-1 text-xs text-text-3">{detalle}</p>
    </div>
  );
}

export async function FinanzasBalance({ mes }: { mes?: string }) {
  const [balance, gastos] = await Promise.all([
    calcularBalance(mes),
    listarGastosFijos(),
  ]);

  const hoy = new Date().toISOString().slice(0, 7);

  return (
    <>
      <section className="mb-10">
        <h2 className="mb-4 font-display text-lg font-bold">Resumen</h2>

        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Bloque
            titulo="Cobrado"
            detalle="Lo que ya entró"
            total={balance.cobrado}
            clase="text-ok"
          />
          <Bloque
            titulo="Por cobrar"
            detalle="Aprobado y sin pagar"
            total={balance.porCobrar}
            clase="text-warn"
          />
          <Bloque
            titulo="Por pagar al equipo"
            detalle="Comprometido e impago"
            total={balance.porPagar}
            clase="text-critical"
          />
          <Bloque
            titulo="Gasto fijo mensual"
            detalle="Suscripciones vigentes"
            total={balance.gastoMensual}
            clase="text-text-2"
          />
        </div>

        <p className="text-xs text-text-3">
          La previsión de borradores ({textoMontos(balance.prevision)}) no se
          cuenta acá: todavía no la aprobó nadie.
        </p>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">
            Balance por mes
            {mes && (
              <span className="ml-2 text-sm font-normal capitalize text-text-3">
                {nombreMes(mes)}
              </span>
            )}
          </h2>
          {/* useSearchParams necesita su propio límite de Suspense. */}
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
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {["Mes", "Ingresos", "Equipo", "Gastos fijos", "Balance"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {balance.meses.map((m) => {
                  const positivo = Object.values(m.balance).some((v) => v > 0);
                  const negativo = Object.values(m.balance).some((v) => v < 0);
                  return (
                    <tr
                      key={m.mes}
                      className="fila-hover border-b border-line last:border-0"
                    >
                      <td className="px-4 py-3 font-medium capitalize">
                        {nombreMes(m.mes)}
                      </td>
                      <td className="tnum px-4 py-3 text-ok">
                        {textoMontos(m.ingresos)}
                      </td>
                      <td className="tnum px-4 py-3 text-text-2">
                        {textoMontos(m.costosEquipo)}
                      </td>
                      <td className="tnum px-4 py-3 text-text-2">
                        {textoMontos(m.gastosFijos)}
                      </td>
                      <td
                        className={`tnum px-4 py-3 font-medium ${
                          negativo && !positivo
                            ? "text-critical"
                            : positivo
                              ? "text-ok"
                              : "text-text-2"
                        }`}
                      >
                        {textoMontos(m.balance, true)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">
            Gastos fijos
            <span className="tnum ml-2 text-sm font-normal text-text-3">
              {textoMontos(balance.gastoMensual)}/mes
            </span>
          </h2>
          <GastoForm />
        </div>

        {gastos.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-sm text-text-3">
            Todavía no cargaste gastos fijos.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {["Gasto", "Categoría", "Monto", "Periodicidad", "Por mes", ""].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => {
                  const vigente = gastoVigente(g, hoy);
                  return (
                    <tr
                      key={g.id}
                      className={`fila-hover group/fila border-b border-line last:border-0 ${
                        vigente ? "" : "opacity-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {g.name}
                        {!vigente && (
                          <span className="ml-2 text-xs text-text-3">
                            dado de baja
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-2">
                        {LABEL_CATEGORIA_GASTO[g.category]}
                      </td>
                      <td className="tnum px-4 py-3">
                        {formatearMonto(g.amount, g.currency)}
                      </td>
                      <td className="px-4 py-3 text-text-2">
                        {LABEL_PERIODO[g.period]}
                      </td>
                      <td className="tnum px-4 py-3 text-text-2">
                        {formatearMonto(costoMensual(g), g.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover/fila:opacity-100 focus-within:opacity-100">
                          <GastoForm gasto={g} />
                          <BorrarGastoFijo id={g.id} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
