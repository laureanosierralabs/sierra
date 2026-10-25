import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@tailgrids/icons";
import { PanelLanzamiento } from "@/components/lanzamientos/panel-lanzamiento";
import { AccesosPortal, VideosSoporte } from "@/components/portal/accesos-videos";
import { EntregablesLanding } from "@/components/portal/entregables-landing";
import { ENLACE, HeroPortal, SeccionPortal } from "@/components/portal/portal-ui";
import { AvisoVistaInterna } from "@/components/portal/vista-interna";
import { listarVideosSoporte } from "@/lib/landing/datos";
import { fechaCorta } from "@/lib/landing/tipos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";
import { contextoPortal } from "@/lib/portal/contexto";
import { accesosPortal, lanzamientoPortal } from "@/lib/portal/datos";
import { GruposWhatsapp } from "@/components/lanzamientos/grupos-whatsapp";
import { gruposDeLanzamiento } from "@/lib/lanzamientos/grupos-datos";
import { sitiosDeCliente } from "@/lib/sitios/datos";
import { cn } from "@/utils/cn";

export const dynamic = "force-dynamic";

type Vista = "entrega" | "resultados";

/** Pestañas Entrega / Resultados: links, así cada vista tiene su URL. */
function Pestanas({ base, actual }: { base: string; actual: Vista }) {
  const pestanas: { vista: Vista; etiqueta: string; href: string }[] = [
    { vista: "resultados", etiqueta: "Resultados", href: base },
    { vista: "entrega", etiqueta: "Entrega", href: `${base}?vista=entrega` },
  ];
  return (
    <nav aria-label="Secciones del lanzamiento" className="flex w-full rounded-full bg-white/5 p-1 ring-1 ring-white/10 sm:w-auto">
      {pestanas.map((p) => (
        <Link
          key={p.vista}
          href={p.href}
          scroll={false}
          aria-current={p.vista === actual ? "page" : undefined}
          className={cn(
            "flex-1 rounded-full px-5 py-2 text-center text-sm font-bold transition-colors sm:flex-none",
            p.vista === actual ? "bg-primary-500 text-white" : "text-white/60 hover:text-white",
          )}
        >
          {p.etiqueta}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Un lanzamiento en el portal: el banner y, debajo, dos pestañas. Primero
 * "Resultados" (las métricas y el reporte: lo que el cliente quiere ver al
 * entrar); después "Entrega", con cada landing y sus PDFs y recursos, los
 * accesos y los videos de soporte.
 */
export default async function PortalLanzamiento({
  params,
  searchParams,
}: {
  params: Promise<{ org: string; id: string }>;
  searchParams: Promise<{ vista?: string }>;
}) {
  const [{ org, id }, { vista: vistaCruda }] = await Promise.all([params, searchParams]);
  const ctx = await contextoPortal(org);
  if (!ctx) notFound();

  const detalle = await lanzamientoPortal(ctx, id);
  if (!detalle) notFound();
  const { lanzamiento, paginas } = detalle;
  const vista: Vista = vistaCruda === "entrega" ? "entrega" : "resultados";

  // Accesos y videos son extras: si fallan, el lanzamiento se ve igual.
  const [accesos, videos, grupos, sitios] =
    vista === "entrega"
      ? await Promise.all([
          accesosPortal(ctx).catch(() => []),
          listarVideosSoporte().catch(() => []),
          gruposDeLanzamiento(ctx.clientId, lanzamiento.id).catch(() => null),
          sitiosDeCliente(ctx.clientId).catch(() => []),
        ])
      : [[], [], null, []];
  // El link fijo del grupo sale con el dominio de la landing del cliente.
  const dominio =
    paginas
      .map((p) => (p.site_id ? sitios.find((s) => s.id === p.site_id)?.domain : null))
      .find((d): d is string => !!d) ?? null;
  const fechas = lanzamiento.starts_on
    ? `${fechaCorta(lanzamiento.starts_on)}${lanzamiento.ends_on ? ` → ${fechaCorta(lanzamiento.ends_on)}` : ""}`
    : null;
  const base = `/portal/${ctx.slug}/lanzamientos/${lanzamiento.id}`;

  return (
    <>
      {ctx.vistaInterna && <AvisoVistaInterna />}

      <HeroPortal
        imagen={lanzamiento.banner_url}
        titulo={lanzamiento.name}
        subtitulo={[LABEL_ESTADO_LANZAMIENTO[lanzamiento.status], fechas].filter(Boolean).join(" · ")}
        anclaAbajo="#contenido"
      />

      <div id="contenido" className="mb-10 flex scroll-mt-8 flex-col gap-4 sm:mb-14 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/portal/${ctx.slug}`}
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-white/60 transition-colors hover:text-white sm:self-auto"
        >
          <ArrowLeft className="size-4" />
          Todos los lanzamientos
        </Link>
        <Pestanas base={base} actual={vista} />
      </div>

      {vista === "resultados" ? (
        <SeccionPortal
          titulo="Resultados"
          accion={
            <Link href={`${base}/reporte`} className={cn(ENLACE, "text-sm")}>
              {lanzamiento.status === "cerrado" ? "Reporte de cierre →" : "Reporte parcial →"}
            </Link>
          }
        >
          {paginas.length === 0 ? (
            <p className="text-sm text-white/60">Los resultados aparecen cuando el lanzamiento tenga sus landings.</p>
          ) : (
            <PanelLanzamiento detalle={detalle} />
          )}
        </SeccionPortal>
      ) : (
        <div className="flex flex-col gap-12 sm:gap-16">
          {grupos && (
            <SeccionPortal titulo="Grupos de WhatsApp">
              <GruposWhatsapp
                modo={{ tipo: "portal", slug: ctx.slug }}
                launchId={lanzamiento.id}
                token={grupos.token}
                dominio={dominio}
                grupos={grupos.grupos}
              />
            </SeccionPortal>
          )}

          {paginas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-white/60">
              Las páginas de este lanzamiento van a aparecer acá.
            </p>
          ) : (
            paginas.map((p) => <EntregablesLanding key={p.id} nombre={p.name} url={p.url} entregables={p.deliverables} />)
          )}

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
      )}
    </>
  );
}
