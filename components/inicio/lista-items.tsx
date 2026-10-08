import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/tailgrids/core/badge";
import type { ItemInicio } from "@/lib/inicio";

interface ListaItemsProps {
  items: ItemInicio[];
  vacio: string;
}

/** Filas clickeables: título, contexto y una etiqueta con el tono de urgencia. */
export function ListaItems({ items, vacio }: ListaItemsProps) {
  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState variant="inline">{vacio}</EmptyState>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-card-border">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="flex items-center justify-between gap-4 px-6 py-3 outline-none transition-colors hover:bg-background-gray-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-text-primary">
                {item.titulo}
              </span>
              <span className="block truncate text-xs text-text-tertiary">{item.detalle}</span>
            </span>
            <Badge color={item.tono} className="shrink-0 tabular-nums">
              {item.etiqueta}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
