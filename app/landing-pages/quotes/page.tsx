import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  listarClientes,
  listarCotizaciones,
  listarProyectos,
  obtenerAjuste,
} from "@/lib/landing/datos";
import {
  codigoCotizacion,
  formatearMonto,
  pendienteDeCobro,
} from "@/lib/landing/tipos";
import {
  EstadoCotizacionPill,
  EstadoPagoPill,
  PageHeader,
  VacioTabla,
} from "@/components/landing/ui";
import { CotizacionForm } from "@/components/landing/cotizacion-form";
import { BorrarCotizacion } from "@/components/landing/borrar";
import { PlantillaCotizacion } from "@/components/landing/plantilla-cotizacion";
import { Tabla, TablaHead } from "@/components/landing/tabla";

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Cotización",
  "Cliente",
  "Proyectos",
  "Total",
  "Estado",
  "Pago",
  "Pendiente",
  "Documento",
  "",
];

export default async function CotizacionesPage() {
  const [cotizaciones, clientes, proyectos, plantillaUrl] = await Promise.all([
    listarCotizaciones(),
    listarClientes(),
    listarProyectos(),
    obtenerAjuste("quote_template_url"),
  ]);

  const nombrePor = new Map(clientes.map((c) => [c.id, c.name]));
  const proyectoPor = new Map(proyectos.map((p) => [p.id, p.name]));

  return (
    <>
      <PageHeader
        titulo="Cotizaciones"
        descripcion={`${cotizaciones.length} ${cotizaciones.length === 1 ? "cotización" : "cotizaciones"}`}
        accion={<CotizacionForm clientes={clientes} proyectos={proyectos} />}
      />

      <PlantillaCotizacion url={plantillaUrl} />

      <Tabla filas={cotizaciones.length}>
        <table className="w-full min-w-200 text-sm">
          <TablaHead columnas={COLUMNAS} />
          <tbody>
            {cotizaciones.length === 0 && (
              <VacioTabla colSpan={COLUMNAS.length}>
                Todavía no hay cotizaciones.
              </VacioTabla>
            )}
            {cotizaciones.map((q) => {
              const nombres = q.project_ids
                .map((id) => proyectoPor.get(id))
                .filter((n): n is string => Boolean(n));
              const pendiente = pendienteDeCobro(q);

              return (
                <tr
                  key={q.id}
                  className="fila-hover group/fila border-b border-line last:border-0"
                >
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

                  {/* Con varios proyectos se nombra el primero y se cuenta el
                      resto: la lista entera no entra sin romper la tabla. */}
                  <td className="px-4 py-3 text-text-2">
                    {nombres.length === 0 ? (
                      <span className="text-text-3">—</span>
                    ) : (
                      <span title={nombres.join(" · ")} className="cursor-default">
                        <span className="truncate">{nombres[0]}</span>
                        {nombres.length > 1 && (
                          <span className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] font-medium text-text-3">
                            +{nombres.length - 1}
                          </span>
                        )}
                      </span>
                    )}
                  </td>

                  <td className="tnum px-4 py-3 font-medium">
                    {formatearMonto(q.total_amount, q.currency)}
                  </td>

                  <td className="px-4 py-3">
                    <EstadoCotizacionPill estado={q.commercial_status} />
                  </td>

                  <td className="px-4 py-3">
                    <EstadoPagoPill estado={q.payment_status} />
                  </td>

                  <td className="tnum px-4 py-3">
                    {pendiente > 0 ? (
                      <span className="text-warn">
                        {formatearMonto(pendiente, q.currency)}
                      </span>
                    ) : (
                      <span className="text-text-3">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {q.proposal_url ? (
                      <a
                        href={q.proposal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-text-2 transition-colors hover:border-line-strong hover:text-text"
                      >
                        Ver cotización
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-text-3">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover/fila:opacity-100 focus-within:opacity-100">
                      <CotizacionForm
                        clientes={clientes}
                        proyectos={proyectos}
                        cotizacion={q}
                      />
                      <BorrarCotizacion id={q.id} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Tabla>
    </>
  );
}
