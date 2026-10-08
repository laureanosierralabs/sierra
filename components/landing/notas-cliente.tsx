"use client";

import { useState } from "react";
import { ChevronDown, ExpandArrowTopRightSquare1, Message1 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { NotaForm } from "@/components/landing/nota-form";
import { SeccionTitulo } from "@/components/landing/ui";
import { Card } from "@/components/tailgrids/core/card";
import { borrarNotaCliente } from "@/app/landing-pages/acciones";
import type { NotaCliente } from "@/lib/landing/tipos";
import { cn } from "@/utils/cn";

function Nota({ nota, clientId }: { nota: NotaCliente; clientId: string }) {
  const [abierta, setAbierta] = useState(false);

  return (
    <li>
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-background-gray-secondary">
        <span className="flex min-w-0 items-center gap-2.5">
          {nota.body ? (
            <button
              type="button"
              onClick={() => setAbierta((v) => !v)}
              aria-expanded={abierta}
              aria-label="Transcripción"
              className="shrink-0 rounded text-text-tertiary transition-colors outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-4"
            >
              <ChevronDown className={cn("transition-transform", abierta && "rotate-180")} />
            </button>
          ) : (
            <span className="size-4 shrink-0" />
          )}

          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium text-text-primary">{nota.title}</span>
              {nota.url && (
                <a
                  href={nota.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary [&>svg]:size-3.5"
                >
                  Grabación
                  <ExpandArrowTopRightSquare1 />
                </a>
              )}
            </span>
            {nota.meeting_date && (
              <span className="text-xs tabular-nums text-text-tertiary">{nota.meeting_date}</span>
            )}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-3">
          <NotaForm clientId={clientId} nota={nota} />
          <BorrarBoton
            etiqueta="Borrar reunión"
            onConfirmar={() => borrarNotaCliente(nota.id, clientId)}
          />
        </span>
      </div>

      {abierta && nota.body && (
        <pre className="border-t border-card-border bg-background-gray-secondary px-4 py-3 font-sans text-sm leading-relaxed whitespace-pre-wrap text-text-secondary">
          {nota.body}
        </pre>
      )}
    </li>
  );
}

export function NotasCliente({
  clientId,
  notas,
}: {
  clientId: string;
  notas: NotaCliente[];
}) {
  return (
    <section>
      <SeccionTitulo icono={Message1} accion={<NotaForm clientId={clientId} />}>
        Reuniones y transcripciones
      </SeccionTitulo>

      {notas.length === 0 ? (
        <EmptyState title="Sin reuniones cargadas" />
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-card-border">
            {notas.map((n) => (
              <Nota key={n.id} nota={n} clientId={clientId} />
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
