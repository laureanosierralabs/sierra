import { Paperclip2 } from "@tailgrids/icons";
import { AdjuntoFila } from "@/components/landing/adjunto-fila";
import { AdjuntoLinkForm } from "@/components/landing/adjunto-link-form";
import { AdjuntoSubir } from "@/components/landing/adjunto-subir";
import { Card } from "@/components/tailgrids/core/card";
import type { Adjunto } from "@/lib/landing/tipos";

/**
 * Links y archivos de la tarea. Un link apunta a donde el material ya vive
 * (Drive, Fathom, Figma); un archivo se sube cuando no vive en ningún lado.
 */
export function Adjuntos({
  taskId,
  adjuntos,
}: {
  taskId: string;
  adjuntos: Adjunto[];
}) {
  return (
    <Card className="p-0">
      {adjuntos.length > 0 && (
        <ul className="divide-y divide-card-border border-b border-card-border">
          {adjuntos.map((a) => (
            <AdjuntoFila key={a.id} adjunto={a} />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 p-3">
        <AdjuntoLinkForm taskId={taskId} />
        <AdjuntoSubir taskId={taskId} />

        {adjuntos.length === 0 && (
          <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <Paperclip2 className="size-3.5" />
            Sin adjuntos
          </span>
        )}
      </div>
    </Card>
  );
}
