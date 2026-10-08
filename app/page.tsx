import { CalendarTime, CheckCircle1, InfoTriangle } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { InicioAtencion } from "@/components/inicio-atencion";
import { InicioGrilla } from "@/components/inicio-grilla";
import { SeccionTitulo } from "@/components/landing/ui";
import { TeamSummary } from "@/components/team-summary";
import { getUnidades } from "@/lib/contexto";
import { diasHasta, type Proyecto } from "@/lib/types";

export const dynamic = "force-dynamic";

function saludo() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Necesita atención: bloqueado, vencido, o entrega dentro de 10 días.
 * `por-empezar` cuenta: aunque no arrancó, si tiene fecha cerca es urgente.
 */
function necesitaAtencion(p: Proyecto): boolean {
  if (p.estado === "terminado" || p.estado === "pausado") return false;
  if (p.bloqueos.length > 0) return true;
  const d = diasHasta(p.entrega);
  return d !== null && d <= 10;
}

export default async function Inicio() {
  const unidades = await getUnidades();
  const todos = unidades.flatMap((u) => u.proyectos);

  const atencion = todos
    .filter(necesitaAtencion)
    .sort((a, b) => (diasHasta(a.entrega) ?? 999) - (diasHasta(b.entrega) ?? 999));

  const activos = todos.filter(
    (p) => p.estado === "activo" && !necesitaAtencion(p),
  );
  const porEmpezar = todos.filter(
    (p) => p.estado === "por-empezar" && !necesitaAtencion(p),
  );
  const pausados = todos.filter((p) => p.estado === "pausado");

  const conEntrega = todos.filter((p) => p.entrega && p.estado !== "terminado").length;
  const bloqueados = todos.filter((p) => p.bloqueos.length > 0).length;

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <PageContainer>
      <PageHeader
        title={`${saludo()}, Laureano`}
        description={`${hoy[0].toUpperCase()}${hoy.slice(1)}. ${
          atencion.length > 0
            ? `${atencion.length} ${atencion.length === 1 ? "proyecto necesita" : "proyectos necesitan"} tu atención.`
            : "Nada urgente hoy."
        }`}
      />

      <TeamSummary />

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Activos"
          value={todos.filter((p) => p.estado === "activo").length}
          icon={<CheckCircle1 />}
          tone="success"
        />
        <KpiCard
          label="Con entrega"
          value={conEntrega}
          hint="Fechas que vos me diste"
          icon={<CalendarTime />}
          tone="warning"
        />
        <KpiCard
          label="Esperando a otros"
          value={bloqueados}
          hint="Dependés de alguien para avanzar"
          icon={<InfoTriangle />}
          tone="error"
        />
      </section>

      {atencion.length > 0 && (
        <section className="mb-8">
          <SeccionTitulo icono={InfoTriangle}>Necesita atención</SeccionTitulo>
          <div className="flex flex-col gap-3">
            {atencion.map((p) => (
              <InicioAtencion key={p.slug} p={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <SeccionTitulo icono={CheckCircle1}>Activos</SeccionTitulo>
        {activos.length === 0 ? (
          <EmptyState title="Todos los activos están arriba, en atención." />
        ) : (
          <InicioGrilla proyectos={activos} />
        )}
      </section>

      {porEmpezar.length > 0 && (
        <section className="mb-8">
          <SeccionTitulo icono={CalendarTime}>Por empezar</SeccionTitulo>
          <InicioGrilla proyectos={porEmpezar} />
        </section>
      )}

      {pausados.length > 0 && (
        <section>
          <SeccionTitulo icono={CalendarTime}>Pausados</SeccionTitulo>
          <InicioGrilla proyectos={pausados} />
        </section>
      )}
    </PageContainer>
  );
}
