import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CircleDashed,
  CreditCard,
  ExternalLink,
  FileText,
  Layers,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  listarClientes,
  listarPagos,
  listarProyectos,
  obtenerCotizacion,
} from "@/lib/landing/datos";
import {
  codigoCotizacion,
  formatearMonto,
  pendienteDeCobro,
} from "@/lib/landing/tipos";
import {
  EstadoCotizacionPill,
  EstadoPagoPill,
  PageHeader,
  SeccionTitulo,
} from "@/components/landing/ui";
import { CotizacionForm } from "@/components/landing/cotizacion-form";
import { Cobros } from "@/components/landing/cobros";
import { BorrarCotizacion } from "@/components/landing/borrar";

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
      <span className="flex w-40 shrink-0 items-center gap-2 text-xs text-text-3">
        <Icono className="size-3.5" />
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default async function CotizacionDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [cotizacion, clientes, proyectos, pagos] = await Promise.all([
    obtenerCotizacion(id),
    listarClientes(),
    listarProyectos(),
    listarPagos(id),
  ]);

  if (!cotizacion) notFound();

  const nombrePor = new Map(clientes.map((c) => [c.id, c.name]));
  const vinculados = proyectos.filter((p) =>
    cotizacion.project_ids.includes(p.id),
  );
  const pendiente = pendienteDeCobro(cotizacion);

  return (
    <>
      <Link
        href="/landing-pages/quotes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Cotizaciones
      </Link>

      <PageHeader
        titulo={cotizacion.title}
        descripcion={codigoCotizacion(cotizacion.numero)}
        accion={
          <span className="flex items-center gap-3">
            <CotizacionForm
              clientes={clientes}
              proyectos={proyectos}
              cotizacion={cotizacion}
            />
            <BorrarCotizacion
              id={cotizacion.id}
              redirigirA="/landing-pages/quotes"
            />
          </span>
        }
      />

      <div className="mb-8 overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
        <div className="grid gap-x-10 px-4 py-3 md:grid-cols-2">
          <Propiedad icono={Building2} label="Cliente que paga">
            {cotizacion.client_id ? (
              <Link
                href={`/landing-pages/clients/${cotizacion.client_id}`}
                className="truncate text-sm font-medium hover:underline"
              >
                {nombrePor.get(cotizacion.client_id) ?? "—"}
              </Link>
            ) : (
              <p className="text-sm text-text-3">—</p>
            )}
          </Propiedad>

          <Propiedad icono={CircleDashed} label="Estado comercial">
            <EstadoCotizacionPill estado={cotizacion.commercial_status} />
          </Propiedad>

          <Propiedad icono={Wallet} label="Monto total">
            <p className="tnum text-sm font-semibold">
              {formatearMonto(cotizacion.total_amount, cotizacion.currency)}
            </p>
          </Propiedad>

          <Propiedad icono={CreditCard} label="Estado de pago">
            <EstadoPagoPill estado={cotizacion.payment_status} />
          </Propiedad>

          <Propiedad icono={Wallet} label="Cobrado">
            <p className="tnum text-sm text-ok">
              {formatearMonto(cotizacion.amount_paid, cotizacion.currency)}
            </p>
          </Propiedad>

          <Propiedad icono={Wallet} label="Pendiente">
            <p
              className={`tnum text-sm ${pendiente > 0 ? "text-warn" : "text-text-3"}`}
            >
              {pendiente > 0
                ? formatearMonto(pendiente, cotizacion.currency)
                : "—"}
            </p>
          </Propiedad>

          <Propiedad icono={CreditCard} label="Condiciones">
            <p className="truncate text-sm text-text-2">
              {cotizacion.payment_terms ?? "—"}
            </p>
          </Propiedad>

          <Propiedad icono={CalendarClock} label="Enviada">
            <p className="tnum text-sm text-text-2">
              {cotizacion.sent_at ?? "—"}
            </p>
          </Propiedad>
        </div>

        {cotizacion.proposal_url && (
          <div className="border-t border-line px-4 py-3">
            <a
              href={cotizacion.proposal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-text-2 transition-colors hover:border-line-strong hover:text-text"
            >
              <FileText className="size-3.5" />
              Ver cotización
              <ExternalLink className="size-3.5 opacity-60" />
            </a>
          </div>
        )}
      </div>

      <section className="mb-8">
        <SeccionTitulo icono={Wallet}>
          Cobros
          <span className="tnum ml-2 text-xs font-normal text-text-3">
            {pagos.length}
          </span>
        </SeccionTitulo>
        <Cobros cotizacion={cotizacion} pagos={pagos} resta={pendiente} />
      </section>

      <section className="mb-8">
        <SeccionTitulo icono={Layers}>
          Proyectos que cubre
          <span className="tnum ml-2 text-xs font-normal text-text-3">
            {vinculados.length}
          </span>
        </SeccionTitulo>

        {vinculados.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-text-3">
            Esta cotización todavía no está vinculada a ningún proyecto.
          </p>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
            {vinculados.map((p) => (
              <Link
                key={p.id}
                href={`/landing-pages/projects/${p.id}`}
                className="fila-hover flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {p.name}
                  </span>
                  <span className="text-xs text-text-3">
                    {p.client_id
                      ? (nombrePor.get(p.client_id) ?? "Sin cliente")
                      : "Sin cliente"}
                  </span>
                </span>
                <ExternalLink className="size-3.5 shrink-0 text-text-3" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {cotizacion.notes && (
        <section>
          <SeccionTitulo icono={FileText}>Notas</SeccionTitulo>
          <div className="rounded-xl border border-line bg-surface p-4 shadow-e1">
            <p className="whitespace-pre-wrap text-sm text-text-2">
              {cotizacion.notes}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
