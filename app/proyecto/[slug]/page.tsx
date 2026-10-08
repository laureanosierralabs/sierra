import { notFound } from "next/navigation";
import { ClockThree, InfoTriangle, Link1AngularRight, ScaleSquare } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { EditarProyecto } from "@/components/editar-proyecto";
import { ProyectoBloque, ProyectoLinea } from "@/components/proyecto-bloque";
import { RecursosLista } from "@/components/recursos-lista";
import { Badge } from "@/components/tailgrids/core/badge";
import { Deadline, EstadoPill, PrioridadTag } from "@/components/ui";
import { getProyecto } from "@/lib/contexto";
import { diasHasta } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16: params es una Promise.
  const { slug } = await params;
  const p = await getProyecto(slug);
  if (!p) notFound();

  const dias = diasHasta(p.entrega);

  return (
    <PageContainer>
      <PageHeader title={p.nombre} description={p.cliente} actions={<EditarProyecto p={p} />} />

      <div className="-mt-3 mb-6 flex flex-wrap items-center gap-2">
        <EstadoPill estado={p.estado} />
        <PrioridadTag prioridad={p.prioridad} />
        {dias !== null && <Deadline dias={dias} />}
        {p.actualizado && (
          <span className="text-xs text-text-tertiary tabular-nums">
            Actualizado {p.actualizado}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          <ProyectoBloque titulo="Próximo paso">
            {p.proximoPaso ? (
              <p className="text-lg leading-snug text-text-primary">{p.proximoPaso}</p>
            ) : (
              <EmptyState variant="inline">Sin definir. Contámelo por la terminal.</EmptyState>
            )}
          </ProyectoBloque>

          {p.bloqueos.length > 0 && (
            <ProyectoBloque
              titulo="Bloqueos"
              icono={InfoTriangle}
              className="border-error-500/30 bg-badge-error-background"
              tituloClassName="text-badge-error-text"
            >
              <ul className="flex flex-col gap-2">
                {p.bloqueos.map((b, i) => (
                  <li key={i} className="text-sm text-text-primary">
                    {b}
                  </li>
                ))}
              </ul>
            </ProyectoBloque>
          )}

          {p.estadoActual && (
            <ProyectoBloque titulo="Estado actual">
              <p className="text-sm leading-relaxed whitespace-pre-line text-text-secondary">
                {p.estadoActual}
              </p>
            </ProyectoBloque>
          )}

          <ProyectoBloque titulo="Decisiones" icono={ScaleSquare}>
            {p.decisiones.length === 0 ? (
              <EmptyState variant="inline">Todavía no hay decisiones registradas.</EmptyState>
            ) : (
              <ProyectoLinea items={p.decisiones} />
            )}
          </ProyectoBloque>

          <ProyectoBloque titulo="Bitácora" icono={ClockThree}>
            {p.bitacora.length === 0 ? (
              <EmptyState variant="inline">Sin movimientos registrados.</EmptyState>
            ) : (
              <ProyectoLinea items={p.bitacora} />
            )}
          </ProyectoBloque>
        </div>

        <div className="flex flex-col gap-4">
          <ProyectoBloque titulo="Recursos" icono={Link1AngularRight}>
            <RecursosLista recursos={p.recursos} vacio="Sin recursos cargados." />
          </ProyectoBloque>

          {p.responsables.length > 0 && (
            <ProyectoBloque titulo="Responsables">
              <div className="flex flex-wrap gap-2">
                {p.responsables.map((r) => (
                  <Badge key={r} color="gray">
                    {r}
                  </Badge>
                ))}
              </div>
            </ProyectoBloque>
          )}

          {p.notas && (
            <ProyectoBloque titulo="Notas">
              <p className="text-sm leading-relaxed whitespace-pre-line text-text-secondary">
                {p.notas}
              </p>
            </ProyectoBloque>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
