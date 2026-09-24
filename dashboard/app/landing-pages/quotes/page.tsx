import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  listarClientes,
  listarCotizaciones,
  listarProcesos,
  listarProyectos,
  obtenerAjuste,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { formatearMonto } from "@/lib/landing/tipos";
import { PageHeader, VacioTabla } from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { CotizacionForm } from "@/components/landing/cotizacion-form";
import { CrearProyectoDesdeCotizacion } from "@/components/landing/crear-proyecto-desde-cotizacion";
import { BorrarCotizacion } from "@/components/landing/borrar";
import { PlantillaCotizacion } from "@/components/landing/plantilla-cotizacion";
import { RegistrarCobro } from "@/components/landing/registrar-cobro";
import { DocumentoCotizacion } from "@/components/landing/documento-cotizacion";
import { ContactoCliente } from "@/components/landing/contacto-cliente";

export const dynamic = "force-dynamic";

const COLUMNAS = [
  "Cotización",
  "Cliente",
  "Contacto",
  "Servicio",
  "Valor",
  "Estado",
  "Envío",
  "Documento",
  "",
];

export default async function CotizacionesPage() {
  const [cotizaciones, clientes, proyectos, miembros, plantillaUrl, procesos] =
    await Promise.all([
      listarCotizaciones(),
      listarClientes(),
      listarProyectos(),
      listarMiembros(),
      obtenerAjuste("quote_template_url"),
      listarProcesos(),
    ]);

  const nombrePor = new Map(clientes.map((c) => [c.id, c.name]));
  const clientePor = new Map(clientes.map((c) => [c.id, c]));
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

      <PlantillaCotizacion url={plantillaUrl} />

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
                        className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-text-2 transition-colors hover:border-line-strong hover:text-text"
                      >
                        Propuesta
                        <ExternalLink className="size-3" />
                      </a>
                    )}
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
                <td className="px-4 py-3">
                  <ContactoCliente
                    cliente={q.client_id ? clientePor.get(q.client_id) : undefined}
                  />
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
                  <DocumentoCotizacion
                    quoteId={q.id}
                    tieneDocumento={Boolean(q.document_path)}
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center justify-end gap-3">
                    {q.status === "aprobada" && !q.movement_id && (
                      <RegistrarCobro
                        cotizacion={q}
                        cliente={
                          q.client_id
                            ? (nombrePor.get(q.client_id) ?? null)
                            : null
                        }
                      />
                    )}
                    {q.movement_id && (
                      <span
                        title="Cobro ya registrado en finanzas"
                        className="text-xs text-ok"
                      >
                        En finanzas
                      </span>
                    )}
                    {q.status === "aprobada" && !yaTieneProyecto.has(q.id) && (
                      <CrearProyectoDesdeCotizacion
                        cotizacion={q}
                        miembros={miembros}
                        clientes={clientes}
                        procesos={procesos}
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
