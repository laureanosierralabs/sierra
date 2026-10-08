import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card as TgCard } from "@/components/tailgrids/core/card";
import type { Estado, Prioridad } from "@/lib/types";
import { cn } from "@/utils/cn";

type BadgeColor = NonNullable<React.ComponentProps<typeof Badge>["color"]>;

/** Tarjeta sin padding propio (cada llamador arma el suyo), sobre la Card del template. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <TgCard className={cn("p-0", className)}>{children}</TgCard>;
}

/* Mismo mapeo de color que components/landing/ui.tsx: un solo sistema de badges. */
const ESTADO_STYLE: Record<Estado, { label: string; color: BadgeColor }> = {
  activo: { label: "Activo", color: "success" },
  "por-empezar": { label: "Por empezar", color: "warning" },
  bloqueado: { label: "Bloqueado", color: "error" },
  pausado: { label: "Pausado", color: "blue" },
  terminado: { label: "Terminado", color: "gray" },
};

function Dot() {
  return <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />;
}

export function EstadoPill({ estado }: { estado: Estado }) {
  const s = ESTADO_STYLE[estado] ?? ESTADO_STYLE.activo;
  return (
    <Badge color={s.color} prefixIcon={<Dot />}>
      {s.label}
    </Badge>
  );
}

export function PrioridadTag({ prioridad }: { prioridad: Prioridad }) {
  if (prioridad !== "alta") return null;
  return (
    <Badge
      color="warning"
      className="rounded-md px-1.5 text-[0.6875rem] font-semibold tracking-wide uppercase"
    >
      Alta
    </Badge>
  );
}

/** Contador de días. El color codifica urgencia, no decora. */
export function Deadline({ dias }: { dias: number }) {
  const vencido = dias < 0;
  const urgente = dias >= 0 && dias <= 10;

  const texto = vencido
    ? `Vencido hace ${Math.abs(dias)}d`
    : dias === 0
      ? "Vence hoy"
      : `${dias} ${dias === 1 ? "día" : "días"}`;

  return (
    <Badge
      color={vencido ? "error" : urgente ? "warning" : "gray"}
      className="font-semibold tabular-nums"
    >
      {texto}
    </Badge>
  );
}

const CLIENTE_ESTADO: Record<string, { label: string; color: BadgeColor }> = {
  activo: { label: "Activo", color: "success" },
  "stand-by": { label: "Stand by", color: "warning" },
  inactivo: { label: "Inactivo", color: "gray" },
  prospecto: { label: "Prospecto", color: "blue" },
};

export function ClienteEstado({ estado }: { estado: string }) {
  const s = CLIENTE_ESTADO[estado] ?? CLIENTE_ESTADO.activo;
  return (
    <Badge color={s.color} prefixIcon={<Dot />} className="shrink-0">
      {s.label}
    </Badge>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <EmptyState variant="inline">{children}</EmptyState>;
}
