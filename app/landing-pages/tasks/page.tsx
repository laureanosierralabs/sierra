import {
  listarProcesos,
  listarProyectos,
  listarTareas,
  listarTareasDeProceso,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { PageHeader } from "@/components/landing/ui";
import { TareaForm } from "@/components/landing/tarea-form";
import { TareasTabla } from "@/components/landing/tareas-tabla";
import { VistaTareas } from "@/components/landing/vista-tareas";
import { Procesos } from "@/components/landing/procesos";

export const dynamic = "force-dynamic";

export default async function TareasPage() {
  const [tareas, proyectos, miembros, procesos] = await Promise.all([
    listarTareas(),
    listarProyectos(),
    listarMiembros(),
    listarProcesos(),
  ]);

  const tareasPorProceso = Object.fromEntries(
    await Promise.all(
      procesos.map(
        async (p) => [p.id, await listarTareasDeProceso(p.id)] as const,
      ),
    ),
  );

  return (
    <>
      <PageHeader
        titulo="Tareas"
        descripcion={`${tareas.length} ${tareas.length === 1 ? "tarea" : "tareas"}`}
        accion={<TareaForm miembros={miembros} proyectos={proyectos} />}
      />

      <VistaTareas
        tareas={
          <TareasTabla tareas={tareas} proyectos={proyectos} miembros={miembros} />
        }
        procesos={
          <Procesos procesos={procesos} tareasPorProceso={tareasPorProceso} />
        }
      />
    </>
  );
}
