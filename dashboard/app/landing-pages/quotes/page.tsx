import { ExternalLink } from "lucide-react";
import {
  listarClientes,
  listarCotizaciones,
  listarProyectos,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { formatearMonto } from "@/lib/landing/tipos";
import { PageHeader, VacioTabla } from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { CotizacionForm } from "@/components/landing/cotizacion-form";
import { CrearProyectoDesdeCotizacion } from "@/components/landing/crear-proyecto-desde-cotizacion";
import { BorrarCotizacion } from "@/components/landing/borrar";

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Cotización",
  "Cliente",
  "Servicio",
  "Valor",
  "Estado",
  "Envío",
  "",
];

export default async function CotizacionesPage() {
  const [cotizaciones, clientes, proyectos, miembros] = await Promise.all([
    listarCotizaciones(),
    listarClientes(),
    listarProyectos(),
    listarMiembros(),
  ]);

  const nombrePor = new Map(clientes.map((c) => [c.id, c.name]));
  const yaTieneProyecto = new Set(
    proyectos.map((p) => p.quote_id).filter((q): q is string => Boolean(q)),
  );

  return (
    <>
      <PageHeader
        titulo="Cotizaciones"
        descripcion={`${cotizaciones.length} ${cotizaciones.length === 1 ? "cotización" : "cotizaciones"}`}
        accion={<CotizacionForm clientes={clientes} />}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
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
            {cotizaciones.length === 0 && (
              <VacioTabla colSpan={COLUMNAS.length}>
                Todavía no hay cotizaciones.
              </VacioTabla>
            )}
            {cotizaciones.map((q) => (
              <tr
                key={q.id}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3 font-medium">
                  <span className="flex items-center gap-2">
                    {q.title}
                    {q.proposal_url && (
                      <a
                        href={q.proposal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Abrir propuesta"
                        className="text-text-3 transition-colors hover:text-text"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-2">
                  {q.client_id ? (nombrePor.get(q.client_id) ?? "—") : "—"}
                </td>
                <td className="px-4 py-3 text-text-2">{q.service ?? "—"}</td>
                <td className="tnum px-4 py-3 text-text-2">
                  {formatearMonto(q.amount, q.currency)}
                </td>
                <td className="px-4 py-3">
                  <EstadoSelect id={q.id} valor={q.status} tipo="cotizacion" />
                </td>
                <td className="tnum px-4 py-3 text-text-2">
                  {q.sent_at ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center justify-end gap-3">
                    {q.status === "aprobada" && !yaTieneProyecto.has(q.id) && (
                      <CrearProyectoDesdeCotizacion
                        cotizacion={q}
                        miembros={miembros}
                        clientes={clientes}
                      />
                    )}
                    <CotizacionForm clientes={clientes} cotizacion={q} />
                    <BorrarCotizacion id={q.id} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
