import {
  cotizadoPorProyecto,
  listarClientes,
  listarProcesos,
  listarProyectos,
} from "@/lib/landing/datos";
import { accesoActual, listarMiembros } from "@/lib/landing/auth";
import { PageHeader } from "@/components/landing/ui";
import { ProyectoForm } from "@/components/landing/proyecto-form";
import { ToggleVista, VistaProyectos } from "@/components/landing/vista-proyectos";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  const [proyectos, miembros, clientes, procesos, acceso] = await Promise.all([
    listarProyectos(),
    listarMiembros(),
    listarClientes(),
    listarProcesos(),
    accesoActual(),
  ]);

  // Lo que se cobra es información del owner: un Builder ve el proyecto,
  // no su precio. El dato ni siquiera se consulta si no corresponde.
  const cotizado = acceso.esOwner ? await cotizadoPorProyecto() : new Map();

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
        cotizado={cotizado}
        verCotizacion={acceso.esOwner}
      />
    </>
  );
}
