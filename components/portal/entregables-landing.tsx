import { Folder1 } from "@tailgrids/icons";
import { PildoraEnlace, SeccionPortal } from "@/components/portal/portal-ui";
import { RECURSOS, VERSIONES_PDF, tieneEntregables, type Entregables } from "@/lib/portal/entrega";
import { cn } from "@/utils/cn";

/* Íconos de dispositivo dibujados: el set de íconos no trae computadora ni tablet. */
function Dispositivo({ clave }: { clave: string }) {
  if (clave === "pdf_mobile") {
    return (
      <span aria-hidden="true" className="flex h-9 w-5 items-end justify-center rounded-md border-2 border-current pb-0.5">
        <span className="size-1 rounded-full bg-current" />
      </span>
    );
  }
  if (clave === "pdf_tablet") {
    return (
      <span aria-hidden="true" className="flex h-9 w-7 items-end justify-center rounded-md border-2 border-current pb-0.5">
        <span className="size-1 rounded-full bg-current" />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="flex flex-col items-center">
      <span className="h-6 w-9 rounded-sm border-2 border-current" />
      <span className="h-1.5 w-1 bg-current" />
      <span className="h-0.5 w-4 rounded bg-current" />
    </span>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details open className="group overflow-hidden rounded-2xl bg-neutral-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-neutral-800 px-5 py-3.5 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
        {titulo}
        <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full bg-primary-500 text-xs text-white">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <div className="p-4">{children}</div>
    </details>
  );
}

/**
 * Una landing en el portal: su botón para verla, las versiones en PDF por
 * dispositivo y los recursos descargables. Lo que no se cargó no aparece.
 */
export function EntregablesLanding({
  nombre,
  url,
  entregables,
}: {
  nombre: string;
  url: string | null;
  entregables: Entregables;
}) {
  const pdfs = VERSIONES_PDF.filter((v) => entregables[v.clave]);
  const recursos = [
    ...RECURSOS.filter((r) => entregables[r.clave]).map((r) => ({ etiqueta: r.etiqueta, url: entregables[r.clave] as string })),
    ...(entregables.extras ?? []),
  ];
  const conEntregables = tieneEntregables(entregables);

  return (
    <SeccionPortal titulo={nombre} accion={url ? <PildoraEnlace href={url}>Ver página</PildoraEnlace> : undefined}>
      {conEntregables ? (
        <div className={cn("grid grid-cols-1 gap-4", pdfs.length > 0 && recursos.length > 0 && "lg:grid-cols-2")}>
          {pdfs.length > 0 && (
            <Tarjeta titulo="Versiones de la página en PDF">
              <div className="grid grid-cols-3 gap-3">
                {pdfs.map((v) => (
                  <a
                    key={v.clave}
                    href={entregables[v.clave]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2.5 rounded-xl bg-black/40 px-2 py-5 text-white transition-colors hover:bg-primary-500/25"
                  >
                    <Dispositivo clave={v.clave} />
                    <span className="text-xs text-white/80">{v.etiqueta}</span>
                  </a>
                ))}
              </div>
            </Tarjeta>
          )}
          {recursos.length > 0 && (
            <Tarjeta titulo="Recursos descargables">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {recursos.map((r) => (
                  <a
                    key={`${r.etiqueta}-${r.url}`}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-black/40 px-4 py-3 text-sm text-white transition-colors hover:bg-primary-500/25 [&>svg]:size-7 [&>svg]:shrink-0 [&>svg]:text-primary-400"
                  >
                    <Folder1 />
                    {r.etiqueta}
                  </a>
                ))}
              </div>
            </Tarjeta>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary">Los archivos de esta página van a aparecer acá.</p>
      )}
    </SeccionPortal>
  );
}
