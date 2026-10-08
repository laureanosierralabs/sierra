import Link from "next/link";
import {
  Bolt1,
  Buildings11,
  Calendar,
  CalendarTime,
  CheckCircle1,
  ExpandArrowTopRightSquare1,
  FileText,
  Globe2,
  Target3,
  User2,
} from "@tailgrids/icons";
import { EstadoSelect } from "@/components/landing/estado-select";
import { EtapaSelect } from "@/components/landing/etapa-select";
import { PortadaPatron } from "@/components/landing/portada-patron";
import { Propiedad } from "@/components/landing/propiedad";
import { EstadoPagoPill, Prioridad, Vencimiento } from "@/components/landing/ui";
import { Card } from "@/components/tailgrids/core/card";
import type { RecursoVista } from "@/lib/landing/datos";
import {
  codigoCotizacion,
  formatearMonto,
  nombreCliente,
  type Cotizacion,
  type Proyecto,
} from "@/lib/landing/tipos";

const ENLACE =
  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

/** Ficha del proyecto: portada, propiedades editables y accesos directos. */
export function ProyectoPropiedades({
  proyecto,
  responsables,
  clientePor,
  cotizaciones,
  verCotizacion,
  recursos,
}: {
  proyecto: Proyecto;
  responsables: string | null;
  clientePor: Map<string, string>;
  cotizaciones: Cotizacion[];
  /** Lo cotizado es información del owner. */
  verCotizacion: boolean;
  recursos: RecursoVista[];
}) {
  const enlaces = recursos.filter((r) => r.url);
  const cliente = nombreCliente(proyecto, clientePor) ?? "—";

  return (
    <Card className="mb-8 overflow-hidden p-0">
      <PortadaPatron titulo={proyecto.name} alto="h-36" />

      <div className="grid gap-x-10 px-5 py-3 md:grid-cols-2">
        <Propiedad icono={CheckCircle1} label="Estado">
          <EstadoSelect id={proyecto.id} valor={proyecto.status} tipo="proyecto" />
        </Propiedad>

        <Propiedad icono={Target3} label="Etapa">
          <EtapaSelect id={proyecto.id} valor={proyecto.stage} />
        </Propiedad>

        <Propiedad icono={User2} label="Responsables">
          <p className="truncate">{responsables ?? "—"}</p>
        </Propiedad>

        <Propiedad icono={Buildings11} label="Cliente">
          {proyecto.client_id ? (
            <Link
              href={`/landing-pages/clients/${proyecto.client_id}`}
              className="block truncate font-medium hover:underline"
            >
              {cliente}
            </Link>
          ) : (
            <p className="truncate">{cliente}</p>
          )}
        </Propiedad>

        <Propiedad icono={Bolt1} label="Prioridad">
          <Prioridad prioridad={proyecto.priority} />
        </Propiedad>

        <Propiedad icono={Calendar} label="Inicio">
          <p className="tabular-nums text-text-secondary">{proyecto.start_date ?? "—"}</p>
        </Propiedad>

        <Propiedad icono={CalendarTime} label="Entrega">
          <Vencimiento fecha={proyecto.due_date} cerrado={proyecto.status === "entregado"} />
        </Propiedad>

        {/* Un proyecto puede estar cubierto por más de una cotización:
            la inicial y después una ampliación de alcance. */}
        {verCotizacion && (
          <Propiedad icono={FileText} label="Cotización">
            {cotizaciones.length === 0 ? (
              <p className="text-text-tertiary">—</p>
            ) : (
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {cotizaciones.map((q) => (
                  <Link
                    key={q.id}
                    href={`/landing-pages/quotes/${q.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-card-border bg-background-gray-secondary px-2 py-1 text-xs transition-colors hover:border-primary-300"
                  >
                    <span className="tabular-nums text-text-tertiary">
                      {codigoCotizacion(q.numero)}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatearMonto(q.total_amount, q.currency)}
                    </span>
                    <EstadoPagoPill estado={q.payment_status} />
                  </Link>
                ))}
              </span>
            )}
          </Propiedad>
        )}
      </div>

      {/* Los links que se usan todo el día, sin scrollear hasta Recursos */}
      {(proyecto.site_url || enlaces.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-card-border px-5 py-3">
          {proyecto.site_url && (
            <a
              href={proyecto.site_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ENLACE} border-transparent bg-badge-success-background text-badge-success-text hover:opacity-80`}
            >
              <Globe2 className="size-4" />
              Ver sitio
              <ExpandArrowTopRightSquare1 className="size-4 opacity-60" />
            </a>
          )}
          {enlaces.map((r) => (
            <a
              key={r.id}
              href={r.url!}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ENLACE} border-card-border bg-card-background text-text-secondary hover:bg-background-gray-secondary hover:text-text-primary`}
            >
              {r.name}
              <ExpandArrowTopRightSquare1 className="size-4 text-text-tertiary" />
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
