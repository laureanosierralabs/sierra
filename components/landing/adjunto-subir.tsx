"use client";

import { useRef, useTransition } from "react";
import { Upload1 } from "@tailgrids/icons";
import { toast } from "sonner";
import { subirArchivoTarea } from "@/app/landing-pages/acciones";
import { Button } from "@/components/tailgrids/core/button";

export function AdjuntoSubir({ taskId }: { taskId: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pendiente, iniciar] = useTransition();

  return (
    <>
      <Button
        appearance="outline"
        size="sm"
        isDisabled={pendiente}
        onPress={() => ref.current?.click()}
      >
        <Upload1 />
        {pendiente ? "Subiendo…" : "Subir archivo"}
      </Button>

      <input
        ref={ref}
        type="file"
        className="hidden"
        aria-label="Archivo a subir"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (!archivo) return;

          const fd = new FormData();
          fd.set("task_id", taskId);
          fd.set("archivo", archivo);

          iniciar(async () => {
            try {
              await subirArchivoTarea(fd);
              toast.success("Archivo subido");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "No se pudo subir");
            }
          });
          // Permite volver a elegir el mismo archivo si falló.
          e.target.value = "";
        }}
      />
    </>
  );
}
