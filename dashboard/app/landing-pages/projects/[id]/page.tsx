import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  listarClientes,
  listarProyectos,
  listarRecursos,
  listarTareasDeProyecto,
  obtenerProyecto,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { nombreCliente } from "@/lib/landing/tipos";
import { PageHeader, Prioridad, Vencimiento } from "@/components/landing/ui";
import { EstadoSelect } from "@/components/landing/estado-select";
import { EtapaSelect } from "@/components/landing/etapa-select";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { GestionProyecto } from "@/components/landing/gestion-proyecto";
import { Recursos } from "@/components/landing/recursos";
import { Anotaciones } from "@/components/landing/anotaciones";

export const dynamic = "force-dynamic";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-1">{label}</p>
      {children}
    </div>
  );
}

export default async function ProyectoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [proyecto, tareas, recursos, miembros, clientes, proyectos] =
    await Promise.all([
      obtenerProyecto(id),
      listarTareasDeProyecto(id),
      listarRecursos(id),
      listarMiembros(),
      listarClientes(),
      listarProyectos(),
    ]);

  if (!proyecto) notFound();

  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));
  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));
  const responsable = proyecto.responsible_user_id
    ? (nombreMiembro.get(proyecto.responsible_user_id) ?? null)
    : null;

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
        descripcion={nombreCliente(proyecto, clientePor) ?? undefined}
        accion={
          <ProyectoForm
            miembros={miembros}
            clientes={clientes}
            proyecto={proyecto}
          />
        }
      />

      <div className="mb-8 flex flex-wrap items-start gap-x-8 gap-y-4 rounded-xl border border-line bg-surface px-4 py-3">
        <Campo label="Estado">
          <EstadoSelect id={proyecto.id} valor={proyecto.status} tipo="proyecto" />
        </Campo>
        <Campo label="Etapa">
          <EtapaSelect id={proyecto.id} valor={proyecto.stage} />
        </Campo>
        <Campo label="Responsable">
          <p className="text-sm">{responsable ?? "—"}</p>
        </Campo>
        <Campo label="Prioridad">
          <Prioridad prioridad={proyecto.priority} />
        </Campo>
        <Campo label="Deadline">
          <Vencimiento fecha={proyecto.due_date} />
        </Campo>
      </div>

      <div className="flex flex-col gap-8">
        <GestionProyecto
          proyecto={proyecto}
          tareas={tareas}
          miembros={miembros}
          proyectos={proyectos}
        />

        <Recursos projectId={proyecto.id} recursos={recursos} />

        <Anotaciones
          projectId={proyecto.id}
          valor={proyecto.notes_important}
        />
      </div>
    </>
  );
}
