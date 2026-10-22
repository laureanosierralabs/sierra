"use client";

import { Pencil1 } from "@tailgrids/icons";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { Campo, DialogoForm, Input, Textarea } from "@/components/landing/dialogo-form";
import { borrarElementoBiblioteca, guardarElementoBiblioteca } from "@/app/landing-pages/acciones";
import type { ElementoBiblioteca } from "@/lib/landing/propuesta";

/** Alta o edición de un texto de la biblioteca ("incluye" o pregunta con respuesta). */
export function ElementoBibliotecaForm({
  kind,
  elemento,
}: {
  kind: ElementoBiblioteca["kind"];
  elemento?: ElementoBiblioteca;
}) {
  const pregunta = kind === "pregunta";
  return (
    <DialogoForm
      titulo={elemento ? "Editar" : pregunta ? "Nueva pregunta" : "Nuevo ítem"}
      etiquetaAbrir={pregunta ? "Agregar pregunta" : "Agregar ítem"}
      action={guardarElementoBiblioteca}
      disparador={elemento ? <Pencil1 /> : undefined}
    >
      <input type="hidden" name="kind" value={kind} />
      {elemento && <input type="hidden" name="id" value={elemento.id} />}
      <Campo label={pregunta ? "Pregunta" : "Qué incluye"}>
        <Input
          name="title"
          required
          maxLength={300}
          defaultValue={elemento?.title ?? ""}
          placeholder={pregunta ? "¿Cómo son las formas de pago?" : "Integración del checkout de Stripe con GHL"}
        />
      </Campo>
      {pregunta && (
        <Campo label="Respuesta">
          <Textarea
            name="body"
            required
            rows={5}
            maxLength={2000}
            defaultValue={elemento?.body ?? ""}
            placeholder="Una línea por ítem si querés que salga como lista."
          />
        </Campo>
      )}
      <p className="text-xs text-text-tertiary">
        Cambiar un texto acá no modifica las cotizaciones ya armadas: cada una guarda su copia.
      </p>
    </DialogoForm>
  );
}

export function FilaBiblioteca({ elemento }: { elemento: ElementoBiblioteca }) {
  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-text-primary">{elemento.title}</span>
        {elemento.body && (
          <span className="mt-0.5 block text-sm whitespace-pre-line text-text-secondary">{elemento.body}</span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <ElementoBibliotecaForm kind={elemento.kind} elemento={elemento} />
        <BorrarBoton etiqueta="Borrar de la biblioteca" onConfirmar={() => borrarElementoBiblioteca(elemento.id)} />
      </span>
    </li>
  );
}
