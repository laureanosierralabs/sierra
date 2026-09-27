import Link from "next/link";
import type { Balance } from "@/lib/landing/balance";
import { formatearMonto } from "@/lib/landing/tipos";
import { MargenPorProyecto } from "@/components/landing/graficos-finanzas";

function pct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(1)}%`;
}

function tonoMargen(v: number | null): string {
  if (v === null) return "text-text-3";
  if (v < 0) return "text-critical";
  if (v < 30) return "text-warn";
  return "text-ok";
}

/**
 * Margen por proyecto y por cliente. Un proyecto cubierto por una cotización
 * de varios sin allocated_amount queda "sin asignar": repartir el total por
 * promedio daría un margen inventado.
 */
export function FinanzasRentabilidad({ balance }: { balance: Balance }) {
  const { margenes, margenesCliente } = balance;

  const conMargen = margenes.filter((m) => m.margenPct !== null);
  const sinAsignar = margenes.filter((m) => m.ingreso === null);

  const paraGrafico = conMargen
    .slice(0, 8)
    .map((m) => ({ nombre: m.nombre, margenPct: m.margenPct! }));

  return (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-base font-bold">Rentabilidad</h2>

      {margenes.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-sm text-text-3">
          Todavía no hay proyectos con ingreso o costo asociado.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {paraGrafico.length > 0 && <MargenPorProyecto datos={paraGrafico} />}

          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {["Proyecto", "Cliente", "Ingreso", "Equipo", "Margen", "%"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-text-3"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {margenes.map((m) => (
                  <tr
                    key={m.id}
                    className="fila-hover border-b border-line last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium">
                      <Link
                        href={`/landing-pages/projects/${m.id}`}
                        className="hover:underline"
                      >
                        {m.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-text-2">
                      {m.cliente ?? "—"}
                    </td>
                    <td className="tnum px-4 py-2.5">
                      {m.ingreso === null ? (
                        <span
                          title="La cotización cubre varios proyectos y no tiene monto asignado"
                          className="text-xs text-text-3"
                        >
                          Sin asignar
                        </span>
                      ) : (
                        formatearMonto(m.ingreso, m.currency)
                      )}
                    </td>
                    <td className="tnum px-4 py-2.5 text-text-2">
                      {m.costo > 0 ? formatearMonto(m.costo, m.currency) : "—"}
                    </td>
                    <td className={`tnum px-4 py-2.5 font-medium ${tonoMargen(m.margenPct)}`}>
                      {m.margen === null
                        ? "—"
                        : formatearMonto(m.margen, m.currency)}
                    </td>
                    <td className={`tnum px-4 py-2.5 ${tonoMargen(m.margenPct)}`}>
                      {pct(m.margenPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sinAsignar.length > 0 && (
            <p className="text-xs text-text-3">
              {sinAsignar.length}{" "}
              {sinAsignar.length === 1 ? "proyecto" : "proyectos"} sin ingreso
              asignado: su cotización cubre varios proyectos. Cargá el monto de
              cada uno al editarla para ver su margen.
            </p>
          )}

          {margenesCliente.length > 0 && (
            <div>
              <h3 className="eyebrow mb-2">Por cliente</h3>
              <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      {["Cliente", "Ingreso", "Equipo", "Margen", "%"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-text-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {margenesCliente.map((c) => (
                      <tr
                        key={c.cliente}
                        className="fila-hover border-b border-line last:border-0"
                      >
                        <td className="px-4 py-2.5 font-medium">{c.cliente}</td>
                        <td className="tnum px-4 py-2.5">
                          {formatearMonto(c.ingreso, c.currency)}
                        </td>
                        <td className="tnum px-4 py-2.5 text-text-2">
                          {c.costo > 0 ? formatearMonto(c.costo, c.currency) : "—"}
                        </td>
                        <td
                          className={`tnum px-4 py-2.5 font-medium ${tonoMargen(c.margenPct)}`}
                        >
                          {formatearMonto(c.margen, c.currency)}
                        </td>
                        <td className={`tnum px-4 py-2.5 ${tonoMargen(c.margenPct)}`}>
                          {pct(c.margenPct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-text-3">
                Agrupado por cuenta comercial. Acá el ingreso es el total de la
                cotización, así que no depende de tener montos asignados por
                proyecto.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
