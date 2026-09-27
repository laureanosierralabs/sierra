import Link from "next/link";
import {
  listarClientes,
  listarCotizaciones,
  listarProyectos,
} from "@/lib/landing/datos";
import {
  codigoCotizacion,
  esCuentaPorCobrar,
  formatearMonto,
  pendienteDeCobro,
} from "@/lib/landing/tipos";
import {
  EstadoCotizacionPill,
  EstadoPagoPill,
} from "@/components/landing/ui";

/**
 * Los ingresos salen de quotes directamente: no hay un movimiento espejo por
 * cada cobro. Una cotización que cubre tres proyectos suma una sola vez.
 * Los totales viven en el resumen de arriba, no se repiten acá.
 */
export async function FinanzasCotizaciones() {
  const [cotizaciones, clientes, proyectos] = await Promise.all([
    listarCotizaciones(),
    listarClientes(),
    listarProyectos(),
  ]);

  if (cotizaciones.length === 0) return null;

  const nombrePor = new Map(clientes.map((c) => [c.id, c.company ?? c.name]));
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold">
          Ingresos · Cotizaciones
          <span className="tnum ml-2 text-sm font-normal text-text-3">
            {cotizaciones.length}
          </span>
        </h2>
        <Link
          href="/landing-pages/quotes"
          className="text-xs text-text-3 transition-colors hover:text-text"
        >
          Gestionar cotizaciones →
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {[
                "Cliente",
                "Cotización",
                "Proyectos",
                "Total",
                "Cobrado",
                "Pendiente",
                "Estado",
              ].map((h) => (
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
            {cotizaciones.map((q) => {
              const nombres = q.project_ids
                .map((id) => proyectoPor.get(id))
                .filter((n): n is string => Boolean(n));
              const pendiente = pendienteDeCobro(q);

              return (
                <tr
                  key={q.id}
                  className="fila-hover border-b border-line last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-2">
                    {q.client_id ? (
                      <Link
                        href={`/landing-pages/clients/${q.client_id}`}
                        className="hover:underline"
                      >
                        {nombrePor.get(q.client_id) ?? "—"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    <Link
                      href={`/landing-pages/quotes/${q.id}`}
                      className="block font-medium hover:underline"
                    >
                      {q.title}
                    </Link>
                    <span className="tnum text-xs text-text-3">
                      {codigoCotizacion(q.numero)}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 text-text-2">
                    {nombres.length === 0 ? (
                      <span className="text-text-3">—</span>
                    ) : (
                      <span title={nombres.join(" · ")}>
                        {nombres[0]}
                        {nombres.length > 1 && (
                          <span className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] text-text-3">
                            +{nombres.length - 1}
                          </span>
                        )}
                      </span>
                    )}
                  </td>

                  <td className="tnum px-4 py-2.5 font-medium">
                    {formatearMonto(q.total_amount, q.currency)}
                  </td>

                  <td className="tnum px-4 py-2.5">
                    {q.amount_paid > 0 ? (
                      <span className="text-ok">
                        {formatearMonto(q.amount_paid, q.currency)}
                      </span>
                    ) : (
                      <span className="text-text-3">—</span>
                    )}
                  </td>

                  <td className="tnum px-4 py-2.5">
                    {pendiente > 0 ? (
                      <span
                        className={
                          esCuentaPorCobrar(q) ? "text-warn" : "text-text-3"
                        }
                      >
                        {formatearMonto(pendiente, q.currency)}
                      </span>
                    ) : (
                      <span className="text-text-3">—</span>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <EstadoCotizacionPill estado={q.commercial_status} />
                      <EstadoPagoPill estado={q.payment_status} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
