import {
  listarProcesos,
  listarProyectos,
  listarTareas,
  listarTareasDeProcesos,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { PageHeader } from "@/components/landing/ui";
import { TareaForm } from "@/components/landing/tarea-form";
import { TareasTabla } from "@/components/landing/tareas-tabla";
import { VistaTareas } from "@/components/landing/vista-tareas";
import { Procesos } from "@/components/landing/procesos";

export const dynamic = "force-dynamic";

export default async function TareasPage() {
  // Procesos primero (hacen falta sus ids); las tareas de todos van en una sola consulta.
  const procesosP = listarProcesos();
  const [tareas, proyectos, miembros, procesos, tareasPorProceso] = await Promise.all([
    listarTareas(),
    listarProyectos(),
    listarMiembros(),
    procesosP,
    procesosP.then((ps) => listarTareasDeProcesos(ps.map((p) => p.id))),
  ]);

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
