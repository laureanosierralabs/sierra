import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  listarAcuerdos,
  listarClientes,
  listarCotizaciones,
  listarProyectos,
} from "@/lib/landing/datos";
import {
  codigoAcuerdo,
  formatearMonto,
  pendienteDePago,
  type Cotizacion,
} from "@/lib/landing/tipos";
import {
  EstadoPagoPill,
  PageHeader,
  VacioTabla,
} from "@/components/landing/ui";
import { AcuerdoForm } from "@/components/landing/acuerdo-form";
import { BorrarAcuerdo } from "@/components/landing/borrar";

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Acuerdo",
  "Para",
  "Proyectos",
  "Monto",
  "Pagado",
  "Resta",
  "Estado",
  "",
];

/**
 * Pagar al equipo por un trabajo que todavía no cobraste es poner plata de
 * tu bolsillo. Conviene verlo, no descubrirlo a fin de mes.
 */
function adelantados(
  acuerdos: Awaited<ReturnType<typeof listarAcuerdos>>,
  cotizaciones: Cotizacion[],
) {
  const cobradoPorProyecto = new Map<string, boolean>();
  for (const q of cotizaciones) {
    const cobrada = q.amount_paid > 0;
    for (const pid of q.project_ids) {
      cobradoPorProyecto.set(pid, (cobradoPorProyecto.get(pid) ?? false) || cobrada);
    }
  }

  return acuerdos.filter(
    (a) =>
      a.amount_paid > 0 &&
      a.project_ids.length > 0 &&
      a.project_ids.every((pid) => !cobradoPorProyecto.get(pid)),
  );
}

export default async function CostosPage() {
  const [acuerdos, proyectos, clientes, cotizaciones] = await Promise.all([
    listarAcuerdos(),
    listarProyectos(),
    listarClientes(),
    listarCotizaciones(),
  ]);

  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));
  const enRiesgo = adelantados(acuerdos, cotizaciones);

  const totalComprometido = acuerdos.reduce(
    (t, a) => t + (a.total_amount ?? 0),
    0,
  );
  const totalPagado = acuerdos.reduce((t, a) => t + a.amount_paid, 0);

  return (
    <>
      <PageHeader
        titulo="Costos de equipo"
        descripcion={`${formatearMonto(totalPagado, "USD")} pagados de ${formatearMonto(totalComprometido, "USD")} comprometidos`}
        accion={<AcuerdoForm proyectos={proyectos} clientes={clientes} />}
      />

      {enRiesgo.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-warn/25 bg-warn-dim p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-warn">
              Plata adelantada de tu bolsillo
            </p>
            <p className="mt-1 text-xs text-text-2">
              Ya pagaste estos trabajos pero todavía no cobraste su cotización:
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {enRiesgo.map((a) => (
                <li key={a.id} className="text-xs">
                  <Link
                    href={`/landing-pages/costos/${a.id}`}
                    className="font-medium hover:underline"
                  >
                    {a.title}
                  </Link>
                  <span className="tnum ml-1 text-text-2">
                    — {formatearMonto(a.amount_paid, a.currency)} a{" "}
                    {a.member_name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="vidrio border-b border-line text-left">
              {COLUMNAS.map((h, i) => (
                <th
                  key={h || i}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {acuerdos.length === 0 && (
              <VacioTabla colSpan={COLUMNAS.length}>
                Todavía no hay acuerdos con el equipo.
              </VacioTabla>
            )}
            {acuerdos.map((a) => {
              const nombres = a.project_ids
                .map((id) => proyectoPor.get(id))
                .filter((n): n is string => Boolean(n));
              const resta = pendienteDePago(a);

              return (
                <tr
                  key={a.id}
                  className="fila-hover group/fila border-b border-line last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/landing-pages/costos/${a.id}`}
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

                  <td className="tnum px-4 py-3 font-medium">
                    {formatearMonto(a.total_amount, a.currency)}
                  </td>

                  <td className="tnum px-4 py-3">
                    {a.amount_paid > 0 ? (
                      <span className="text-text-2">
                        {formatearMonto(a.amount_paid, a.currency)}
                      </span>
                    ) : (
                      <span className="text-text-3">—</span>
                    )}
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

                  <td className="px-4 py-3">
                    <span className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover/fila:opacity-100 focus-within:opacity-100">
                      <AcuerdoForm
                        proyectos={proyectos}
                        clientes={clientes}
                        acuerdo={a}
                      />
                      <BorrarAcuerdo id={a.id} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
