import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { SeccionCard } from "@/components/landing/seccion-card";
import { PageHeader } from "@/components/landing/ui";
import {
  BorrarLanzamiento,
  BorrarPaginaLanzamiento,
  ConexionMailerlite,
  LanzamientoForm,
  PaginaLanzamientoForm,
} from "@/components/lanzamientos/lanzamiento-gestion";
import { PanelLanzamiento } from "@/components/lanzamientos/panel-lanzamiento";
import { accesoActual } from "@/lib/landing/auth";
import { listarProyectos, obtenerCliente } from "@/lib/landing/datos";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { fechaCorta } from "@/lib/landing/tipos";
import {
  clienteDeLanzamiento,
  conexionDeLanzamiento,
  lanzamientoDeCliente,
} from "@/lib/lanzamientos/datos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";

export const dynamic = "force-dynamic";

/** Gestión de un lanzamiento. Solo owner: incluye la conexión con MailerLite. */
export default async function LanzamientoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { esOwner } = await accesoActual();
  if (!esOwner) redirect("/landing-pages");

  const { id } = await params;
  const clientId = await clienteDeLanzamiento(id);
  if (!clientId) notFound();

  const [detalle, conexion, cliente, proyectos, portal] = await Promise.all([
    lanzamientoDeCliente(clientId, id),
    conexionDeLanzamiento(clientId, id),
    obtenerCliente(clientId),
    listarProyectos(),
    supabaseAdmin().from("client_orgs").select("slug").eq("client_id", clientId).maybeSingle(),
  ]);
  if (!detalle || !conexion) notFound();

  const { lanzamiento, paginas } = detalle;
  const proyectosDelCliente = proyectos
    .filter((p) => p.client_id === clientId)
    .map((p) => ({ id: p.id, name: p.name }));
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

      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SeccionCard titulo="Landings" cantidad={paginas.length}>
          {paginas.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-text-primary">{p.name}</span>
                <span className="block truncate text-xs text-text-tertiary">
                  {p.mailerlite_group_id ? `Grupo ${p.mailerlite_group_id}` : "Sin grupo: no cuenta registros"}
                  {p.url ? ` · ${p.url}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <PaginaLanzamientoForm
                  launchId={lanzamiento.id}
                  pagina={p}
                  proyectos={proyectosDelCliente}
                />
                <BorrarPaginaLanzamiento id={p.id} />
              </span>
            </div>
          ))}
          <div className="px-4 py-3">
            <PaginaLanzamientoForm launchId={lanzamiento.id} proyectos={proyectosDelCliente} />
          </div>
        </SeccionCard>

        <SeccionCard titulo="Conexión con MailerLite">
          <ConexionMailerlite launchId={lanzamiento.id} conexion={conexion} />
        </SeccionCard>
      </div>

      <PanelLanzamiento
        detalle={detalle}
        exportarHref={
          slugPortal ? `/portal/${slugPortal}/lanzamientos/${lanzamiento.id}/export` : undefined
        }
      />
    </>
  );
}
