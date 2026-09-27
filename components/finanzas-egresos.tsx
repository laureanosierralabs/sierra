import Link from "next/link";
import {
  listarAcuerdos,
  listarClientes,
  listarProyectos,
} from "@/lib/landing/datos";
import {
  codigoAcuerdo,
  formatearMonto,
  pendienteDePago,
} from "@/lib/landing/tipos";
import { EstadoPagoPill } from "@/components/landing/ui";
import { AcuerdoForm } from "@/components/landing/acuerdo-form";

/** Los egresos hacia el equipo, al lado de los ingresos para compararlos. */
export async function FinanzasEgresos() {
  const [acuerdos, proyectos, clientes] = await Promise.all([
    listarAcuerdos(),
    listarProyectos(),
    listarClientes(),
  ]);

  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));
  const total = acuerdos.reduce((t, a) => t + (a.total_amount ?? 0), 0);

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">
          Egresos: equipo
          {total > 0 && (
            <span className="tnum ml-2 text-sm font-normal text-text-3">
              {formatearMonto(total, "USD")} comprometidos
            </span>
          )}
        </h2>
        <AcuerdoForm proyectos={proyectos} clientes={clientes} />
      </div>

      {acuerdos.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-sm text-text-3">
          Todavía no hay acuerdos con el equipo.
        </p>
      ) : (

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {[
                "Acuerdo",
                "Para",
                "Proyectos",
                "Fecha",
                "Monto",
                "Pagado",
                "Resta",
                "Estado",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {acuerdos.map((a) => {
              const nombres = a.project_ids
                .map((id) => proyectoPor.get(id))
                .filter((n): n is string => Boolean(n));
              const resta = pendienteDePago(a);

              return (
                <tr
                  key={a.id}
                  className="fila-hover border-b border-line last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/landing-pages/finanzas/acuerdo/${a.id}`}
                      className="block font-medium hover:underline"
                    >
                      {a.title}
                    </Link>
                    <span className="tnum text-xs text-text-3">
                      {codigoAcuerdo(a.numero)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-text-2">{a.member_name}</td>

                  <td className="px-4 py-3 text-text-2">
                    {nombres.length === 0 ? (
                      <span className="text-text-3">Por horas</span>
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

                  <td className="tnum px-4 py-3 text-text-2">
                    {a.agreed_on ?? <span className="text-text-3">—</span>}
                  </td>

                  <td className="tnum px-4 py-3 font-medium">
                    {formatearMonto(a.total_amount, a.currency)}
                  </td>

                  <td className="tnum px-4 py-3 text-text-2">
                    {a.amount_paid > 0
                      ? formatearMonto(a.amount_paid, a.currency)
                      : "—"}
                  </td>

                  <td className="tnum px-4 py-3">
                    {resta > 0 ? (
                      <span className="text-warn">
                        {formatearMonto(resta, a.currency)}
                      </span>
                    ) : (
                      <span className="text-text-3">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <EstadoPagoPill estado={a.payment_status} />
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
