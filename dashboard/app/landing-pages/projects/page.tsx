import {
  listarClientes,
  listarProcesos,
  listarProyectos,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { PageHeader } from "@/components/landing/ui";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { ToggleVista, VistaProyectos } from "@/components/landing/vista-proyectos";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  const [proyectos, miembros, clientes, procesos] = await Promise.all([
    listarProyectos(),
    listarMiembros(),
    listarClientes(),
    listarProcesos(),
  ]);

  return (
    <>
      <PageHeader
        titulo="Proyectos"
        descripcion={`${proyectos.length} ${proyectos.length === 1 ? "proyecto" : "proyectos"}`}
        accion={
          <span className="flex items-center gap-2">
            <ToggleVista />
            <ProyectoForm
              miembros={miembros}
              clientes={clientes}
              procesos={procesos}
            />
          </span>
        }
      />

      <VistaProyectos
        proyectos={proyectos}
        clientes={clientes}
        miembros={miembros}
      />
    </>
  );
}
