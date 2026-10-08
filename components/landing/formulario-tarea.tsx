"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { guardarCampoTarea } from "@/app/landing-pages/acciones";
import { FormError } from "@/components/common/form/form-error";
import { CampoRender } from "@/components/landing/campo-render";
import { errorDeValorCampo } from "@/components/landing/formulario-tarea-esquema";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";
import type {
  Campo,
  Contenido,
  ItemChecklist,
  Plantilla,
  ValorCampo,
} from "@/lib/landing/plantillas";

/** Formulario de la tarea. Cada campo se guarda por separado al cambiar. */
export function FormularioTarea({
  taskId,
  plantilla,
  pasos = [],
  contenido,
  columnas = 2,
}: {
  taskId: string;
  plantilla: Plantilla | null;
  /** Checklist que vino del SOP al crear el proyecto. */
  pasos?: ItemChecklist[];
  contenido: Contenido;
  columnas?: 1 | 2;
}) {
  const [valores, setValores] = useState<Contenido>(contenido);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  // El checklist del SOP va primero; después los campos de la plantilla.
  const secciones = [
    ...(pasos.length > 0
      ? [
          {
            id: "__sop__",
            titulo: "Checklist",
            campos: [
              {
                id: "pasos",
                label: "",
                tipo: "checklist" as const,
                items: pasos,
              },
            ],
          },
        ]
      : []),
    ...(plantilla?.secciones ?? []),
  ];

  function guardar(campo: Campo, valor: ValorCampo) {
    const invalido = errorDeValorCampo(campo, valor);
    if (invalido) {
      setError(invalido);
      toast.error(invalido);
      return;
    }

    setValores((v) => ({ ...v, [campo.id]: valor }));
    setError(null);
    iniciar(async () => {
      try {
        await guardarCampoTarea(taskId, campo.id, valor);
      } catch (e) {
        const mensaje = e instanceof Error ? e.message : "No se pudo guardar";
        setError(mensaje);
        toast.error(mensaje);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end text-xs text-text-tertiary" aria-live="polite">
        {pendiente ? "Guardando…" : error ? "" : "Guardado automático"}
      </div>

      <FormError message={error} title="No se pudo guardar" />

      {secciones.map((s) => (
        <Card key={s.id} className="p-5">
          <h2 className="mb-4 border-b border-card-border pb-2 text-base font-semibold text-title-50">
            {s.titulo}
          </h2>
          <div
            className={cn("grid gap-x-10 gap-y-5", columnas === 2 && "md:grid-cols-2")}
          >
            {s.campos.map((c) => (
              <div
                key={c.id}
                // Un checklist partido en dos columnas se lee mal.
                className={
                  c.tipo === "checklist" || c.tipo === "checklist-libre"
                    ? "md:col-span-2"
                    : ""
                }
              >
                <CampoRender
                  campo={c}
                  valor={valores[c.id] ?? null}
                  onCambio={(v) => guardar(c, v)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
