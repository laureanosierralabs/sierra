import Link from "next/link";
import { formatearMonto } from "@/lib/landing/tipos";
import { Card } from "@/components/tailgrids/core/card";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@tailgrids/icons";
import {
  listarClientes,
  listarCotizacionesDeProyecto,
  listarProyectos,
  listarRecursos,
  listarTareasDeProyecto,
  obtenerProyecto,
} from "@/lib/landing/datos";
import { accesoActual, listarMiembros } from "@/lib/landing/auth";
import { misAcuerdos } from "@/lib/landing/mis-cobros";
import { PageHeader } from "@/components/landing/ui";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { DuplicarProyecto } from "@/components/landing/duplicar-proyecto";
import { BorrarProyecto } from "@/components/landing/borrar";
import { GestionProyecto } from "@/components/landing/gestion-proyecto";
import { ProyectoCotizaciones } from "@/components/landing/proyecto-cotizaciones";
import { ProyectoPropiedades } from "@/components/landing/proyecto-propiedades";
import { Recursos } from "@/components/landing/recursos";
import { Anotaciones } from "@/components/landing/anotaciones";

export const dynamic = "force-dynamic";

export default async function ProyectoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [proyecto, tareas, recursos, miembros, clientes, proyectos, acceso] =
    await Promise.all([
      obtenerProyecto(id),
      listarTareasDeProyecto(id),
      listarRecursos(id),
      listarMiembros(),
      listarClientes(),
      listarProyectos(),
      accesoActual(),
    ]);

  if (!proyecto) notFound();

  // Lo cotizado es información del owner: ni se consulta para un Builder.
  // Al revés, lo que el Builder cobra por este proyecto es solo suyo.
  const [cotizaciones, misAcuerdosDelProyecto] = await Promise.all([
    acceso.esOwner ? listarCotizacionesDeProyecto(id) : Promise.resolve([]),
    acceso.esOwner
      ? Promise.resolve([])
      : misAcuerdos()
          .then((lista) => lista.filter((a) => a.proyectos.some((p) => p.id === id)))
          .catch(() => []),
  ]);

  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));
  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));
  const responsables =
    proyecto.assignee_ids
      .map((id) => nombreMiembro.get(id))
      .filter((n): n is string => Boolean(n))
      .join(", ") || null;

  return (
    <>
      <Link
        href="/landing-pages/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
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

      <ProyectoPropiedades
        proyecto={proyecto}
        responsables={responsables}
        clientePor={clientePor}
        cotizaciones={cotizaciones}
        verCotizacion={acceso.esOwner}
        recursos={recursos}
      />

      {misAcuerdosDelProyecto.length > 0 && (
        <Card className="mb-8 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Tu acuerdo en este proyecto</h2>
          {misAcuerdosDelProyecto.map((a) => {
            const pendiente = Math.max((a.total_amount ?? 0) - a.amount_paid, 0);
            return (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-text-secondary">
                  {a.title}
                  {a.proyectos.length > 1 ? (
                    <span className="text-text-tertiary"> · cubre {a.proyectos.length} proyectos</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-4 tabular-nums">
                  <span>{formatearMonto(a.total_amount, a.currency)}</span>
                  <span className="text-badge-success-text">
                    cobrado {formatearMonto(a.amount_paid, a.currency)}
                  </span>
                  {pendiente > 0 && (
                    <span className="text-badge-warning-text">
                      falta {formatearMonto(pendiente, a.currency)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          <Link href="/landing-pages/mis-cobros" className="self-start text-xs font-medium text-primary-500 hover:underline">
            Ver todos mis cobros
          </Link>
        </Card>
      )}

      <div className="flex flex-col gap-8">
        <GestionProyecto
          proyecto={proyecto}
          tareas={tareas}
          miembros={miembros}
          proyectos={proyectos}
        />

        <Recursos duenoId={proyecto.id} recursos={recursos} />

        {cotizaciones.length > 0 && <ProyectoCotizaciones cotizaciones={cotizaciones} />}

        <Anotaciones
          projectId={proyecto.id}
          valor={proyecto.notes_important}
        />
      </div>
    </>
  );
}
