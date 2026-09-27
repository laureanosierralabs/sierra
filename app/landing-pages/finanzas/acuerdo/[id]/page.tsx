import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CreditCard,
  ExternalLink,
  FileText,
  Layers,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  listarClientes,
  listarPagosEquipo,
  listarProyectos,
  obtenerAcuerdo,
} from "@/lib/landing/datos";
import {
  codigoAcuerdo,
  formatearMonto,
  pendienteDePago,
} from "@/lib/landing/tipos";
import {
  EstadoPagoPill,
  PageHeader,
  SeccionTitulo,
} from "@/components/landing/ui";
import { AcuerdoForm } from "@/components/landing/acuerdo-form";
import { PagosEquipo } from "@/components/landing/pagos-equipo";
import { BorrarAcuerdo } from "@/components/landing/borrar";

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
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Finanzas
      </Link>

      <PageHeader
        titulo={acuerdo.title}
        descripcion={`${codigoAcuerdo(acuerdo.numero)} · ${acuerdo.member_name}`}
        accion={
          <span className="flex items-center gap-3">
            <AcuerdoForm
              proyectos={proyectos}
              clientes={clientes}
              acuerdo={acuerdo}
            />
            <BorrarAcuerdo id={acuerdo.id} redirigirA="/landing-pages/finanzas" />
          </span>
        }
      />

      <div className="mb-8 overflow-hidden rounded-xl border border-line bg-surface shadow-e1">
        <div className="grid gap-x-10 px-4 py-3 md:grid-cols-2">
          <Propiedad icono={UserRound} label="Para">
            <p className="truncate text-sm font-medium">{acuerdo.member_name}</p>
          </Propiedad>

          <Propiedad icono={CreditCard} label="Estado">
            <EstadoPagoPill estado={acuerdo.payment_status} />
          </Propiedad>

          <Propiedad icono={Wallet} label="Monto acordado">
            <p className="tnum text-sm font-semibold">
              {formatearMonto(acuerdo.total_amount, acuerdo.currency)}
            </p>
          </Propiedad>

          <Propiedad icono={Wallet} label="Pagado">
            <p className="tnum text-sm">
              {formatearMonto(acuerdo.amount_paid, acuerdo.currency)}
            </p>
          </Propiedad>

          <Propiedad icono={Wallet} label="Resta">
            <p className={`tnum text-sm ${resta > 0 ? "text-warn" : "text-text-3"}`}>
              {resta > 0 ? formatearMonto(resta, acuerdo.currency) : "—"}
            </p>
          </Propiedad>

          <Propiedad icono={CreditCard} label="Condiciones">
            <p className="truncate text-sm text-text-2">
              {acuerdo.payment_terms ?? "—"}
            </p>
          </Propiedad>

          <Propiedad icono={CalendarClock} label="Fecha del acuerdo">
            <p className="tnum text-sm text-text-2">
              {acuerdo.agreed_on ?? "—"}
            </p>
          </Propiedad>
        </div>
      </div>

      <section className="mb-8">
        <SeccionTitulo icono={Wallet}>
          Pagos
          <span className="tnum ml-2 text-xs font-normal text-text-3">
            {pagos.length}
          </span>
        </SeccionTitulo>
        <PagosEquipo acuerdo={acuerdo} pagos={pagos} resta={resta} />
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
            Sin proyectos vinculados: es trabajo por horas.
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

      {acuerdo.notes && (
        <section>
          <SeccionTitulo icono={FileText}>Notas</SeccionTitulo>
          <div className="rounded-xl border border-line bg-surface p-4 shadow-e1">
            <p className="whitespace-pre-wrap text-sm text-text-2">
              {acuerdo.notes}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
