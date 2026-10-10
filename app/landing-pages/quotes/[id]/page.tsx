import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Buildings11,
  CalendarTime,
  CheckCircle1,
  CreditCard,
  ExpandArrowTopRightSquare1,
  FileText,
  Layers2,
  Wallet2,
} from "@tailgrids/icons";
import {
  listarClientes,
  listarPagos,
  listarProyectos,
  obtenerCotizacion,
} from "@/lib/landing/datos";
import { codigoCotizacion, formatearMonto, pendienteDeCobro } from "@/lib/landing/tipos";
import {
  EstadoCotizacionPill,
  EstadoPagoPill,
  PageHeader,
  SeccionTitulo,
} from "@/components/landing/ui";
import { EmptyState } from "@/components/common/empty-state";
import { BorrarCotizacion } from "@/components/landing/borrar";
import { Cobros } from "@/components/landing/cobros";
import { CotizacionForm } from "@/components/landing/cotizacion-form";
import { DuplicarCotizacion } from "@/components/landing/duplicar-cotizacion";
import { EnlaceBoton } from "@/components/landing/enlace-boton";
import { Propiedad } from "@/components/landing/propiedad";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

export const dynamic = "force-dynamic";

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
  const vinculados = proyectos.filter((p) => cotizacion.project_ids.includes(p.id));
  const pendiente = pendienteDeCobro(cotizacion);

  return (
    <>
      <Link
        href="/landing-pages/quotes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Cotizaciones
      </Link>

      <PageHeader
        titulo={cotizacion.title}
        descripcion={codigoCotizacion(cotizacion.numero)}
        accion={
          <span className="flex items-center gap-3">
            <CotizacionForm clientes={clientes} proyectos={proyectos} cotizacion={cotizacion} />
            <DuplicarCotizacion id={cotizacion.id} />
            <BorrarCotizacion id={cotizacion.id} redirigirA="/landing-pages/quotes" />
          </span>
        }
      />

      <Card className="mb-8 overflow-hidden p-0">
        <div className="grid gap-x-10 px-5 py-3 md:grid-cols-2">
          <Propiedad icono={Buildings11} label="Cliente que paga">
            {cotizacion.client_id ? (
              <Link
                href={`/landing-pages/clients/${cotizacion.client_id}`}
                className="block truncate font-medium hover:underline"
              >
                {nombrePor.get(cotizacion.client_id) ?? "—"}
              </Link>
            ) : (
              <p className="text-text-tertiary">—</p>
            )}
          </Propiedad>

          <Propiedad icono={CheckCircle1} label="Estado comercial">
            <EstadoCotizacionPill estado={cotizacion.commercial_status} />
          </Propiedad>

          <Propiedad icono={Wallet2} label="Monto total">
            <p className="font-semibold tabular-nums">
              {formatearMonto(cotizacion.total_amount, cotizacion.currency)}
            </p>
          </Propiedad>

          <Propiedad icono={CreditCard} label="Estado de pago">
            <EstadoPagoPill estado={cotizacion.payment_status} />
          </Propiedad>

          <Propiedad icono={Wallet2} label="Cobrado">
            <p className="tabular-nums text-badge-success-text">
              {formatearMonto(cotizacion.amount_paid, cotizacion.currency)}
            </p>
          </Propiedad>

          <Propiedad icono={Wallet2} label="Pendiente">
            <p
              className={cn(
                "tabular-nums",
                pendiente > 0 ? "text-badge-warning-text" : "text-text-tertiary",
              )}
            >
              {pendiente > 0 ? formatearMonto(pendiente, cotizacion.currency) : "—"}
            </p>
          </Propiedad>

          <Propiedad icono={CreditCard} label="Condiciones">
            <p className="truncate text-text-secondary">{cotizacion.payment_terms ?? "—"}</p>
          </Propiedad>

          <Propiedad icono={CalendarTime} label="Enviada">
            <p className="tabular-nums text-text-secondary">{cotizacion.sent_at ?? "—"}</p>
          </Propiedad>
        </div>

        {cotizacion.proposal_url && (
          <div className="border-t border-card-border px-5 py-3">
            <EnlaceBoton href={cotizacion.proposal_url} externo icono={<FileText />}>
              Ver cotización
            </EnlaceBoton>
          </div>
        )}
      </Card>

      <section className="mb-8">
        <SeccionTitulo icono={Wallet2}>
          Cobros
          <span className="ml-2 text-xs font-normal tabular-nums text-text-tertiary">
            {pagos.length}
          </span>
        </SeccionTitulo>
        <Cobros cotizacion={cotizacion} pagos={pagos} resta={pendiente} />
      </section>

      <section className="mb-8">
        <SeccionTitulo icono={Layers2}>
          Proyectos que cubre
          <span className="ml-2 text-xs font-normal tabular-nums text-text-tertiary">
            {vinculados.length}
          </span>
        </SeccionTitulo>

        {vinculados.length === 0 ? (
          <EmptyState title="Esta cotización todavía no está vinculada a ningún proyecto" />
        ) : (
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-card-border">
              {vinculados.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/landing-pages/projects/${p.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors outline-none hover:bg-background-gray-secondary focus-visible:bg-background-gray-secondary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {p.name}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {p.client_id ? (nombrePor.get(p.client_id) ?? "Sin cliente") : "Sin cliente"}
                      </span>
                    </span>
                    <ExpandArrowTopRightSquare1 className="size-4 shrink-0 text-text-tertiary" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {cotizacion.notes && (
        <section>
          <SeccionTitulo icono={FileText}>Notas</SeccionTitulo>
          <Card>
            <p className="text-sm whitespace-pre-wrap text-text-secondary">{cotizacion.notes}</p>
          </Card>
        </section>
      )}
    </>
  );
}
