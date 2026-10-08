import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase4,
  CheckCircle1,
  Download1,
  Envelope1,
  Folder1,
  Globe2,
  Instagram,
  Phone,
  Target3,
} from "@tailgrids/icons";
import {
  listarCotizaciones,
  listarNotasCliente,
  listarProyectos,
  listarRecursosCliente,
  obtenerCliente,
} from "@/lib/landing/datos";
import { formatearMonto, LABEL_ORIGEN, urlInstagram, urlWhatsapp } from "@/lib/landing/tipos";
import {
  EstadoClientePill,
  EstadoCotizacionPill,
  EstadoProyectoPill,
  PageHeader,
  Vencimiento,
} from "@/components/landing/ui";
import { ClienteForm } from "@/components/landing/cliente-form";
import { EnlaceBoton, EnlaceExterno } from "@/components/landing/enlace-boton";
import { NotasCliente } from "@/components/landing/notas-cliente";
import { Propiedad } from "@/components/landing/propiedad";
import { Recursos } from "@/components/landing/recursos";
import { SeccionCard } from "@/components/landing/seccion-card";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import { EmptyState } from "@/components/common/empty-state";

export const dynamic = "force-dynamic";

function Texto({ valor }: { valor: string | null }) {
  return <p className="truncate">{valor || "—"}</p>;
}

function Enlace({ href, texto }: { href: string | null; texto?: string }) {
  if (!href) return <p>—</p>;
  return (
    <EnlaceExterno href={href}>
      <span className="truncate">{texto ?? href.replace(/^https?:\/\//, "")}</span>
    </EnlaceExterno>
  );
}

function Vacio({ children }: { children: React.ReactNode }) {
  return <EmptyState variant="inline" className="px-4 py-6">{children}</EmptyState>;
}

export default async function ClienteDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [cliente, cotizaciones, proyectos, accesos, notas] = await Promise.all([
    obtenerCliente(id),
    listarCotizaciones(),
    listarProyectos(),
    listarRecursosCliente(id),
    listarNotasCliente(id),
  ]);

  if (!cliente) notFound();

  const susCotizaciones = cotizaciones.filter((q) => q.client_id === id);
  const susProyectos = proyectos.filter((p) => p.client_id === id);
  const wa = urlWhatsapp(cliente.phone);
  const ig = urlInstagram(cliente.instagram);

  return (
    <>
      <Link
        href="/landing-pages/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Clientes
      </Link>

      <PageHeader
        titulo={cliente.name}
        descripcion={cliente.company ?? undefined}
        accion={
          <span className="flex items-center gap-3">
            <EnlaceBoton
              href={`/landing-pages/clients/${cliente.id}/export`}
              descarga
              titulo="Descargar ficha en Markdown"
              icono={<Download1 />}
            >
              Exportar
            </EnlaceBoton>
            <ClienteForm cliente={cliente} />
          </span>
        }
      />

      <div className="flex flex-col gap-8">
        <Card className="px-5 py-3">
          <div className="grid gap-x-10 md:grid-cols-2">
            <Propiedad icono={CheckCircle1} label="Estado">
              <EstadoClientePill estado={cliente.status} />
            </Propiedad>

            <Propiedad icono={Target3} label="Origen">
              {cliente.source ? (
                <span className="flex min-w-0 items-center gap-2">
                  <Badge color="blue" size="sm" className="shrink-0 rounded-md px-1.5">
                    {LABEL_ORIGEN[cliente.source]}
                  </Badge>
                  {cliente.source_detail && (
                    <span className="truncate text-text-secondary">{cliente.source_detail}</span>
                  )}
                </span>
              ) : (
                <Texto valor={null} />
              )}
            </Propiedad>

            <Propiedad icono={Phone} label="WhatsApp">
              {wa ? <Enlace href={wa} texto={cliente.phone ?? ""} /> : <Texto valor={cliente.phone} />}
            </Propiedad>

            <Propiedad icono={Instagram} label="Instagram">
              {ig ? (
                <Enlace href={ig} texto={cliente.instagram ?? ""} />
              ) : (
                <Texto valor={cliente.instagram} />
              )}
            </Propiedad>

            <Propiedad icono={Envelope1} label="Email">
              {cliente.email ? (
                <a href={`mailto:${cliente.email}`} className="block truncate hover:underline">
                  {cliente.email}
                </a>
              ) : (
                <Texto valor={null} />
              )}
            </Propiedad>

            <Propiedad icono={Briefcase4} label="Nicho">
              <Texto valor={cliente.niche} />
            </Propiedad>

            <Propiedad icono={Globe2} label="Sitio web">
              <Enlace href={cliente.website} />
            </Propiedad>

            <Propiedad icono={Folder1} label="Drive">
              <Enlace href={cliente.drive_url} texto="Drive de archivos" />
            </Propiedad>
          </div>

          {cliente.notes && (
            <p className="mt-3 border-t border-card-border pt-3 text-sm text-text-secondary">
              {cliente.notes}
            </p>
          )}
        </Card>

        <Recursos
          duenoId={cliente.id}
          tabla="client"
          titulo="Accesos del cliente"
          recursos={accesos}
        />

        <NotasCliente clientId={cliente.id} notas={notas} />

        <SeccionCard titulo="Cotizaciones" cantidad={susCotizaciones.length}>
          {susCotizaciones.length === 0 ? (
            <Vacio>Sin cotizaciones.</Vacio>
          ) : (
            susCotizaciones.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm text-text-primary">{q.title}</span>
                  {q.proposal_url && (
                    <EnlaceExterno href={q.proposal_url}>
                      <span className="sr-only">Abrir propuesta</span>
                    </EnlaceExterno>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-sm tabular-nums text-text-secondary">
                    {formatearMonto(q.total_amount, q.currency)}
                  </span>
                  <EstadoCotizacionPill estado={q.commercial_status} />
                </span>
              </div>
            ))
          )}
        </SeccionCard>

        <SeccionCard titulo="Proyectos" cantidad={susProyectos.length}>
          {susProyectos.length === 0 ? (
            <Vacio>Sin proyectos.</Vacio>
          ) : (
            susProyectos.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <Link
                  href={`/landing-pages/projects/${p.id}`}
                  className="min-w-0 truncate text-sm text-text-primary hover:underline"
                >
                  {p.name}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <EstadoProyectoPill estado={p.status} />
                  <Vencimiento fecha={p.due_date} cerrado={p.status === "entregado"} />
                </span>
              </div>
            ))
          )}
        </SeccionCard>
      </div>
    </>
  );
}
