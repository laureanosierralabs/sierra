"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash1 } from "@tailgrids/icons";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { deleteTeamMember } from "@/app/equipo/actions";

export function TeamMemberEliminar({
  id,
  name,
  disabled,
  onNavigate,
}: {
  id: string;
  name: string;
  disabled: boolean;
  onNavigate: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-title-50">Eliminar persona</p>
        <p className="text-xs text-text-tertiary">
          Solo se elimina este perfil del equipo; sus proyectos y cuentas de usuario no se modifican.
        </p>
      </div>
      <Button
        variant="danger"
        appearance="outline"
        isDisabled={disabled}
        onPress={() => setAbierto(true)}
      >
        <Trash1 />
        Eliminar persona
      </Button>

      <ConfirmDialog
        isOpen={abierto}
        onOpenChange={setAbierto}
        title={`¿Eliminar el perfil de ${name}?`}
        description="Esta acción no se puede deshacer. Solo se eliminará este perfil del equipo; sus proyectos y cuentas de usuario no se modificarán."
        confirmLabel="Confirmar eliminación"
        pendingLabel="Eliminando…"
        cancelLabel="Cancelar eliminación"
        fallbackError="No se pudo eliminar el perfil. Intenta nuevamente."
        onConfirm={async () => {
          const result = await deleteTeamMember(id);
          if (result.error) throw new Error(result.error);
          onNavigate();
          router.push("/equipo");
          router.refresh();
        }}
      />
    </Card>
  );
}
