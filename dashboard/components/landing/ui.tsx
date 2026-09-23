import { cn } from "@/lib/utils";
import {
  LABEL_ESTADO_CLIENTE,
  LABEL_ESTADO_COTIZACION,
  LABEL_ESTADO_PROYECTO,
  LABEL_ESTADO_TAREA,
  type EstadoCliente,
  type EstadoCotizacion,
  type EstadoProyecto,
  type EstadoTarea,
  type PrioridadLanding,
} from "@/lib/landing/tipos";

type Tono = { dot: string; text: string };

const TONO_PROYECTO: Record<EstadoProyecto, Tono> = {
  "por-iniciar": { dot: "bg-idle", text: "text-idle" },
  "en-progreso": { dot: "bg-ok", text: "text-ok" },
  "en-revision": { dot: "bg-warn", text: "text-warn" },
  "esperando-cliente": { dot: "bg-critical", text: "text-critical" },
  entregado: { dot: "bg-text-3", text: "text-text-3" },
};

const TONO_TAREA: Record<EstadoTarea, Tono> = {
  pendiente: { dot: "bg-idle", text: "text-idle" },
  "en-progreso": { dot: "bg-ok", text: "text-ok" },
  "en-revision": { dot: "bg-warn", text: "text-warn" },
  bloqueada: { dot: "bg-critical", text: "text-critical" },
  completada: { dot: "bg-text-3", text: "text-text-3" },
};

function Pill({ tono, label }: { tono: Tono; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line",
        "bg-surface-2 px-2.5 py-1 text-xs font-medium",
        tono.text,
      )}
    >
      <span className={cn("size-1.5 rounded-full", tono.dot)} />
      {label}
    </span>
  );
}

export function EstadoProyectoPill({ estado }: { estado: EstadoProyecto }) {
  return (
    <Pill
      tono={TONO_PROYECTO[estado] ?? TONO_PROYECTO["por-iniciar"]}
      label={LABEL_ESTADO_PROYECTO[estado] ?? estado}
    />
  );
}

export function EstadoTareaPill({ estado }: { estado: EstadoTarea }) {
  return (
    <Pill
      tono={TONO_TAREA[estado] ?? TONO_TAREA.pendiente}
      label={LABEL_ESTADO_TAREA[estado] ?? estado}
    />
  );
}

const TONO_CLIENTE: Record<EstadoCliente, Tono> = {
  prospecto: { dot: "bg-idle", text: "text-idle" },
  cliente: { dot: "bg-ok", text: "text-ok" },
  inactivo: { dot: "bg-text-3", text: "text-text-3" },
};

const TONO_COTIZACION: Record<EstadoCotizacion, Tono> = {
  borrador: { dot: "bg-text-3", text: "text-text-3" },
  enviada: { dot: "bg-idle", text: "text-idle" },
  seguimiento: { dot: "bg-warn", text: "text-warn" },
  aprobada: { dot: "bg-ok", text: "text-ok" },
  rechazada: { dot: "bg-critical", text: "text-critical" },
};

export function EstadoClientePill({ estado }: { estado: EstadoCliente }) {
  return (
    <Pill
      tono={TONO_CLIENTE[estado] ?? TONO_CLIENTE.prospecto}
      label={LABEL_ESTADO_CLIENTE[estado] ?? estado}
    />
  );
}

export function EstadoCotizacionPill({ estado }: { estado: EstadoCotizacion }) {
  return (
    <Pill
      tono={TONO_COTIZACION[estado] ?? TONO_COTIZACION.borrador}
      label={LABEL_ESTADO_COTIZACION[estado] ?? estado}
    />
  );
}

export function Prioridad({ prioridad }: { prioridad: PrioridadLanding }) {
  if (prioridad === "alta") {
    return (
      <span className="rounded border border-warn/30 bg-warn-dim px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-warn">
        Alta
      </span>
    );
  }
  return <span className="text-xs text-text-3">—</span>;
}

/** Fecha con color por urgencia. El color codifica, no decora. */
export function Vencimiento({ fecha }: { fecha: string | null }) {
  if (!fecha) return <span className="text-xs text-text-3">—</span>;

  const objetivo = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(objetivo.getTime()))
    return <span className="text-xs text-text-3">—</span>;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);

  const vencido = dias < 0;
  const urgente = dias >= 0 && dias <= 7;

  const texto = vencido
    ? `Venció hace ${Math.abs(dias)}d`
    : dias === 0
      ? "Vence hoy"
      : `${dias} ${dias === 1 ? "día" : "días"}`;

  return (
    <span
      className={cn(
        "tnum inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
        vencido && "bg-critical-dim text-critical",
        urgente && !vencido && "bg-warn-dim text-warn",
        !vencido && !urgente && "bg-surface-2 text-text-2",
      )}
    >
      {texto}
    </span>
  );
}

export function PageHeader({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold">{titulo}</h1>
        {descripcion && (
          <p className="mt-1 text-sm text-text-2">{descripcion}</p>
        )}
      </div>
      {accion}
    </header>
  );
}

export function VacioTabla({
  children,
  colSpan,
}: {
  children: React.ReactNode;
  colSpan: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-text-3">
        {children}
      </td>
    </tr>
  );
}
