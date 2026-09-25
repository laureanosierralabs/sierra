import Link from "next/link";
import { AlertTriangle, CalendarClock, CircleDot } from "lucide-react";
import { getUnidades } from "@/lib/contexto";
import { diasHasta, type Proyecto } from "@/lib/types";
import { Card, Deadline, Empty } from "@/components/ui";
import { ProyectoCard } from "@/components/proyecto-card";

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
    <div className="w-full px-6 py-10 md:px-10">
      <header className="mb-10">
        <p className="eyebrow">{hoy}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {saludo()}, Laureano
        </h1>
        <p className="mt-2 text-sm text-text-2">
          {atencion.length > 0
            ? `${atencion.length} ${atencion.length === 1 ? "proyecto necesita" : "proyectos necesitan"} tu atención.`
            : "Nada urgente hoy."}
        </p>
      </header>

      <section className="mb-12 grid grid-cols-3 gap-3">
        <Metric
          label="Activos"
          valor={todos.filter((p) => p.estado === "activo").length}
          icon={<CircleDot className="size-4 text-ok" />}
        />
        <Metric
          label="Con entrega"
          valor={conEntrega}
          detalle="Fechas que vos me diste"
          icon={<CalendarClock className="size-4 text-warn" />}
        />
        <Metric
          label="Esperando a otros"
          valor={bloqueados}
          detalle="Dependés de alguien para avanzar"
          icon={<AlertTriangle className="size-4 text-critical" />}
        />
      </section>

      {atencion.length > 0 && (
        <section className="mb-12">
          <SectionTitle>Necesita atención</SectionTitle>
          <div className="flex flex-col gap-3">
            {atencion.map((p) => (
              <AtencionRow key={p.slug} p={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-12">
        <SectionTitle>Activos</SectionTitle>
        {activos.length === 0 ? (
          <Empty>Todos los activos están arriba, en atención.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activos.map((p) => (
              <ProyectoCard key={p.slug} p={p} />
            ))}
          </div>
        )}
      </section>

      {porEmpezar.length > 0 && (
        <section className="mb-12">
          <SectionTitle>Por empezar</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {porEmpezar.map((p) => (
              <ProyectoCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      )}

      {pausados.length > 0 && (
        <section>
          <SectionTitle>Pausados</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pausados.map((p) => (
              <ProyectoCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-2">
      {children}
    </h2>
  );
}

function Metric({
  label,
  valor,
  detalle,
  icon,
}: {
  label: string;
  valor: number;
  detalle?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-3">{label}</p>
        {icon}
      </div>
      <p className="tnum mt-2 font-display text-2xl font-bold">{valor}</p>
      {detalle && <p className="mt-1 text-[0.6875rem] text-text-3">{detalle}</p>}
    </Card>
  );
}

function AtencionRow({ p }: { p: Proyecto }) {
  const dias = diasHasta(p.entrega);
  const urgente = dias !== null && dias <= 10;

  return (
    <Link href={`/proyecto/${p.slug}`} className="group block">
      <Card
        className={`p-5 transition-colors hover:border-line-strong ${
          urgente ? "border-l-2 border-l-warn" : ""
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-display text-base font-bold">{p.nombre}</h3>
              <span className="text-xs text-text-3">{p.cliente}</span>
            </div>
            {p.proximoPaso && (
              <p className="mt-2 text-sm text-text-2">{p.proximoPaso}</p>
            )}
            {p.bloqueos.length > 0 && (
              <div className="mt-3 flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-critical" />
                <p className="text-xs text-critical">{p.bloqueos.join(" · ")}</p>
              </div>
            )}
          </div>
          {dias !== null && <Deadline dias={dias} />}
        </div>
      </Card>
    </Link>
  );
}
