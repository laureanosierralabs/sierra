import { InicioProyectosTabla } from "@/components/landing/inicio-proyectos-tabla";
import type { ProyectoInicio } from "@/components/landing/inicio-proyectos-columnas";
import { TarjetaLista } from "@/components/inicio/tarjeta-lista";
import { esProyectoActivo, nombreCliente, type Proyecto } from "@/lib/landing/tipos";

const MAX_PROYECTOS = 6;

interface ProyectosActivosProps {
  proyectos: Proyecto[];
  clientes: Map<string, string>;
  miembros: Map<string, string>;
}

/** Los proyectos abiertos con entrega más cercana; los sin fecha quedan al final. */
export function ProyectosActivos({ proyectos, clientes, miembros }: ProyectosActivosProps) {
  const filas: ProyectoInicio[] = proyectos
    .filter((p) => esProyectoActivo(p.status))
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
    .slice(0, MAX_PROYECTOS)
    .map((p) => ({
      id: p.id,
      name: p.name,
      cliente: nombreCliente(p, clientes) ?? "",
      status: p.status,
      responsables: p.assignee_ids
        .map((id) => miembros.get(id))
        .filter((n): n is string => Boolean(n))
        .join(", "),
      due_date: p.due_date,
    }));

  return (
    <TarjetaLista
      titulo="Proyectos activos"
      verTodo={{ href: "/landing-pages/projects", label: "Ver todos" }}
    >
      <div className="p-4">
        <InicioProyectosTabla proyectos={filas} />
      </div>
    </TarjetaLista>
  );
}
