import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@tailgrids/icons";
import { PanelLanzamiento } from "@/components/lanzamientos/panel-lanzamiento";
import { AccesosPortal, VideosSoporte } from "@/components/portal/accesos-videos";
import { EntregablesLanding } from "@/components/portal/entregables-landing";
import { HeroPortal, SeccionPortal } from "@/components/portal/portal-ui";
import { listarVideosSoporte } from "@/lib/landing/datos";
import { fechaCorta } from "@/lib/landing/tipos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";
import { contextoPortal } from "@/lib/portal/contexto";
import { accesosPortal, lanzamientoPortal } from "@/lib/portal/datos";

export const dynamic = "force-dynamic";

/**
 * Un lanzamiento en el portal: su banner, los resultados, cada landing con
 * sus entregables, los accesos y los videos de soporte. Lo que no se cargó no
 * aparece.
 */
export default async function PortalLanzamiento({ params }: { params: Promise<{ org: string; id: string }> }) {
  const { org, id } = await params;
  const ctx = await contextoPortal(org);
  if (!ctx) notFound();

  const detalle = await lanzamientoPortal(ctx, id);
  if (!detalle) notFound();
  const { lanzamiento, paginas } = detalle;

  // Accesos y videos son extras: si fallan, el lanzamiento se ve igual.
  const [accesos, videos] = await Promise.all([
    accesosPortal(ctx).catch(() => []),
    listarVideosSoporte().catch(() => []),
  ]);
  const fechas = lanzamiento.starts_on
    ? `${fechaCorta(lanzamiento.starts_on)}${lanzamiento.ends_on ? ` → ${fechaCorta(lanzamiento.ends_on)}` : ""}`
    : null;

  return (
    <>
      <Link
        href={`/portal/${ctx.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        {ctx.clienteNombre}
      </Link>

      <HeroPortal
        imagen={lanzamiento.banner_url}
        titulo={lanzamiento.name}
        subtitulo={[LABEL_ESTADO_LANZAMIENTO[lanzamiento.status], fechas].filter(Boolean).join(" · ")}
        anclaAbajo="#resultados"
      />

      <div className="flex flex-col gap-16">
        <SeccionPortal
          id="resultados"
          titulo="Resultados"
          accion={
            <Link
              href={`/portal/${ctx.slug}/lanzamientos/${lanzamiento.id}/reporte`}
              className="shrink-0 text-sm font-medium text-primary-400 hover:underline"
            >
              {lanzamiento.status === "cerrado" ? "Reporte de cierre →" : "Reporte (parcial) →"}
            </Link>
          }
        >
          {paginas.length === 0 ? (
            <p className="text-sm text-text-tertiary">Los resultados aparecen cuando el lanzamiento tenga sus landings.</p>
          ) : (
            <PanelLanzamiento detalle={detalle} />
          )}
        </SeccionPortal>

        {paginas.map((p) => (
          <EntregablesLanding key={p.id} nombre={p.name} url={p.url} entregables={p.deliverables} />
        ))}

        {accesos.length > 0 && (
          <SeccionPortal titulo="Accesos">
            <AccesosPortal slug={ctx.slug} accesos={accesos} />
          </SeccionPortal>
        )}

        {videos.length > 0 && (
          <SeccionPortal titulo="Videos de soporte">
            <VideosSoporte videos={videos} />
          </SeccionPortal>
        )}
      </div>
    </>
  );
}
