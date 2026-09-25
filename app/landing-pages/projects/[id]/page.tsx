import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CircleDashed,
  ExternalLink,
  FileText,
  Flag,
  Target,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  listarClientes,
  listarCotizaciones,
  listarProyectos,
  listarRecursos,
  listarTareasDeProyecto,
  obtenerProyecto,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { formatearMonto, nombreCliente } from "@/lib/landing/tipos";
import {
  EstadoCotizacionPill,
  PageHeader,
  Prioridad,
  SeccionTitulo,
  Vencimiento,
} from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { EtapaSelect } from "@/components/landing/etapa-select";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { DuplicarProyecto } from "@/components/landing/duplicar-proyecto";
import { PortadaProyecto } from "@/components/landing/portada-proyecto";
import { BorrarProyecto } from "@/components/landing/borrar";
import { GestionProyecto } from "@/components/landing/gestion-proyecto";
import { Recursos } from "@/components/landing/recursos";
import { Anotaciones } from "@/components/landing/anotaciones";

export const dynamic = "force-dynamic";

/** Fila del header: ícono + etiqueta a la izquierda, valor a la derecha. */
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
      <span className="flex w-36 shrink-0 items-center gap-2 text-xs text-text-3">
        <Icono className="size-3.5" />
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default async function ProyectoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [proyecto, tareas, recursos, miembros, clientes, proyectos, cotizaciones] =
    await Promise.all([
      obtenerProyecto(id),
      listarTareasDeProyecto(id),
      listarRecursos(id),
      listarMiembros(),
      listarClientes(),
      listarProyectos(),
      listarCotizaciones(),
    ]);

  if (!proyecto) notFound();

  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));
  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));
  const responsable = proyecto.responsible_user_id
    ? (nombreMiembro.get(proyecto.responsible_user_id) ?? null)
    : null;

  const enlaces = recursos.filter((r) => r.url);
  const susCotizaciones = proyecto.client_id
    ? cotizaciones.filter((q) => q.client_id === proyecto.client_id)
    : cotizaciones.filter((q) => q.id === proyecto.quote_id);

  return (
    <>
      <Link
        href="/landing-pages/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Proyectos
      </Link>

      <PageHeader
        titulo={proyecto.name}
        accion={
          <span className="flex items-center gap-3">
            <ProyectoForm
              miembros={miembros}
              clientes={clientes}
              proyecto={proyecto}
            />
            <DuplicarProyecto id={proyecto.id} />
            <BorrarProyecto id={proyecto.id} redirigirA="/landing-pages/projects" />
          </span>
        }
      />

      <div className="mb-8 overflow-hidden rounded-xl border border-line bg-surface">
        <PortadaProyecto
          projectId={proyecto.id}
          coverUrl={proyecto.cover_url}
        />

        <div className="grid gap-x-10 px-4 py-3 md:grid-cols-2">
          <Propiedad icono={CircleDashed} label="Estado">
            <EstadoSelect
              id={proyecto.id}
              valor={proyecto.status}
              tipo="proyecto"
            />
          </Propiedad>

          <Propiedad icono={Target} label="Etapa">
            <EtapaSelect id={proyecto.id} valor={proyecto.stage} />
          </Propiedad>

          <Propiedad icono={UserRound} label="Responsable">
            <p className="truncate text-sm">{responsable ?? "—"}</p>
          </Propiedad>

          <Propiedad icono={Building2} label="Cliente">
            {proyecto.client_id ? (
              <Link
                href={`/landing-pages/clients/${proyecto.client_id}`}
                className="truncate text-sm font-medium hover:underline"
              >
                {nombreCliente(proyecto, clientePor) ?? "—"}
              </Link>
            ) : (
              <p className="truncate text-sm">
                {nombreCliente(proyecto, clientePor) ?? "—"}
              </p>
            )}
          </Propiedad>

          <Propiedad icono={Flag} label="Prioridad">
            <Prioridad prioridad={proyecto.priority} />
          </Propiedad>

          <Propiedad icono={CalendarClock} label="Deadline">
            <Vencimiento fecha={proyecto.due_date} cerrado={proyecto.status === "entregado"} />
          </Propiedad>
        </div>

        {/* Los links que se usan todo el día, sin scrollear hasta Recursos */}
        {enlaces.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
            {enlaces.map((r) => (
              <a
                key={r.id}
                href={r.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm font-medium text-text-2 transition-colors hover:border-line-strong hover:bg-surface hover:text-text"
              >
                {r.name}
                <ExternalLink className="size-3.5 text-text-3 transition-colors group-hover:text-text-2" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <GestionProyecto
          proyecto={proyecto}
          tareas={tareas}
          miembros={miembros}
          proyectos={proyectos}
        />

        <Recursos duenoId={proyecto.id} recursos={recursos} />

        {susCotizaciones.length > 0 && (
          <section>
            <SeccionTitulo icono={FileText}>
              Cotizaciones y acuerdos
            </SeccionTitulo>
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {susCotizaciones.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {q.title}
                    </span>
                    {q.id === proyecto.quote_id && (
                      <span className="shrink-0 text-[0.6875rem] text-text-3">
                        origen
                      </span>
                    )}
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
              ))}
            </div>
          </section>
        )}

        <Anotaciones
          projectId={proyecto.id}
          valor={proyecto.notes_important}
        />
      </div>
    </>
  );
}
