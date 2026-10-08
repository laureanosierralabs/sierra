"use client";

import Link from "next/link";
import { Globe2 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import {
  EstadoProyectoPill,
  Prioridad,
  TipoPaginaBadge,
  Vencimiento,
} from "@/components/landing/ui";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { DuplicarProyecto } from "@/components/landing/duplicar-proyecto";
import { BorrarProyecto } from "@/components/landing/borrar";
import { PortadaPatron } from "@/components/landing/portada-patron";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import type { ResumenCotizado } from "@/lib/landing/datos";
import {
  LABEL_ETAPA,
  formatearMonto,
  nombreCliente,
  type Cliente,
  type Miembro,
  type Proyecto,
} from "@/lib/landing/tipos";

export function ProyectoCards({
  proyectos,
  clientePor,
  nombreMiembro,
  cotizado,
  verCotizacion,
  clientes,
  miembros,
}: {
  proyectos: Proyecto[];
  clientePor: Map<string, string>;
  nombreMiembro: Map<string, string>;
  cotizado: Map<string, ResumenCotizado>;
  verCotizacion: boolean;
  clientes: Cliente[];
  miembros: Miembro[];
}) {
  if (proyectos.length === 0) {
    return <EmptyState title="Todavía no hay proyectos" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {proyectos.map((p) => {
        const cliente = nombreCliente(p, clientePor);
        const responsables = p.assignee_ids
          .map((id) => nombreMiembro.get(id))
          .filter((n): n is string => Boolean(n));
        const cotizacion = verCotizacion ? cotizado.get(p.id) : undefined;

        return (
          <Card
            key={p.id}
            className="flex flex-col overflow-hidden p-0 transition-colors hover:border-primary-300"
          >
            {/* La portada es el patrón común (la subida de imagen propia no se
                ofrece): la zona grande de la card lleva al proyecto. */}
            <Link
              href={`/landing-pages/projects/${p.id}`}
              aria-label={`Abrir ${p.name}`}
              className="group/cover relative block"
            >
              <PortadaPatron titulo={p.name} />
              <span className="pointer-events-none absolute inset-0 bg-primary-950/0 transition-colors group-hover/cover:bg-primary-950/30" />
            </Link>

            <div className="flex flex-1 flex-col gap-2 p-4">
              <div>
                <Link
                  href={`/landing-pages/projects/${p.id}`}
                  className="block truncate text-sm font-semibold text-text-primary hover:underline"
                >
                  {p.name}
                </Link>
                {cliente && <p className="truncate text-xs text-text-tertiary">{cliente}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <EstadoProyectoPill estado={p.status} />
                {p.page_type && <TipoPaginaBadge tipo={p.page_type} />}
                <Prioridad prioridad={p.priority} />
              </div>

              {p.site_url && (
                <a
                  href={p.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-center gap-1 text-xs text-text-tertiary transition-colors hover:text-text-primary"
                >
                  <Globe2 className="size-3 shrink-0" />
                  <span className="truncate">
                    {p.site_url.replace(/^https?:\/\/(www\.)?/, "")}
                  </span>
                </a>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-card-border pt-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-xs text-text-tertiary">
                    {p.stage
                      ? LABEL_ETAPA[p.stage]
                      : responsables.length > 0
                        ? responsables.join(", ")
                        : "—"}
                  </span>
                  {/* Solo el monto: el detalle financiero vive en la cotización. */}
                  {cotizacion && (
                    <Badge
                      color="gray"
                      size="sm"
                      title={`${cotizacion.cantidad} ${cotizacion.cantidad === 1 ? "cotización" : "cotizaciones"}`}
                      className="shrink-0 rounded-md tabular-nums"
                    >
                      {formatearMonto(cotizacion.total, cotizacion.currency)}
                    </Badge>
                  )}
                </span>
                <Vencimiento fecha={p.due_date} cerrado={p.status === "entregado"} />
              </div>

              {/* Acciones al pie, siempre visibles: en touch no hay hover. */}
              <div className="flex items-center justify-end gap-3 border-t border-card-border pt-2">
                <ProyectoForm miembros={miembros} clientes={clientes} proyecto={p} />
                <DuplicarProyecto id={p.id} />
                <BorrarProyecto id={p.id} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
