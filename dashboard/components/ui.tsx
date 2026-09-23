import { cn } from "@/lib/utils";
import type { Estado, Prioridad } from "@/lib/types";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

const ESTADO_STYLE: Record<Estado, { label: string; dot: string; text: string }> = {
  activo: { label: "Activo", dot: "bg-ok", text: "text-ok" },
  "por-empezar": { label: "Por empezar", dot: "bg-warn", text: "text-warn" },
  bloqueado: { label: "Bloqueado", dot: "bg-critical", text: "text-critical" },
  pausado: { label: "Pausado", dot: "bg-idle", text: "text-idle" },
  terminado: { label: "Terminado", dot: "bg-text-3", text: "text-text-3" },
};

export function EstadoPill({ estado }: { estado: Estado }) {
  const s = ESTADO_STYLE[estado] ?? ESTADO_STYLE.activo;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line",
        "bg-surface-2 px-2.5 py-1 text-xs font-medium",
        s.text,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function PrioridadTag({ prioridad }: { prioridad: Prioridad }) {
  if (prioridad !== "alta") return null;
  return (
    <span className="rounded border border-warn/30 bg-warn-dim px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-warn">
      Alta
    </span>
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
    <span
      className={cn(
        "tnum inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
        vencido && "bg-critical-dim text-critical",
        urgente && "bg-warn-dim text-warn",
        !vencido && !urgente && "bg-surface-2 text-text-2",
      )}
    >
      {texto}
    </span>
  );
}

const CLIENTE_ESTADO: Record<string, { label: string; dot: string; text: string }> = {
  activo: { label: "Activo", dot: "bg-ok", text: "text-ok" },
  "stand-by": { label: "Stand by", dot: "bg-warn", text: "text-warn" },
  inactivo: { label: "Inactivo", dot: "bg-text-3", text: "text-text-3" },
  prospecto: { label: "Prospecto", dot: "bg-idle", text: "text-idle" },
};

export function ClienteEstado({ estado }: { estado: string }) {
  const s = CLIENTE_ESTADO[estado] ?? CLIENTE_ESTADO.activo;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line",
        "bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-medium",
        s.text,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-3">{children}</p>;
}
