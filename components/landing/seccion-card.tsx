import { Card } from "@/components/tailgrids/core/card";

/** Sección de una ficha: título arriba y filas separadas dentro de una Card. */
export function SeccionCard({
  titulo,
  cantidad,
  children,
}: {
  titulo: string;
  cantidad?: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-baseline gap-2 border-b border-card-border px-4 py-3">
        <h2 className="text-sm font-semibold text-title-50">{titulo}</h2>
        {cantidad !== undefined && (
          <span className="text-xs tabular-nums text-text-tertiary">{cantidad}</span>
        )}
      </div>
      <div className="divide-y divide-card-border">{children}</div>
    </Card>
  );
}
