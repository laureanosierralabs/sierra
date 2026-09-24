"use client";

import Link from "next/link";
import {
  EstadoProyectoPill,
  Prioridad,
  Vencimiento,
} from "@/components/landing/ui";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { DuplicarProyecto } from "@/components/landing/duplicar-proyecto";
import { BorrarProyecto } from "@/components/landing/borrar";
import {
  LABEL_ETAPA,
  nombreCliente,
  type Cliente,
  type Miembro,
  type Proyecto,
} from "@/lib/landing/tipos";

function Portada({
  proyecto,
  cliente,
}: {
  proyecto: Proyecto;
  cliente: string | null;
}) {
  if (proyecto.cover_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={proyecto.cover_url}
        alt=""
        className="h-28 w-full border-b border-line object-cover"
      />
    );
  }

  return (
    <div className="flex h-28 items-center justify-center border-b border-line bg-idle-dim px-4">
      <p className="line-clamp-2 text-center text-sm font-semibold uppercase tracking-wide text-idle">
        {cliente ?? proyecto.name}
      </p>
    </div>
  );
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
            <Link href={`/landing-pages/projects/${p.id}`} className="block">
              <Portada proyecto={p} cliente={cliente} />
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
                <Prioridad prioridad={p.priority} />
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2">
                <span className="truncate text-xs text-text-3">
                  {p.stage ? LABEL_ETAPA[p.stage] : (responsable ?? "—")}
                </span>
                <Vencimiento fecha={p.due_date} />
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
