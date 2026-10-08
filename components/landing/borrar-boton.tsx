"use client";

import { useState } from "react";
import { Trash1 } from "@tailgrids/icons";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

/**
 * Borrado con confirmación en modal. No hay undo, así que el click directo no
 * alcanza; `advertencia` explica qué más se lleva puesto cuando hay cascade.
 */
export function BorrarBoton({
  onConfirmar,
  etiqueta = "Borrar",
  advertencia,
}: {
  onConfirmar: () => Promise<void>;
  etiqueta?: string;
  advertencia?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={etiqueta}
        title={etiqueta}
        onClick={() => setAbierto(true)}
        className="rounded text-text-tertiary transition-colors outline-none hover:text-error-500 focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-4"
      >
        <Trash1 />
      </button>

      <ConfirmDialog
        isOpen={abierto}
        onOpenChange={setAbierto}
        title={etiqueta}
        description={
          advertencia
            ? `${advertencia} Esta acción no se puede deshacer.`
            : "Esta acción no se puede deshacer."
        }
        confirmLabel="Borrar"
        pendingLabel="Borrando…"
        successMessage="Borrado"
        fallbackError="No se pudo borrar"
        onConfirm={onConfirmar}
      />
    </>
  );
}
