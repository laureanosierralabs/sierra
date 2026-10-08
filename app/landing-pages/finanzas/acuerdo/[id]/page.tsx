import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarTime,
  CreditCard,
  ExpandArrowTopRightSquare1,
  FileText,
  Layers2,
  User2,
  Wallet2,
} from "@tailgrids/icons";
import {
  listarClientes,
  listarPagosEquipo,
  listarProyectos,
  obtenerAcuerdo,
} from "@/lib/landing/datos";
import { codigoAcuerdo, formatearMonto, pendienteDePago } from "@/lib/landing/tipos";
import { EstadoPagoPill, PageHeader, SeccionTitulo } from "@/components/landing/ui";
import { EmptyState } from "@/components/common/empty-state";
import { AcuerdoForm } from "@/components/landing/acuerdo-form";
import { BorrarAcuerdo } from "@/components/landing/borrar";
import { PagosEquipo } from "@/components/landing/pagos-equipo";
import { Propiedad } from "@/components/landing/propiedad";
import { Card } from "@/components/tailgrids/core/card";
import { cn } from "@/utils/cn";

export const dynamic = "force-dynamic";

export default async function AcuerdoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [acuerdo, proyectos, clientes, pagos] = await Promise.all([
    obtenerAcuerdo(id),
    listarProyectos(),
    listarClientes(),
    listarPagosEquipo(id),
  ]);

  if (!acuerdo) notFound();

  const nombrePor = new Map(clientes.map((c) => [c.id, c.name]));
  const vinculados = proyectos.filter((p) => acuerdo.project_ids.includes(p.id));
  const resta = pendienteDePago(acuerdo);

  return (
    <>
      <Link
        href="/landing-pages/finanzas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Finanzas
      </Link>

      <PageHeader
        titulo={acuerdo.title}
        descripcion={`${codigoAcuerdo(acuerdo.numero)} · ${acuerdo.member_name}`}
        accion={
          <span className="flex items-center gap-3">
            <AcuerdoForm proyectos={proyectos} clientes={clientes} acuerdo={acuerdo} />
            <BorrarAcuerdo id={acuerdo.id} redirigirA="/landing-pages/finanzas" />
          </span>
        }
      />

      <Card className="mb-8 overflow-hidden p-0">
        <div className="grid gap-x-10 px-5 py-3 md:grid-cols-2">
          <Propiedad icono={User2} label="Para">
            <p className="truncate font-medium">{acuerdo.member_name}</p>
          </Propiedad>

          <Propiedad icono={CreditCard} label="Estado">
            <EstadoPagoPill estado={acuerdo.payment_status} />
          </Propiedad>

          <Propiedad icono={Wallet2} label="Monto acordado">
            <p className="font-semibold tabular-nums">
              {formatearMonto(acuerdo.total_amount, acuerdo.currency)}
            </p>
          </Propiedad>

          <Propiedad icono={Wallet2} label="Pagado">
            <p className="tabular-nums">{formatearMonto(acuerdo.amount_paid, acuerdo.currency)}</p>
          </Propiedad>

          <Propiedad icono={Wallet2} label="Resta">
            <p
              className={cn(
                "tabular-nums",
                resta > 0 ? "text-badge-warning-text" : "text-text-tertiary",
              )}
            >
              {resta > 0 ? formatearMonto(resta, acuerdo.currency) : "—"}
            </p>
          </Propiedad>

          <Propiedad icono={CreditCard} label="Condiciones">
            <p className="truncate text-text-secondary">{acuerdo.payment_terms ?? "—"}</p>
          </Propiedad>

          <Propiedad icono={CalendarTime} label="Fecha del acuerdo">
            <p className="tabular-nums text-text-secondary">{acuerdo.agreed_on ?? "—"}</p>
          </Propiedad>
        </div>
      </Card>

      <section className="mb-8">
        <SeccionTitulo icono={Wallet2}>
          Pagos
          <span className="ml-2 text-xs font-normal tabular-nums text-text-tertiary">
            {pagos.length}
          </span>
        </SeccionTitulo>
        <PagosEquipo acuerdo={acuerdo} pagos={pagos} resta={resta} />
      </section>

      <section className="mb-8">
        <SeccionTitulo icono={Layers2}>
          Proyectos que cubre
          <span className="ml-2 text-xs font-normal tabular-nums text-text-tertiary">
            {vinculados.length}
          </span>
        </SeccionTitulo>

        {vinculados.length === 0 ? (
          <EmptyState title="Sin proyectos vinculados: es trabajo por horas" />
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

      {acuerdo.notes && (
        <section>
          <SeccionTitulo icono={FileText}>Notas</SeccionTitulo>
          <Card>
            <p className="text-sm whitespace-pre-wrap text-text-secondary">{acuerdo.notes}</p>
          </Card>
        </section>
      )}
    </>
  );
}
