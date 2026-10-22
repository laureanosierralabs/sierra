"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cambiarEstadoTareas } from "@/app/landing-pages/acciones";
import { Button } from "@/components/tailgrids/core/button";
import { ESTADOS_TAREA, LABEL_ESTADO_TAREA, type EstadoTarea } from "@/lib/landing/tipos";

/** Cambiar el estado de varias tareas a la vez: completarlas es lo más común. */
export function AccionesMasivasTareas({ ids, limpiar }: { ids: string[]; limpiar: () => void }) {
  const [pendiente, iniciar] = useTransition();

  const aplicar = (estado: EstadoTarea) =>
    iniciar(async () => {
      const r = await cambiarEstadoTareas(ids, estado).catch(() => ({ error: "No se pudo cambiar el estado" }));
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(r.aviso);
      limpiar();
    });

  return (
    <>
      <Button size="sm" isDisabled={pendiente} onPress={() => aplicar("completada")}>
        Marcar completadas
      </Button>
      <span className="text-xs text-text-tertiary">o pasar a</span>
      {ESTADOS_TAREA.filter((e) => e !== "completada").map((e) => (
        <Button key={e} size="sm" appearance="outline" isDisabled={pendiente} onPress={() => aplicar(e)}>
          {LABEL_ESTADO_TAREA[e]}
        </Button>
      ))}
    </>
  );
}
