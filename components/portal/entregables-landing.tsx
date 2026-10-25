import { Folder1 } from "@tailgrids/icons";
import { PildoraEnlace, SeccionPortal } from "@/components/portal/portal-ui";
import { RECURSOS, VERSIONES_PDF, type Entregables } from "@/lib/portal/entrega";
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
    <details open className="group overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-neutral-800 px-5 py-3.5 text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
        {titulo}
        <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs text-white">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <div className="p-3 sm:p-4">{children}</div>
    </details>
  );
}

/**
 * Un casillero de la tarjeta: con link se abre en otra pestaña; sin link se
 * ve apagado, para que el cliente sepa que ese archivo todavía no está.
 */
function Casillero({ url, className, children }: { url?: string; className: string; children: React.ReactNode }) {
  if (!url) {
    return (
      <span aria-disabled="true" title="Todavía no está disponible" className={cn(className, "cursor-not-allowed bg-white/3 text-white/40")}>
        {children}
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(className, "bg-black/40 text-white transition-colors hover:bg-primary-500/20 focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:outline-none")}
    >
      {children}
    </a>
  );
}

/**
 * Una landing en el portal: su botón para verla, las versiones en PDF por
 * dispositivo y los recursos descargables. Las dos tarjetas están siempre;
 * lo que todavía no se cargó aparece apagado.
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
  const recursos = [
    ...RECURSOS.map((r) => ({ etiqueta: r.etiqueta, url: entregables[r.clave] })),
    ...(entregables.extras ?? []),
  ];

  return (
    <SeccionPortal titulo={nombre} accion={url ? <PildoraEnlace href={url}>Ver página</PildoraEnlace> : undefined}>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Versiones de la página en PDF">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {VERSIONES_PDF.map((v) => (
              <Casillero key={v.clave} url={entregables[v.clave]} className="flex flex-col items-center gap-2.5 rounded-xl px-2 py-5">
                <Dispositivo clave={v.clave} />
                <span className="text-xs font-medium">{v.etiqueta}</span>
              </Casillero>
            ))}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Recursos descargables">
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:gap-3">
            {recursos.map((r) => (
              <Casillero
                key={`${r.etiqueta}-${r.url ?? ""}`}
                url={r.url}
                className="flex min-w-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium [&>svg]:size-6 [&>svg]:shrink-0"
              >
                <Folder1 className={r.url ? "text-white" : undefined} />
                <span className="truncate">{r.etiqueta}</span>
              </Casillero>
            ))}
          </div>
        </Tarjeta>
      </div>
    </SeccionPortal>
  );
}
