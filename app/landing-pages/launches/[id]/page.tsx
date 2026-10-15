import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { SeccionCard } from "@/components/landing/seccion-card";
import { PageHeader } from "@/components/landing/ui";
import {
  BorrarLanzamiento,
  BorrarPaginaLanzamiento,
  ConexionMailerlite,
  CopiarScriptVisitas,
  ConclusionesForm,
  ElegirLandings,
  ImportarRegistros,
  LanzamientoForm,
  PaginaLanzamientoForm,
} from "@/components/lanzamientos/lanzamiento-gestion";
import { PanelLanzamiento } from "@/components/lanzamientos/panel-lanzamiento";
import { VerificarLandings } from "@/components/lanzamientos/verificar-landings";
import { accesoActual } from "@/lib/landing/auth";
import { listarProyectos, obtenerCliente } from "@/lib/landing/datos";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { fechaCorta } from "@/lib/landing/tipos";
import {
  clienteDeLanzamiento,
  conexionDeLanzamiento,
  lanzamientoDeCliente,
} from "@/lib/lanzamientos/datos";
import { LABEL_ESTADO_LANZAMIENTO, LABEL_TIPO_LANDING } from "@/lib/lanzamientos/tipos";
import { PestanasUrl } from "@/components/common/pestanas-url";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/tailgrids/core/badge";
import { rutasDeSitio, sitiosDeCliente } from "@/lib/sitios/datos";

export const dynamic = "force-dynamic";
// "Verificar landings" (server action de esta página) pide varias URLs ajenas.
export const maxDuration = 60;

/**
 * Un lanzamiento, para el owner. Dos pestañas con propósito distinto:
 * Resultados (lo mismo que ve el cliente en su portal) y Configuración
 * (landings y de dónde llegan los datos).
 */
