import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@tailgrids/icons";
import { PanelLanzamiento } from "@/components/lanzamientos/panel-lanzamiento";
import { Badge } from "@/components/tailgrids/core/badge";
import { fechaCorta } from "@/lib/landing/tipos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";
import { contextoPortal } from "@/lib/portal/contexto";
import { lanzamientoPortal } from "@/lib/portal/datos";

export const dynamic = "force-dynamic";

export default async function PortalLanzamiento({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org, id } = await params;
  const ctx = await contextoPortal(org);
  if (!ctx) notFound();

  const detalle = await lanzamientoPortal(ctx, id);
  if (!detalle) notFound();
  const { lanzamiento } = detalle;

  return (
    <>
      <Link
        href={`/portal/${ctx.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        {ctx.clienteNombre}
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-text-primary">{lanzamiento.name}</h1>
        <Badge color={lanzamiento.status === "activo" ? "success" : "gray"} size="sm">
          {LABEL_ESTADO_LANZAMIENTO[lanzamiento.status]}
        </Badge>
        <Link
          href={`/portal/${ctx.slug}/lanzamientos/${lanzamiento.id}/reporte`}
          className="ml-auto text-sm font-medium text-primary-500 hover:underline"
        >
          {lanzamiento.status === "cerrado" ? "Reporte de cierre" : "Reporte (parcial)"}
        </Link>
        {lanzamiento.starts_on && (
          <span className="text-sm tabular-nums text-text-tertiary">
            {fechaCorta(lanzamiento.starts_on)}
            {lanzamiento.ends_on ? ` → ${fechaCorta(lanzamiento.ends_on)}` : ""}
          </span>
        )}
      </div>

      <PanelLanzamiento detalle={detalle} />
    </>
  );
}
