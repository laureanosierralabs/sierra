import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import {
  LABEL_ESTADO_PEDIDO,
  LABEL_TIPO_PEDIDO,
  type ComentarioPedido,
  type EstadoPedido,
  type Pedido,
  type TipoPedido,
} from "@/lib/pedidos/tipos";
import { cn } from "@/utils/cn";

type Tono = NonNullable<React.ComponentProps<typeof Badge>["color"]>;

const TONO_ESTADO: Record<EstadoPedido, Tono> = {
  abierta: "warning",
  en_curso: "blue",
  resuelta: "success",
  descartada: "gray",
  aprobada: "success",
  rechazada: "error",
};

const TONO_TIPO: Record<TipoPedido, Tono> = {
  incidencia: "error",
  cambio: "violet",
  aprobacion: "cyan",
};

/* Fecha y hora en Buenos Aires: fija, para que servidor y navegador coincidan. */
const FECHA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
export const fechaPedido = (iso: string) => FECHA.format(new Date(iso));

export function EstadoPedidoPill({ estado }: { estado: EstadoPedido }) {
  return (
    <Badge
      color={TONO_ESTADO[estado]}
      prefixIcon={<span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      className="shrink-0"
    >
      {LABEL_ESTADO_PEDIDO[estado]}
    </Badge>
  );
}

export function TipoPedidoBadge({ tipo }: { tipo: TipoPedido }) {
  return (
    <Badge color={TONO_TIPO[tipo]} size="sm" className="shrink-0 rounded-md px-1.5">
      {LABEL_TIPO_PEDIDO[tipo]}
    </Badge>
  );
}

export function UrgenteBadge() {
  return (
    <Badge color="error" size="sm" className="shrink-0 rounded-md px-1.5">
      Urgente
    </Badge>
  );
}

/**
 * Lista de pedidos, igual en el panel y en el portal. `href` arma el link al
 * detalle; `cliente` muestra de quién es (solo en la bandeja del panel).
 */
export function ListaPedidos({
  pedidos,
  href,
  vacio,
  cliente,
}: {
  pedidos: (Pedido & { cliente?: string })[];
  href: (id: string) => string;
  vacio: string;
  cliente?: boolean;
}) {
  if (pedidos.length === 0) return <EmptyState variant="inline" className="px-4 py-6" title={vacio} />;
  return (
    <ul className="divide-y divide-card-border">
      {pedidos.map((p) => (
        <li key={p.id}>
          <Link
            href={href(p.id)}
            className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-background-gray-secondary"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <TipoPedidoBadge tipo={p.kind} />
                {p.priority === "urgente" && <UrgenteBadge />}
                <span className="truncate text-sm font-medium text-text-primary">{p.title}</span>
              </span>
              <span className="mt-0.5 block truncate text-xs text-text-tertiary">
                {cliente && p.cliente ? `${p.cliente} · ` : ""}
                {p.from_client ? "Pedido por el cliente" : "Pedido por el equipo"}
                {p.created_by_name ? ` (${p.created_by_name})` : ""} · {fechaPedido(p.created_at)}
              </span>
            </span>
            <EstadoPedidoPill estado={p.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Encabezado del detalle: tipo, prioridad, estado, descripción y link. */
export function CabeceraPedido({ pedido }: { pedido: Pedido }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TipoPedidoBadge tipo={pedido.kind} />
        {pedido.priority === "urgente" && <UrgenteBadge />}
        <EstadoPedidoPill estado={pedido.status} />
        <span className="text-xs text-text-tertiary">
          {pedido.from_client ? "Pedido por el cliente" : "Pedido por el equipo"}
          {pedido.created_by_name ? ` · ${pedido.created_by_name}` : ""} · {fechaPedido(pedido.created_at)}
        </span>
      </div>
      {pedido.description && (
        <p className="text-sm whitespace-pre-wrap text-text-secondary">{pedido.description}</p>
      )}
      {pedido.link && (
        <a
          href={pedido.link}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start truncate text-sm font-medium text-primary-500 hover:underline"
        >
          {pedido.link.replace(/^https?:\/\//, "")}
        </a>
      )}
    </Card>
  );
}

/**
 * Conversación de un pedido. Del lado de quien mira van a la derecha: en el
 * portal, los del cliente; en el panel, los del equipo.
 */
export function HiloPedido({
  comentarios,
  vistaDelCliente,
}: {
  comentarios: ComentarioPedido[];
  vistaDelCliente: boolean;
}) {
  if (comentarios.length === 0) {
    return <p className="text-sm text-text-tertiary">Todavía no hay comentarios.</p>;
  }
  return (
    <ol className="flex flex-col gap-3">
      {comentarios.map((c) => {
        const propio = c.from_client === vistaDelCliente;
        return (
          <li key={c.id} className={cn("flex", propio ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-4 py-2.5",
                propio ? "bg-primary-500/10" : "border border-card-border bg-card-background",
              )}
            >
              <p className="mb-1 text-xs text-text-tertiary">
                <span className="font-medium text-text-secondary">
                  {c.author_name ?? (c.from_client ? "Cliente" : "Equipo")}
                </span>
                {c.from_client ? "" : " · equipo"} · {fechaPedido(c.created_at)}
              </p>
              <p className="text-sm whitespace-pre-wrap text-text-primary">{c.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
