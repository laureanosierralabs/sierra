import { notFound } from "next/navigation";
import {
  listarProyectos,
  obtenerProyecto,
  obtenerTarea,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { PanelLateral } from "@/components/landing/panel-lateral";
import { TareaContenido } from "@/components/landing/tarea-contenido";
import { TareaForm } from "@/components/landing/tarea-form";
import { BorrarTarea } from "@/components/landing/borrar";

export const dynamic = "force-dynamic";

export default async function PanelTarea({
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

  return (
    <PanelLateral
      titulo={tarea.title}
      verCompletoEn={`/landing-pages/tasks/${tarea.id}`}
      acciones={
        <>
          <TareaForm miembros={miembros} proyectos={proyectos} tarea={tarea} />
          <BorrarTarea
            id={tarea.id}
            projectId={tarea.project_id ?? undefined}
          />
        </>
      }
    >
      <TareaContenido
        tarea={tarea}
        proyecto={proyecto}
        miembros={miembros}
        columnas={1}
      />
    </PanelLateral>
  );
}
