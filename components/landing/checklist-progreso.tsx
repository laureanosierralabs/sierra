import { Progress } from "@/components/tailgrids/core/progress";

/** Barra de avance de un checklist con su contador "hechos/total". */
export function ChecklistProgreso({ hechos, total }: { hechos: number; total: number }) {
  const porcentaje = total ? Math.round((hechos / total) * 100) : 0;

  return (
    <div className="mb-2 flex items-center gap-2">
      <Progress progress={porcentaje} className="max-w-none flex-1" />
      <span className="shrink-0 text-xs text-text-tertiary tabular-nums">
        {hechos}/{total}
      </span>
    </div>
  );
}
