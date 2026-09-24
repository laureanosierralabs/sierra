"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, MessageSquareText, Pencil } from "lucide-react";
import {
  DialogoForm,
  Campo,
  Input,
  Textarea,
} from "@/components/landing/dialogo-form";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { SeccionTitulo } from "@/components/landing/ui";
import {
  borrarNotaCliente,
  guardarNotaCliente,
} from "@/app/landing-pages/acciones";
import type { NotaCliente } from "@/lib/landing/tipos";

function NotaForm({
  clientId,
  nota,
}: {
  clientId: string;
  nota?: NotaCliente;
}) {
  const editar = Boolean(nota);

  return (
    <DialogoForm
      titulo={editar ? "Editar reunión" : "Nueva reunión"}
      etiquetaAbrir="Nueva reunión"
      action={guardarNotaCliente}
      disparador={editar ? <Pencil className="size-3.5" /> : undefined}
    >
      <input type="hidden" name="client_id" value={clientId} />
      {nota && <input type="hidden" name="id" value={nota.id} />}

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <Campo label="Título">
          <Input
            name="title"
            required
            placeholder="Kickoff, revisión de diseño…"
            defaultValue={nota?.title ?? ""}
          />
        </Campo>

        <Campo label="Fecha">
          <Input
            type="date"
            name="meeting_date"
            defaultValue={nota?.meeting_date ?? ""}
          />
        </Campo>
      </div>

      <Campo label="Link a la grabación">
        <Input
          name="url"
          placeholder="https://fathom.video/…"
          defaultValue={nota?.url ?? ""}
        />
      </Campo>

      <Campo label="Transcripción o notas">
        <Textarea
          name="body"
          rows={10}
          placeholder="Pegá acá la transcripción de Fathom o tus notas…"
          defaultValue={nota?.body ?? ""}
        />
      </Campo>
    </DialogoForm>
  );
}

function Nota({ nota, clientId }: { nota: NotaCliente; clientId: string }) {
  const [abierta, setAbierta] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-surface-2">
        <span className="flex min-w-0 items-center gap-2.5">
          {nota.body ? (
            <button
              type="button"
              onClick={() => setAbierta((v) => !v)}
              aria-expanded={abierta}
              className="shrink-0 text-text-3 transition-colors hover:text-text"
            >
              <ChevronDown
                className={`size-3.5 transition-transform ${abierta ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <span className="size-3.5 shrink-0" />
          )}

          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{nota.title}</span>
              {nota.url && (
                <a
                  href={nota.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[0.6875rem] text-text-3 hover:text-text"
                >
                  Grabación
                  <ExternalLink className="size-3" />
                </a>
              )}
            </span>
            {nota.meeting_date && (
              <span className="tnum text-xs text-text-3">
                {nota.meeting_date}
              </span>
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
        <pre className="whitespace-pre-wrap border-t border-line bg-surface-2/40 px-4 py-3 font-sans text-sm leading-relaxed text-text-2">
          {nota.body}
        </pre>
      )}
    </div>
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
      <SeccionTitulo
        icono={MessageSquareText}
        accion={<NotaForm clientId={clientId} />}
      >
        Reuniones y transcripciones
      </SeccionTitulo>

      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {notas.length === 0 && (
          <p className="px-4 py-6 text-sm text-text-3">
            Sin reuniones cargadas.
          </p>
        )}
        {notas.map((n) => (
          <Nota key={n.id} nota={n} clientId={clientId} />
        ))}
      </div>
    </section>
  );
}
