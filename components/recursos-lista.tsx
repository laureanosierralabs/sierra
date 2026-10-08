import { ArrowAngularTopRight } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import type { Recurso } from "@/lib/types";

function esUrl(v: string) {
  return /^https?:\/\//.test(v);
}

/** Lista de recursos: enlaces externos o rutas locales en `code`. */
export function RecursosLista({
  recursos,
  vacio,
}: {
  recursos: Recurso[];
  vacio?: string;
}) {
  if (recursos.length === 0) {
    return vacio ? <EmptyState variant="inline">{vacio}</EmptyState> : null;
  }

  return (
    <ul className="flex flex-col gap-3">
      {recursos.map((r, i) => (
        <li key={i} className="flex flex-col gap-1">
          <span className="text-xs text-text-tertiary">{r.que}</span>
          {esUrl(r.donde) ? (
            <a
              href={r.donde}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm break-all text-text-primary hover:underline"
            >
              {r.donde.replace(/^https?:\/\//, "")}
              <ArrowAngularTopRight aria-hidden="true" className="size-3 shrink-0" />
            </a>
          ) : (
            <code className="rounded bg-background-gray-secondary px-2 py-1 text-xs break-all text-text-secondary">
              {r.donde.replace(/`/g, "")}
            </code>
          )}
        </li>
      ))}
    </ul>
  );
}
