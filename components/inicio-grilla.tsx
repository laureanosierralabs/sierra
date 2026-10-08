import { ProyectoCard } from "@/components/proyecto-card";
import type { Proyecto } from "@/lib/types";

export function InicioGrilla({ proyectos }: { proyectos: Proyecto[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {proyectos.map((p) => (
        <ProyectoCard key={p.slug} p={p} />
      ))}
    </div>
  );
}
