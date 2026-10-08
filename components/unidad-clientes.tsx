import { UserMultiple1 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { EstadoClienteSelect } from "@/components/estado-cliente-select";
import { Card } from "@/components/tailgrids/core/card";
import type { Cliente } from "@/lib/types";

export function UnidadClientes({ clientes, unidad }: { clientes: Cliente[]; unidad: string }) {
  if (clientes.length === 0) {
    return <EmptyState title="Esta unidad todavía no tiene clientes cargados." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clientes.map((c) => (
        <Card key={c.slug} className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <UserMultiple1 aria-hidden="true" className="size-3.5 shrink-0 text-text-tertiary" />
              <h3 className="truncate text-sm font-semibold text-title-50">{c.nombre}</h3>
            </div>
            <EstadoClienteSelect
              archivo={c.archivo}
              slug={c.slug}
              unidad={unidad}
              estado={c.estado}
            />
          </div>
          {c.contexto && (
            <p className="line-clamp-3 text-xs leading-relaxed text-text-secondary">{c.contexto}</p>
          )}
          {c.canal && <p className="mt-1 text-xs text-text-tertiary">Canal: {c.canal}</p>}
        </Card>
      ))}
    </div>
  );
}
