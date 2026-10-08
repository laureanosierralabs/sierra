"use client";

import { useState, useTransition } from "react";
import { ExpandArrowTopRightSquare1, Pencil1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { z } from "zod";
import { guardarAjuste } from "@/app/landing-pages/acciones";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { FieldError } from "@/components/tailgrids/core/field";
import { Input } from "@/components/tailgrids/core/input";
import { TextField } from "@/components/tailgrids/core/text-field";

const CLAVE = "quote_template_url";

/** Espejo de `guardarAjuste`: vacío (borra el link) o algo que empiece con http(s)://. */
const linkEsquema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "El link debe empezar con http:// o https://");

/** Link a la plantilla editable de cotizaciones. Es uno solo para todas. */
export function PlantillaCotizacion({ url }: { url: string | null }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function guardar() {
    setError(null);

    const resultado = linkEsquema.safeParse(valor);
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? "Link inválido");
      return;
    }

    iniciar(async () => {
      try {
        await guardarAjuste(CLAVE, valor);
        toast.success("Guardado");
        setEditando(false);
      } catch (e) {
        const mensaje = e instanceof Error ? e.message : "No se pudo guardar";
        setError(mensaje);
        toast.error(mensaje);
      }
    });
  }

  function cancelar() {
    setValor(url ?? "");
    setError(null);
    setEditando(false);
  }

  if (editando) {
    return (
      <Card className="mb-6 flex flex-col gap-2 px-4 py-3">
        <div className="flex flex-wrap items-start gap-2">
          <TextField
            aria-label="Link de la plantilla de cotización"
            value={valor}
            onChange={(v) => {
              setValor(v);
              setError(null);
            }}
            invalid={Boolean(error)}
            validationBehavior="aria"
            autoFocus
            className="min-w-0 flex-1 basis-64"
          >
            <Input
              placeholder="https://figma.com/…"
              onKeyDown={(e) => e.key === "Enter" && guardar()}
            />
            <FieldError>{error}</FieldError>
          </TextField>
          <Button isDisabled={pendiente} onPress={guardar}>
            {pendiente ? "Guardando…" : "Guardar"}
          </Button>
          <Button appearance="outline" isDisabled={pendiente} onPress={cancelar}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6 flex items-center justify-between gap-3 px-4 py-3">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-text-primary hover:underline"
        >
          <span className="truncate">Plantilla editable de cotización</span>
          <ExpandArrowTopRightSquare1 className="size-4 shrink-0 text-text-tertiary" />
        </a>
      ) : (
        <span className="text-sm text-text-tertiary">Sin plantilla editable cargada</span>
      )}

      <button
        type="button"
        aria-label="Editar link de la plantilla"
        title="Editar link de la plantilla"
        onClick={() => setEditando(true)}
        className="shrink-0 rounded text-text-tertiary transition-colors outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-4"
      >
        <Pencil1 />
      </button>
    </Card>
  );
}
