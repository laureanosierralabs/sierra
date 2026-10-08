"use client";

import { Pencil1 } from "@tailgrids/icons";
import { DialogoForm } from "@/components/landing/dialogo-form";
import { MovimientoCampos } from "@/components/movimiento-campos";
import { movimientoEsquema } from "@/components/movimiento-esquema";
import { guardarMovimiento } from "@/app/finanzas/acciones";
import type { Ambito, Movimiento } from "@/lib/finanzas";

export function MovimientoForm({
  ambito,
  movimiento,
}: {
  ambito: Ambito;
  movimiento?: Movimiento;
}) {
  const editando = Boolean(movimiento);

  return (
    <DialogoForm
      titulo={editando ? "Editar movimiento" : "Nuevo movimiento"}
      etiquetaAbrir={editando ? "Editar movimiento" : "Nuevo movimiento"}
      action={guardarMovimiento}
      schema={movimientoEsquema}
      disparador={editando ? <Pencil1 /> : undefined}
    >
      {(form) => <MovimientoCampos form={form} ambito={ambito} movimiento={movimiento} />}
    </DialogoForm>
  );
}
