"use client";

import { useState } from "react";
import { Trash1 } from "@tailgrids/icons";
import { borrarMovimiento } from "@/app/finanzas/acciones";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import type { Ambito } from "@/lib/finanzas";

export function BorrarMovimiento({
  id,
  ambito,
}: {
  id: string;
  ambito: Ambito;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-md p-1.5 text-text-tertiary transition-colors outline-none hover:bg-background-gray-secondary hover:text-error-500 focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-4"
        aria-label="Borrar movimiento"
      >
        <Trash1 />
      </button>

      <ConfirmDialog
        isOpen={abierto}
        onOpenChange={setAbierto}
        title="Borrar movimiento"
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        pendingLabel="Borrando…"
        successMessage="Movimiento borrado"
        fallbackError="No se pudo borrar"
        onConfirm={() => borrarMovimiento(id, ambito)}
      />
    </>
  );
}
