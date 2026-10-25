import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@tailgrids/icons";
import { AccesosPortal, VideosSoporte } from "@/components/portal/accesos-videos";
import { EntregablesLanding } from "@/components/portal/entregables-landing";
import { HeroPortal, SeccionPortal } from "@/components/portal/portal-ui";
import { ResultadosPortal } from "@/components/portal/resultados/resultados-portal";
import { numero, porcentaje } from "@/components/portal/resultados/formato";
import { AvisoVistaInterna } from "@/components/portal/vista-interna";
import { listarVideosSoporte } from "@/lib/landing/datos";
import { fechaCorta } from "@/lib/landing/tipos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";
import { contextoPortal } from "@/lib/portal/contexto";
import { accesosPortal, lanzamientoPortal } from "@/lib/portal/datos";
import { GruposWhatsapp } from "@/components/lanzamientos/grupos-whatsapp";
import { cruzarRegistrados } from "@/lib/lanzamientos/despues";
import { enlacesDeLanzamiento, type EnlacesLanzamiento } from "@/lib/lanzamientos/enlaces-datos";
import { BloqueEnlace, DestinoWebinar, SelectorHerramienta } from "@/components/lanzamientos/enlaces-lanzamiento";
import { sitiosDeCliente } from "@/lib/sitios/datos";
import { cn } from "@/utils/cn";

export const dynamic = "force-dynamic";

type Vista = "resultados" | "enlaces" | "entrega";

/** Pestañas Resultados / Enlaces / Entrega: links, así cada vista tiene su URL. */
function Pestanas({ base, actual }: { base: string; actual: Vista }) {
  const pestanas: { vista: Vista; etiqueta: string; href: string }[] = [
    { vista: "resultados", etiqueta: "Resultados", href: base },
    { vista: "enlaces", etiqueta: "Enlaces", href: `${base}?vista=enlaces` },
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
            "flex-1 rounded-full px-4 py-2 text-center text-sm font-bold transition-colors sm:flex-none",
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
 * Un lanzamiento en el portal: el banner y, debajo, tres pestañas. Primero
 * "Resultados" (las métricas: lo que el cliente quiere ver al entrar); luego
 * "Enlaces" (los links del webinar y del grupo de WhatsApp, y si funcionan) y "Entrega", con cada landing
 * y sus PDFs y recursos, los accesos y los videos de soporte.
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
  const vista: Vista = vistaCruda === "entrega" ? "entrega" : vistaCruda === "enlaces" || vistaCruda === "whatsapp" ? "enlaces" : "resultados";

  // Cada pestaña lee solo lo suyo. Accesos y videos son extras: si fallan, el lanzamiento se ve igual.
  const [accesos, videos] =
    vista === "entrega"
      ? await Promise.all([accesosPortal(ctx).catch(() => []), listarVideosSoporte().catch(() => [])])
      : [[], []];
  const [enlaces, sitios] =
    vista === "enlaces"
      ? await Promise.all([
          enlacesDeLanzamiento(ctx.clientId, lanzamiento.id).catch((): EnlacesLanzamiento => ({ webinar: null, grupo: null })),
          sitiosDeCliente(ctx.clientId).catch(() => []),
        ])
      : [null, []];
  const grupos = enlaces?.grupo ?? null;
  // Los links estables salen con el dominio de la landing del cliente.
  const dominio =
    paginas
      .map((p) => (p.site_id ? sitios.find((s) => s.id === p.site_id)?.domain : null))
      .find((d): d is string => !!d) ?? null;

  // Estadísticas del grupo en la pestaña Enlaces: quiénes de los registrados hicieron clic al grupo.
  const clics = detalle.despues && detalle.registros.length > 0
    ? (() => {
        const cruce = cruzarRegistrados(
          detalle.registros,
          detalle.despues.eventos.filter((e) => e.kind === "whatsapp_click").map((e) => e.email),
        );
        return { registrados: cruce.total, entraron: cruce.cruzan, porcentaje: cruce.porcentaje };
      })()
    : null;
  const modoPortal = { tipo: "portal", slug: ctx.slug } as const;
  const ahoraIso = new Date().toISOString();
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
        paginas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-white/60">
            Los resultados aparecen cuando el lanzamiento tenga sus landings.
          </p>
        ) : (
          <ResultadosPortal
            detalle={detalle}
            ahoraIso={ahoraIso}
            reporteHref={`${base}/reporte`}
            fechas={fechas}
          />
        )
      ) : vista === "enlaces" ? (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <p className="max-w-3xl text-sm text-white/70">
              Pega estos links una sola vez en tus correos o en WhatsApp. No cambian nunca: si cambias el Zoom o los
              grupos, siguen funcionando.
            </p>
            <SelectorHerramienta modo={modoPortal} />
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6">
            {enlaces?.webinar ? (
              <BloqueEnlace
                modo={modoPortal}
                launchId={lanzamiento.id}
                tipo="webinar"
                dominio={dominio}
                ahoraIso={ahoraIso}
                datos={enlaces.webinar}
              >
                <DestinoWebinar slug={ctx.slug} launchId={lanzamiento.id} url={enlaces.webinar.url} />
              </BloqueEnlace>
            ) : (
              <p className="text-sm text-white/60">El link del webinar todavía no está disponible para este lanzamiento.</p>
            )}

            {grupos ? (
              <BloqueEnlace
                modo={modoPortal}
                launchId={lanzamiento.id}
                tipo="grupo"
                dominio={dominio}
                ahoraIso={ahoraIso}
                datos={grupos}
                lineaClave={
                  clics
                    ? `${numero(clics.entraron)} de ${numero(clics.registrados)} registrados entraron (${porcentaje(clics.porcentaje)})`
                    : undefined
                }
              >
                <GruposWhatsapp modo={modoPortal} launchId={lanzamiento.id} grupos={grupos.grupos} />
              </BloqueEnlace>
            ) : (
              <p className="text-sm text-white/60">Los grupos de WhatsApp todavía no están disponibles para este lanzamiento.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-12 sm:gap-16">
          {paginas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-white/60">
              Las páginas de este lanzamiento aparecerán aquí.
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
