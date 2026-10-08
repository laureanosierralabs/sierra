import Link from "next/link";
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
  const cotizaciones = acceso.esOwner
    ? await listarCotizacionesDeProyecto(id)
    : [];

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
