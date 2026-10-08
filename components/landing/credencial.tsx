"use client";

import { useState, useTransition } from "react";
import { Check, Copy1, Eye, EyeDisabled } from "@tailgrids/icons";
import { BOTON_ICONO } from "@/components/landing/boton-icono";
import { revelarCredencial } from "@/app/landing-pages/acciones";

export function Copiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      aria-label="Copiar"
      title="Copiar"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1200);
        } catch {
          // Sin permiso de portapapeles: no hay nada que hacer acá.
        }
      }}
      className={BOTON_ICONO}
    >
      {copiado ? (
        <Check className="text-success-500" />
      ) : (
        <Copy1 />
      )}
    </button>
  );
}

/**
 * Muestra la credencial solo cuando se pide. El texto cifrado nunca llega al
 * cliente en el render: se busca al servidor al tocar el ojo.
 */
export function Credencial({
  recursoId,
  tabla = "project",
}: {
  recursoId: string;
  tabla?: "project" | "client";
}) {
  const [valor, setValor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pendiente, iniciar] = useTransition();

  if (valor === null) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-sm tabular-nums text-text-tertiary">••••••••</span>
        <button
          type="button"
          disabled={pendiente}
          aria-label="Mostrar credencial"
          title="Mostrar"
          onClick={() =>
            iniciar(async () => {
              try {
                const v = await revelarCredencial(recursoId, tabla);
                setValor(v ?? "");
              } catch {
                setError(true);
              }
            })
          }
          className={BOTON_ICONO}
        >
          <Eye />
        </button>
        {error && (
          <span className="text-xs text-input-error">No se pudo descifrar</span>
        )}
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate font-mono text-sm">{valor || "—"}</span>
      {valor && <Copiar texto={valor} />}
      <button
        type="button"
        aria-label="Ocultar credencial"
        title="Ocultar"
        onClick={() => setValor(null)}
        className={BOTON_ICONO}
      >
        <EyeDisabled />
      </button>
    </span>
  );
}
