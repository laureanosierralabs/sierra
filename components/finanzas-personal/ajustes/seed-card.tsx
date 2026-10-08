"use client";

import { useState } from "react";
import { seedFinance } from "@/app/finanzas/personal/actions";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import type { FinanceData } from "@/lib/personal-finance";

/** La carga inicial solo aplica mientras no hay cuentas ni versión de seed. */
export const needsSeed = (data: FinanceData) => !data.rate?.seed_version && data.accounts.length === 0;

/** Carga única de saldos, compromisos y objetivos iniciales. */
export function SeedCard() {
  const [confirming, setConfirming] = useState(false);

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-text-primary">Carga inicial de octubre de 2026</h3>
        <p className="mt-1.5 text-sm text-text-secondary">
          Cargar saldos iniciales aproximados, compromisos pendientes y objetivos. No genera cobros,
          gastos ni ingresos ficticios. La carga se ejecuta una sola vez para Laureano.
        </p>
      </div>
      <div>
        <Button onPress={() => setConfirming(true)}>Cargar datos iniciales</Button>
      </div>
      <ConfirmDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        tone="primary"
        title="¿Cargar los datos iniciales?"
        description="Se cargan los datos personales conocidos. Solo se puede hacer una vez."
        confirmLabel="Cargar datos iniciales"
        pendingLabel="Cargando…"
        successMessage="Datos iniciales cargados"
        onConfirm={async () => {
          const result = await seedFinance();
          if (!result.ok) throw new Error(result.error ?? "No se pudo cargar. Podés volver a intentar.");
        }}
      />
    </Card>
  );
}
