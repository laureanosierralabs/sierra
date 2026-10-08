import Link from "next/link";
import {
  listarClientes,
  listarProyectos,
  listarTareas,
} from "@/lib/landing/datos";
import { listarMiembros } from "@/lib/landing/auth";
import { esProyectoActivo, nombreCliente } from "@/lib/landing/tipos";
import { PageHeader } from "@/components/landing/ui";
import { Calendario } from "@/components/landing/calendario";
import { InicioProyectosTabla } from "@/components/landing/inicio-proyectos-tabla";

export const dynamic = "force-dynamic";

const MAX_EN_INICIO = 8;

export default async function LandingPagesInicio() {
  const [proyectos, tareas, miembros, clientes] = await Promise.all([
    listarProyectos(),
    listarTareas(),
    listarMiembros(),
    listarClientes(),
  ]);

  const nombreMiembro = new Map(miembros.map((m) => [m.id, m.nombre]));
  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));

  // Sin fecha van al final: no compiten con lo que sí tiene deadline.
  const activos = proyectos
    .filter((p) => esProyectoActivo(p.status))
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
    .slice(0, MAX_EN_INICIO)
    .map((p) => ({
      id: p.id,
      name: p.name,
      cliente: nombreCliente(p, clientePor) ?? "",
      status: p.status,
      responsables: p.assignee_ids
        .map((id) => nombreMiembro.get(id))
        .filter((n): n is string => Boolean(n))
        .join(", "),
      due_date: p.due_date,
    }));

  return (
    <>
      <PageHeader titulo="Inicio" />

      <section className="mb-8">
        <Calendario tareas={tareas} proyectos={proyectos} miembros={miembros} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-title-50">Proyectos activos</h2>
          <Link
            href="/landing-pages/projects"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Ver todos →
          </Link>
        </div>

        <InicioProyectosTabla proyectos={activos} />
      </section>
    </>
  );
}
