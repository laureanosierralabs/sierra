import { Locked3 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";

export default function SinAcceso() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <EmptyState
        icon={<Locked3 />}
        title="Sin unidades asignadas"
        description="Tu cuenta todavía no tiene acceso a ninguna unidad. Pedile a Laureano que te asigne una."
        className="max-w-md"
      />
    </div>
  );
}
