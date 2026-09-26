"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import {
  EstadoProyectoPill,
  Prioridad,
  Vencimiento,
} from "@/components/landing/ui";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { DuplicarProyecto } from "@/components/landing/duplicar-proyecto";
import { BorrarProyecto } from "@/components/landing/borrar";
import { PortadaPatron } from "@/components/landing/portada-patron";
import {
  LABEL_ETAPA,
  LABEL_TIPO_PAGINA_CORTO,
  nombreCliente,
  type Cliente,
  type Miembro,
  type Proyecto,
} from "@/lib/landing/tipos";

/**
 * Portada del proyecto. Patrón compartido por todos: la subida de imagen
 * propia quedó en el código (SubirPortada, cover_url) pero no se ofrece, para
 * que la lista se lea como un sistema y no como portadas sueltas.
 */
function Portada({
  proyecto,
  cliente,
}: {
  proyecto: Proyecto;
  cliente: string | null;
}) {
  return <PortadaPatron titulo={cliente ?? proyecto.name} />;
}

export function ProyectoCards({
  proyectos,
  clientePor,
  nombreMiembro,
  clientes,
  miembros,
}: {
  proyectos: Proyecto[];
  clientePor: Map<string, string>;
  nombreMiembro: Map<string, string>;
  clientes: Cliente[];
  miembros: Miembro[];
}) {
  if (proyectos.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-sm text-text-3">
        Todavía no hay proyectos.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {proyectos.map((p) => {
        const cliente = nombreCliente(p, clientePor);
        const responsable = p.responsible_user_id
          ? (nombreMiembro.get(p.responsible_user_id) ?? null)
          : null;

        return (
          <div
            key={p.id}
            className="group/card flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong"
          >
            {/* Ya no hay botón de subir portada, así que puede ser un link:
                la zona grande de la card lleva al proyecto. */}
            <Link
              href={`/landing-pages/projects/${p.id}`}
              className="group/cover relative block"
            >
              <Portada proyecto={p} cliente={cliente} />
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover/cover:bg-black/20" />
            </Link>

            <div className="flex flex-1 flex-col gap-2 p-3">
              <div>
                <Link
                  href={`/landing-pages/projects/${p.id}`}
                  className="block truncate font-display text-sm font-bold hover:underline"
                >
                  {p.name}
                </Link>
                {cliente && (
                  <p className="truncate text-xs text-text-3">{cliente}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <EstadoProyectoPill estado={p.status} />
                {p.page_type && (
                  <span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-text-2">
                    {LABEL_TIPO_PAGINA_CORTO[p.page_type]}
                  </span>
                )}
                <Prioridad prioridad={p.priority} />
              </div>

              {p.site_url && (
                <a
                  href={p.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-center gap-1 text-xs text-text-3 transition-colors hover:text-text"
                >
                  <Globe className="size-3 shrink-0" />
                  <span className="truncate">
                    {p.site_url.replace(/^https?:\/\/(www\.)?/, "")}
                  </span>
                </a>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2">
                <span className="truncate text-xs text-text-3">
                  {p.stage ? LABEL_ETAPA[p.stage] : (responsable ?? "—")}
                </span>
                <Vencimiento fecha={p.due_date} cerrado={p.status === "entregado"} />
              </div>

              {/* Acciones al pie: la card ya no es un Link entero, así que
                  estos botones no compiten con la navegación. Siempre
                  visibles — en touch no hay hover que las revele. */}
              <div className="flex items-center justify-end gap-3 border-t border-line pt-2">
                <ProyectoForm
                  miembros={miembros}
                  clientes={clientes}
                  proyecto={p}
                />
                <DuplicarProyecto id={p.id} />
                <BorrarProyecto id={p.id} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
