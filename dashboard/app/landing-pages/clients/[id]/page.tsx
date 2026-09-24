import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AtSign,
  Briefcase,
  CircleDashed,
  Download,
  ExternalLink,
  FolderOpen,
  Globe,
  Mail,
  Phone,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import {
  listarCotizaciones,
  listarNotasCliente,
  listarProyectos,
  listarRecursosCliente,
  obtenerCliente,
} from "@/lib/landing/datos";
import {
  formatearMonto,
  LABEL_ORIGEN,
  urlInstagram,
  urlWhatsapp,
} from "@/lib/landing/tipos";
import {
  EstadoClientePill,
  EstadoCotizacionPill,
  EstadoProyectoPill,
  PageHeader,
  Vencimiento,
} from "@/components/landing/ui";
import { ClienteForm } from "@/components/landing/cliente-form";
import { Recursos } from "@/components/landing/recursos";
import { NotasCliente } from "@/components/landing/notas-cliente";

export const dynamic = "force-dynamic";

function Propiedad({
  icono: Icono,
  label,
  children,
}: {
  icono: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="flex w-32 shrink-0 items-center gap-2 text-xs text-text-3">
        <Icono className="size-3.5" />
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Texto({ valor }: { valor: string | null }) {
  return <p className="truncate text-sm">{valor || "—"}</p>;
}

function Enlace({ href, texto }: { href: string | null; texto?: string }) {
  if (!href) return <p className="text-sm">—</p>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-0 items-center gap-1.5 text-sm hover:underline"
    >
      <span className="truncate">{texto ?? href.replace(/^https?:\/\//, "")}</span>
      <ExternalLink className="size-3 shrink-0 text-text-3" />
    </a>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-display text-sm font-bold">{titulo}</h2>
      </div>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-sm text-text-3">{children}</p>;
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

  return (
    <>
      <Link
        href="/landing-pages/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Clientes
      </Link>

      <PageHeader
        titulo={cliente.name}
        descripcion={cliente.company ?? undefined}
        accion={
          <span className="flex items-center gap-3">
            <a
              href={`/landing-pages/clients/${cliente.id}/export`}
              download
              title="Descargar ficha en Markdown"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-text-2 transition-colors hover:border-line-strong hover:text-text"
            >
              <Download className="size-3.5" />
              Exportar
            </a>
            <ClienteForm cliente={cliente} />
          </span>
        }
      />

      <div className="flex flex-col gap-5">
        <section className="rounded-xl border border-line bg-surface px-4 py-3">
          <div className="grid gap-x-10 md:grid-cols-2">
            <Propiedad icono={CircleDashed} label="Estado">
              <EstadoClientePill estado={cliente.status} />
            </Propiedad>

            <Propiedad icono={Sprout} label="Origen">
              {cliente.source ? (
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded border border-idle/30 bg-idle-dim px-1.5 py-0.5 text-[0.6875rem] font-medium text-idle">
                    {LABEL_ORIGEN[cliente.source]}
                  </span>
                  {cliente.source_detail && (
                    <span className="truncate text-sm text-text-2">
                      {cliente.source_detail}
                    </span>
                  )}
                </span>
              ) : (
                <Texto valor={null} />
              )}
            </Propiedad>

            <Propiedad icono={Phone} label="WhatsApp">
              {urlWhatsapp(cliente.phone) ? (
                <Enlace
                  href={urlWhatsapp(cliente.phone)}
                  texto={cliente.phone ?? ""}
                />
              ) : (
                <Texto valor={cliente.phone} />
              )}
            </Propiedad>

            <Propiedad icono={AtSign} label="Instagram">
              {urlInstagram(cliente.instagram) ? (
                <Enlace
                  href={urlInstagram(cliente.instagram)}
                  texto={cliente.instagram ?? ""}
                />
              ) : (
                <Texto valor={cliente.instagram} />
              )}
            </Propiedad>

            <Propiedad icono={Mail} label="Email">
              {cliente.email ? (
                <a
                  href={`mailto:${cliente.email}`}
                  className="truncate text-sm hover:underline"
                >
                  {cliente.email}
                </a>
              ) : (
                <Texto valor={null} />
              )}
            </Propiedad>

            <Propiedad icono={Briefcase} label="Nicho">
              <Texto valor={cliente.niche} />
            </Propiedad>

            <Propiedad icono={Globe} label="Sitio web">
              <Enlace href={cliente.website} />
            </Propiedad>

            <Propiedad icono={FolderOpen} label="Drive">
              <Enlace href={cliente.drive_url} texto="Drive de archivos" />
            </Propiedad>
          </div>

          {cliente.notes && (
            <p className="mt-3 border-t border-line pt-3 text-sm text-text-2">
              {cliente.notes}
            </p>
          )}
        </section>

        <Recursos
          duenoId={cliente.id}
          tabla="client"
          titulo="Accesos del cliente"
          recursos={accesos}
        />

        <NotasCliente clientId={cliente.id} notas={notas} />

        <Seccion titulo="Cotizaciones">
          {susCotizaciones.length === 0 ? (
            <Vacio>Sin cotizaciones.</Vacio>
          ) : (
            susCotizaciones.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm">{q.title}</span>
                  {q.proposal_url && (
                    <a
                      href={q.proposal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Abrir propuesta"
                      className="shrink-0 text-text-3 transition-colors hover:text-text"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="tnum text-sm text-text-2">
                    {formatearMonto(q.amount, q.currency)}
                  </span>
                  <EstadoCotizacionPill estado={q.status} />
                </span>
              </div>
            ))
          )}
        </Seccion>

        <Seccion titulo="Proyectos">
          {susProyectos.length === 0 ? (
            <Vacio>Sin proyectos.</Vacio>
          ) : (
            susProyectos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <Link
                  href={`/landing-pages/projects/${p.id}`}
                  className="min-w-0 truncate text-sm hover:underline"
                >
                  {p.name}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <EstadoProyectoPill estado={p.status} />
                  <Vencimiento fecha={p.due_date} />
                </span>
              </div>
            ))
          )}
        </Seccion>
      </div>
    </>
  );
}
