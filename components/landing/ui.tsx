import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LABEL_ESTADO_CLIENTE,
  LABEL_ESTADO_COTIZACION,
  LABEL_ESTADO_PAGO,
  LABEL_ESTADO_PROYECTO,
  LABEL_ESTADO_TAREA,
  LABEL_PRIORIDAD,
  LABEL_TIPO_PAGINA_CORTO,
  TONO_TIPO_PAGINA,
  type EstadoCliente,
  type EstadoCotizacion,
  type EstadoPago,
  type EstadoProyecto,
  type EstadoTarea,
  type PrioridadLanding,
  type TipoPagina,
} from "@/lib/landing/tipos";

/** El fondo teñido pertenece al estado, no al componente: así el color
    hace el trabajo de señalizar y el texto solo confirma. */
type Tono = { dot: string; text: string; fondo: string; borde: string };

/* Clases literales, no interpoladas: Tailwind escanea el fuente y no
   genera una clase que se arma en runtime. */
const NEUTRO: Tono = {
  dot: "bg-text-3",
  text: "text-text-3",
  fondo: "bg-surface-2",
  borde: "border-line",
};

const OK: Tono = {
  dot: "bg-ok",
  text: "text-ok",
  fondo: "bg-ok-dim",
  borde: "border-ok/20",
};

const WARN: Tono = {
  dot: "bg-warn",
  text: "text-warn",
  fondo: "bg-warn-dim",
  borde: "border-warn/20",
};

const CRITICAL: Tono = {
  dot: "bg-critical",
  text: "text-critical",
  fondo: "bg-critical-dim",
  borde: "border-critical/20",
};

const IDLE: Tono = {
  dot: "bg-idle",
  text: "text-idle",
  fondo: "bg-idle-dim",
  borde: "border-idle/20",
};

const TONO_PROYECTO: Record<EstadoProyecto, Tono> = {
  "por-iniciar": IDLE,
  "en-progreso": OK,
  "en-revision": WARN,
  "esperando-cliente": CRITICAL,
  "stand-by": NEUTRO,
  entregado: OK,
};

const TONO_TAREA: Record<EstadoTarea, Tono> = {
  pendiente: IDLE,
  "en-progreso": OK,
  "en-revision": WARN,
  bloqueada: CRITICAL,
  completada: NEUTRO,
};

function Pill({ tono, label }: { tono: Tono; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-xs font-medium",
        tono.borde,
        tono.fondo,
        tono.text,
      )}
    >
      <span className={cn("size-1.5 rounded-full", tono.dot)} />
      {label}
    </span>
  );
}

/** Badge de categoría: identifica qué ES la página, no su estado. */
export function TipoPaginaBadge({ tipo }: { tipo: TipoPagina }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5",
        "text-[0.625rem] font-semibold uppercase tracking-wide",
        TONO_TIPO_PAGINA[tipo],
      )}
    >
      {LABEL_TIPO_PAGINA_CORTO[tipo]}
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
  prospecto: IDLE,
  cliente: OK,
  inactivo: NEUTRO,
};

const TONO_COTIZACION: Record<EstadoCotizacion, Tono> = {
  draft: NEUTRO,
  sent: IDLE,
  approved: OK,
  rejected: CRITICAL,
  cancelled: NEUTRO,
};

/** El pago no alarma salvo que esté pendiente: ahí sí hay algo que hacer. */
const TONO_PAGO: Record<EstadoPago, Tono> = {
  not_applicable: NEUTRO,
  pending: WARN,
  partial: IDLE,
  paid: OK,
};

export function EstadoPagoPill({ estado }: { estado: EstadoPago }) {
  if (estado === "not_applicable") {
    return <span className="text-xs text-text-3">—</span>;
  }
  return (
    <Pill
      tono={TONO_PAGO[estado] ?? NEUTRO}
      label={LABEL_ESTADO_PAGO[estado] ?? estado}
    />
  );
}

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
      tono={TONO_COTIZACION[estado] ?? TONO_COTIZACION.draft}
      label={LABEL_ESTADO_COTIZACION[estado] ?? estado}
    />
  );
}

const TONO_PRIORIDAD: Record<PrioridadLanding, string> = {
  alta: "border-warn/30 bg-warn-dim text-warn",
  media: "border-line bg-surface-2 text-text-2",
  baja: "border-line bg-surface-2 text-text-3",
};

export function Prioridad({ prioridad }: { prioridad: PrioridadLanding }) {
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide",
        TONO_PRIORIDAD[prioridad],
      )}
    >
      {LABEL_PRIORIDAD[prioridad]}
    </span>
  );
}

/** Fecha con color por urgencia. El color codifica, no decora. */
export function Vencimiento({
  fecha,
  cerrado = false,
}: {
  fecha: string | null;
  /** Ya entregado o completado: la fecha se cumplió, no venció. */
  cerrado?: boolean;
}) {
  if (!fecha) return <span className="text-xs text-text-3">—</span>;

  const objetivo = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(objetivo.getTime()))
    return <span className="text-xs text-text-3">—</span>;

  // Lo cerrado no corre contra el reloj: se muestra la fecha, sin urgencia.
  if (cerrado) {
    return (
      <span className="tnum inline-flex items-center rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold text-text-2">
        {fecha}
      </span>
    );
  }

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

/** Título de sección dentro de una página, con su ícono. */
export function SeccionTitulo({
  icono: Icono,
  children,
  accion,
}: {
  icono: LucideIcon;
  children: React.ReactNode;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold">
        <Icono className="size-4 text-text-3" />
        {children}
      </h2>
      {accion}
    </div>
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
