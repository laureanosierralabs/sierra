import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  listarCotizaciones,
  listarProyectos,
  obtenerCliente,
} from "@/lib/landing/datos";
import { formatearMonto } from "@/lib/landing/tipos";
import {
  EstadoClientePill,
  EstadoCotizacionPill,
  EstadoProyectoPill,
  PageHeader,
  Vencimiento,
} from "@/components/landing/ui";
import { ClienteForm } from "@/components/landing/cliente-form";

export const dynamic = "force-dynamic";

function Dato({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-0.5 text-sm">{valor || "—"}</p>
    </div>
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

  const [cliente, cotizaciones, proyectos] = await Promise.all([
    obtenerCliente(id),
    listarCotizaciones(),
    listarProyectos(),
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
        accion={<ClienteForm cliente={cliente} />}
      />

      <div className="flex flex-col gap-5">
        <section className="rounded-xl border border-line bg-surface p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="eyebrow">Estado</p>
              <div className="mt-1">
                <EstadoClientePill estado={cliente.status} />
              </div>
            </div>
            <Dato label="WhatsApp" valor={cliente.phone} />
            <Dato label="Instagram" valor={cliente.instagram} />
            <Dato label="Email" valor={cliente.email} />
          </div>
          {cliente.notes && (
            <p className="mt-4 border-t border-line pt-4 text-sm text-text-2">
              {cliente.notes}
            </p>
          )}
        </section>

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
