import Link from "next/link";
import { listarClientes, listarCotizaciones, listarProyectos } from "@/lib/landing/datos";
import {
  codigoCotizacion,
  esCuentaPorCobrar,
  esPrevision,
  formatearMonto,
  pendienteDeCobro,
  type Cotizacion,
  type Moneda,
} from "@/lib/landing/tipos";
import {
  EstadoCotizacionPill,
  EstadoPagoPill,
} from "@/components/landing/ui";

/** Acumula por moneda: no se convierte nada, pesos y dólares van separados. */
type PorMoneda = Record<Moneda, number>;

function vacio(): PorMoneda {
  return { USD: 0, ARS: 0, EUR: 0 };
}

function sumar(acc: PorMoneda, q: Cotizacion, monto: number) {
  acc[q.currency] += monto;
}

function textoMontos(total: PorMoneda): string {
  const partes = (Object.entries(total) as [Moneda, number][])
    .filter(([, v]) => v !== 0)
    .map(([m, v]) => formatearMonto(v, m));
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

/**
 * Finanzas lee las cotizaciones directamente: no hay un movimiento espejo por
 * cada cobro. Una cotización que cubre tres proyectos suma una sola vez,
 * porque el importe vive en la cotización y no en cada proyecto.
 */
export async function FinanzasCotizaciones() {
  const [cotizaciones, clientes, proyectos] = await Promise.all([
    listarCotizaciones(),
    listarClientes(),
    listarProyectos(),
  ]);

  if (cotizaciones.length === 0) return null;

  const nombrePor = new Map(clientes.map((c) => [c.id, c.name]));
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));

  const cobrado = vacio();
  const porCobrar = vacio();
  const prevision = vacio();

  for (const q of cotizaciones) {
    if (q.amount_paid > 0) sumar(cobrado, q, q.amount_paid);

    // Solo lo aprobado es exigible. Un borrador todavía no lo aceptó nadie.
    if (esCuentaPorCobrar(q)) sumar(porCobrar, q, pendienteDeCobro(q));
    else if (esPrevision(q)) sumar(prevision, q, q.total_amount ?? 0);
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Cotizaciones</h2>
        <Link
          href="/landing-pages/quotes"
          className="text-xs text-text-3 transition-colors hover:text-text"
        >
          Ver todas
        </Link>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Bloque
          titulo="Cobrado"
          detalle="Dinero efectivamente recibido"
          total={cobrado}
          clase="text-ok"
        />
        <Bloque
          titulo="Pendiente de cobro"
          detalle="Aprobadas con saldo impago"
          total={porCobrar}
          clase="text-warn"
        />
        <Bloque
          titulo="Previsión"
          detalle="Borradores y enviadas, sin cerrar"
          total={prevision}
          clase="text-text-2"
        />
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
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
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
                  <td className="px-4 py-3 text-text-2">
                    {q.client_id ? (nombrePor.get(q.client_id) ?? "—") : "—"}
                  </td>

                  <td className="px-4 py-3">
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

                  <td className="px-4 py-3 text-text-2">
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

                  <td className="tnum px-4 py-3 font-medium">
                    {formatearMonto(q.total_amount, q.currency)}
                  </td>

                  <td className="tnum px-4 py-3">
                    {q.amount_paid > 0 ? (
                      <span className="text-ok">
                        {formatearMonto(q.amount_paid, q.currency)}
                      </span>
                    ) : (
                      <span className="text-text-3">—</span>
                    )}
                  </td>

                  <td className="tnum px-4 py-3">
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

                  <td className="px-4 py-3">
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
