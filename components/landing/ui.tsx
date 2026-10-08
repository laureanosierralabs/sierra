import { PageHeader as PageHeaderBase } from "@/components/common/page-header";
import { Badge } from "@/components/tailgrids/core/badge";
import { cn } from "@/utils/cn";
import {

  LABEL_ESTADO_CLIENTE,
  LABEL_ESTADO_COTIZACION,
  LABEL_ESTADO_PAGO,
  LABEL_ESTADO_PROYECTO,
  LABEL_ESTADO_TAREA,
  LABEL_PRIORIDAD,
  LABEL_TIPO_PAGINA_CORTO,
  type EstadoCliente,
  type EstadoCotizacion,
  type EstadoPago,
  type EstadoProyecto,
  type EstadoTarea,
  type PrioridadLanding,
  type TipoPagina,
} from "@/lib/landing/tipos";

/** Cualquier componente de ícono que acepte `className` (@tailgrids/icons o Lucide). */
type IconoComponent = React.ComponentType<{ className?: string }>;

/**
 * Un solo sistema de badges: el `Badge` del template. Cada estado elige una
 * familia de color; el color señaliza y el texto confirma.
 *
 *   OK       -> success  (en curso, entregado, aprobado, pagado)
 *   WARN     -> warning  (en revisión, pago pendiente)
 *   CRITICAL -> error    (bloqueado, esperando cliente, rechazado)
 *   IDLE     -> blue     (por iniciar, enviado, prospecto, pago parcial)
 *   NEUTRO   -> gray     (cerrado, stand-by, borrador, cancelado)
 */
type Tono = NonNullable<React.ComponentProps<typeof Badge>["color"]>;

const NEUTRO: Tono = "gray";
const OK: Tono = "success";
const WARN: Tono = "warning";
const CRITICAL: Tono = "error";
const IDLE: Tono = "blue";

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
    <Badge
      color={tono}
      prefixIcon={<span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      className="shrink-0"
    >
      {label}
    </Badge>
  );
}

/** Familia de color de cada tipo de página (la identifica, no indica estado). */
const TONO_TIPO_PAGINA_BADGE: Record<TipoPagina, Tono> = {
  registro: "blue",
  ventas: "orange",
  "lead-magnet": "cyan",
  portfolio: "violet",
  institucional: "sky",
  otro: NEUTRO,
};

/** Badge de categoría: identifica qué ES la página, no su estado. */
export function TipoPaginaBadge({ tipo }: { tipo: TipoPagina }) {
  return (
    <Badge
      color={TONO_TIPO_PAGINA_BADGE[tipo]}
      className="shrink-0 rounded-md px-1.5 text-[0.625rem] font-semibold tracking-wide uppercase"
    >
      {LABEL_TIPO_PAGINA_CORTO[tipo]}
    </Badge>
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
    return <span className="text-xs text-text-tertiary">—</span>;
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

const TONO_PRIORIDAD: Record<PrioridadLanding, Tono> = {
  alta: WARN,
  media: NEUTRO,
  baja: NEUTRO,
};

export function Prioridad({ prioridad }: { prioridad: PrioridadLanding }) {
  return (
    <Badge
      color={TONO_PRIORIDAD[prioridad]}
      className={cn(
        "rounded-md px-1.5 text-[0.6875rem] font-semibold tracking-wide uppercase",
        prioridad === "baja" && "opacity-70",
      )}
    >
      {LABEL_PRIORIDAD[prioridad]}
    </Badge>
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
  if (!fecha) return <span className="text-xs text-text-tertiary">—</span>;

  const objetivo = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(objetivo.getTime()))
    return <span className="text-xs text-text-tertiary">—</span>;

  // Lo cerrado no corre contra el reloj: se muestra la fecha, sin urgencia.
  if (cerrado) {
    return (
      <Badge color={NEUTRO} className="font-semibold tabular-nums">
        {fecha}
      </Badge>
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
    <Badge color={vencido ? CRITICAL : urgente ? WARN : NEUTRO} className="font-semibold tabular-nums">
      {texto}
    </Badge>
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
  return <PageHeaderBase title={titulo} description={descripcion} actions={accion} />;
}

/** Título de sección dentro de una página, con su ícono. */
export function SeccionTitulo({
  icono: Icono,
  children,
  accion,
}: {
  icono: IconoComponent;
  children: React.ReactNode;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-title-50">
        <Icono className="size-4 text-text-tertiary" />
        {children}
      </h2>
      {accion}
    </div>
  );
}
