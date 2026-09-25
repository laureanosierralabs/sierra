"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { borrarMovimiento } from "@/app/finanzas/acciones";
import type { Ambito } from "@/lib/finanzas";

export function BorrarMovimiento({
  id,
  ambito,
}: {
  id: string;
  ambito: Ambito;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => borrarMovimiento(id, ambito)}
          className="rounded px-1.5 py-0.5 text-xs font-medium text-critical hover:bg-critical-dim"
        >
          Borrar
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="rounded px-1.5 py-0.5 text-xs text-text-3 hover:text-text"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="rounded-md p-1.5 text-text-3 transition-colors hover:bg-surface-2 hover:text-critical"
      aria-label="Borrar movimiento"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
