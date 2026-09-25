import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  listarProyectos,
  obtenerProyecto,
  obtenerTarea,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { PageHeader } from "@/components/landing/ui";
import { TareaContenido } from "@/components/landing/tarea-contenido";
import { TareaForm } from "@/components/landing/tarea-form";
import { BorrarTarea } from "@/components/landing/borrar";

export const dynamic = "force-dynamic";

export default async function TareaDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tarea = await obtenerTarea(id);
  if (!tarea) notFound();

  const [proyecto, miembros, proyectos] = await Promise.all([
    tarea.project_id ? obtenerProyecto(tarea.project_id) : null,
    listarMiembros(),
    listarProyectos(),
  ]);

  const volverA = proyecto
    ? `/landing-pages/projects/${proyecto.id}`
    : "/landing-pages/tasks";

  return (
    <>
      <Link
        href={volverA}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        {proyecto ? proyecto.name : "Tareas"}
      </Link>

      <PageHeader
        titulo={tarea.title}
        accion={
          <span className="flex items-center gap-3">
            <TareaForm miembros={miembros} proyectos={proyectos} tarea={tarea} />
            <BorrarTarea
              id={tarea.id}
              projectId={tarea.project_id ?? undefined}
              redirigirA={volverA}
            />
          </span>
        }
      />

      <TareaContenido
        tarea={tarea}
        proyecto={proyecto}
        miembros={miembros}
      />
    </>
  );
}