export default async function LanzamientoDetalle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ vista?: string }>;
}) {
  const { esOwner } = await accesoActual();
  if (!esOwner) redirect("/landing-pages");

  const { id } = await params;
  // Resultados es lo que se mira; Configuración, lo que se arma una vez.
  const vista = (await searchParams).vista === "configuracion" ? "configuracion" : "resultados";
  const clientId = await clienteDeLanzamiento(id);
  if (!clientId) notFound();

  const [detalle, conexion, cliente, proyectos, portal, sitios] = await Promise.all([
    lanzamientoDeCliente(clientId, id),
    conexionDeLanzamiento(clientId, id),
    obtenerCliente(clientId),
    listarProyectos(),
    supabaseAdmin().from("client_orgs").select("slug").eq("client_id", clientId).maybeSingle(),
    sitiosDeCliente(clientId)
      .then((lista) =>
        Promise.all(
          lista.map(async (s) => ({
            id: s.id,
            name: s.name,
            rutas: (await rutasDeSitio(clientId, s.id)).map((r) => r.path),
          })),
        ),
      )
      .catch(() => []),
  ]);
  const nombreSitio = new Map(sitios.map((s) => [s.id, s.name]));
  if (!detalle || !conexion) notFound();

  const { lanzamiento, paginas } = detalle;
  const proyectosDelCliente = proyectos
    .filter((p) => p.client_id === clientId)
    .map((p) => ({ id: p.id, name: p.name }));
  // Proyectos del cliente que todavía no están en el lanzamiento.
  const enLanzamiento = new Set(paginas.map((p) => p.project_id).filter(Boolean));
  const paraElegir = proyectos
    .filter((p) => p.client_id === clientId && !enLanzamiento.has(p.id))
    .map((p) => ({ id: p.id, name: p.name, site_url: p.site_url }));
  const slugPortal = portal.data?.slug as string | undefined;

  return (
    <>
      <Link
        href={`/landing-pages/clients/${clientId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        {cliente?.name ?? "Cliente"}
      </Link>

      <PageHeader
        titulo={lanzamiento.name}
        descripcion={[
          LABEL_ESTADO_LANZAMIENTO[lanzamiento.status],
          lanzamiento.starts_on
            ? `${fechaCorta(lanzamiento.starts_on)}${lanzamiento.ends_on ? ` → ${fechaCorta(lanzamiento.ends_on)}` : ""}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        accion={
          <span className="flex items-center gap-3">
            {slugPortal && (
              <a
                href={`/portal/${slugPortal}/lanzamientos/${lanzamiento.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline [&>svg]:size-4"
              >
                <ExpandArrowTopRightSquare1 />
                Ver en el portal
              </a>
            )}
            <LanzamientoForm lanzamiento={lanzamiento} />
            <BorrarLanzamiento id={lanzamiento.id} />
          </span>
        }
      />

      <PestanasUrl
        etiqueta="Secciones del lanzamiento"
        actual={vista}
        pestanas={[
          { id: "resultados", label: "Resultados", href: `/landing-pages/launches/${lanzamiento.id}` },
          {
            id: "configuracion",
            label: "Configuración",
            href: `/landing-pages/launches/${lanzamiento.id}?vista=configuracion`,
          },
        ]}
      />

      {vista === "resultados" &&
        (paginas.length === 0 ? (
          <EmptyState
            title="Este lanzamiento todavía no tiene landings"
            description="Agregalas en Configuración: ahí elegís las landings y conectás de dónde llegan los registros."
          />
        ) : (
          <PanelLanzamiento detalle={detalle} />
        ))}

      {vista === "configuracion" && (
        <div className="flex flex-col gap-6">
          <SeccionCard
            titulo="Landings"
            cantidad={paginas.length}
            accion={
              <span className="flex flex-wrap items-center gap-2">
                {paginas.length > 0 && <VerificarLandings launchId={lanzamiento.id} />}
                <ElegirLandings launchId={lanzamiento.id} proyectos={paraElegir} />
                <PaginaLanzamientoForm launchId={lanzamiento.id} proyectos={proyectosDelCliente} sitios={sitios} />
              </span>
            }
          >
            {paginas.length === 0 ? (
              <EmptyState
                variant="inline"
                className="px-4 py-6"
                title="Sin landings"
                description="Elegilas entre los proyectos del cliente o agregá una a mano."
              />
            ) : (
              paginas.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-text-primary">{p.name}</span>
                      <Badge color={p.kind === "venta" ? "success" : "blue"} size="sm" className="shrink-0 rounded-md px-1.5">
                        {LABEL_TIPO_LANDING[p.kind]}
                      </Badge>
                    </span>
                    <span className="block truncate text-xs text-text-tertiary">
                      {p.site_id
                        ? `${nombreSitio.get(p.site_id) ?? "Proyecto conectado"} · ruta ${p.path}`
                        : p.mailerlite_group_id
                          ? `Grupo de MailerLite ${p.mailerlite_group_id}`
                          : "Sin proyecto conectado ni grupo: no recibe registros solos"}
                      {p.url ? ` · ${p.url.replace(/^https?:\/\//, "")}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    {/* Con proyecto conectado las visitas llegan por el kit: no hace falta el script suelto. */}
                    {!p.site_id && <CopiarScriptVisitas trackKey={p.track_key} />}
                    <PaginaLanzamientoForm
                      launchId={lanzamiento.id}
                      pagina={p}
                      proyectos={proyectosDelCliente}
                      sitios={sitios}
                    />
                    <BorrarPaginaLanzamiento id={p.id} />
                  </span>
                </div>
              ))
            )}
          </SeccionCard>

          <SeccionCard
            titulo="Reporte de cierre"
            accion={
              slugPortal ? (
                <a
                  href={`/portal/${slugPortal}/lanzamientos/${lanzamiento.id}/reporte`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline [&>svg]:size-4"
                >
                  <ExpandArrowTopRightSquare1 />
                  Ver reporte
                </a>
              ) : undefined
            }
          >
            {!slugPortal && (
              <p className="px-4 pt-4 text-sm text-text-tertiary">
                El reporte se ve en el portal del cliente: habilitalo en su ficha para verlo y descargarlo en PDF.
              </p>
            )}
            <ConclusionesForm launchId={lanzamiento.id} valor={lanzamiento.closing_notes} />
          </SeccionCard>

          <SeccionCard titulo="Fuentes de datos">
            <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4">
              <span className="min-w-0 max-w-xl">
                <span className="block text-sm font-medium text-text-primary">Importar desde un archivo</span>
                <span className="block text-sm text-text-tertiary">
                  Para lanzamientos que corrieron antes de conectar el panel: un CSV exportado de la base del
                  cliente, de MailerLite o de una planilla. Las columnas extra (respuestas de un diagnóstico,
                  por ejemplo) también se guardan y se pueden exportar.
                </span>
              </span>
              <ImportarRegistros launchId={lanzamiento.id} paginas={paginas} />
            </div>
            <div className="px-4 py-4">
              <span className="mb-3 block text-sm font-medium text-text-primary">MailerLite</span>
              <ConexionMailerlite launchId={lanzamiento.id} conexion={conexion} />
            </div>
          </SeccionCard>
        </div>
      )}
    </>
  );
}
