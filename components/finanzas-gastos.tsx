import { listarGastosFijos } from "@/lib/landing/datos";
import {
  LABEL_CATEGORIA_GASTO,
  LABEL_PERIODO,
  costoMensual,
  formatearMonto,
  gastoVigente,
} from "@/lib/landing/tipos";
import { GastoForm } from "@/components/landing/gasto-form";
import { BorrarGastoFijo } from "@/components/landing/borrar";

/**
 * Va después de ingresos y equipo a propósito: es el número más chico y no
 * debería competir visualmente con las ventas.
 */
export async function FinanzasGastos() {
  const gastos = await listarGastosFijos();
  const hoy = new Date().toISOString().slice(0, 7);

  const mensual = gastos
    .filter((g) => gastoVigente(g, hoy))
    .reduce((t, g) => t + costoMensual(g), 0);

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold">
          Gastos operativos
          {mensual > 0 && (
            <span className="tnum ml-2 text-sm font-normal text-text-3">
              {formatearMonto(mensual, "USD")}/mes
            </span>
          )}
        </h2>
        <GastoForm />
      </div>

      {gastos.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-text-3">
          Todavía no cargaste gastos operativos.
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
                      className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-text-3"
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
                const porMes = costoMensual(g);
                return (
                  <tr
                    key={g.id}
                    className={`fila-hover group/fila border-b border-line last:border-0 ${
                      vigente ? "" : "opacity-50"
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium">
                      {g.name}
                      {!vigente && g.period !== "once" && (
                        <span className="ml-2 text-xs text-text-3">
                          dado de baja
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-text-2">
                      {LABEL_CATEGORIA_GASTO[g.category]}
                    </td>
                    <td className="tnum px-4 py-2.5">
                      {formatearMonto(g.amount, g.currency)}
                    </td>
                    <td className="px-4 py-2.5 text-text-2">
                      {LABEL_PERIODO[g.period]}
                    </td>
                    <td className="tnum px-4 py-2.5 text-text-2">
                      {/* Un gasto único no se prorratea: no se repite. */}
                      {g.period === "once"
                        ? "—"
                        : formatearMonto(porMes, g.currency)}
                    </td>
                    <td className="px-4 py-2.5">
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
  );
}
