"use client";

import { useRef, useState, useTransition } from "react";
import { Copy1, Play } from "@tailgrids/icons";
import { toast } from "sonner";
import { revelarAccesoPortal } from "@/app/portal/entrega-acciones";
import { DISPLAY, ENLACE } from "@/components/portal/portal-ui";
import { miniaturaVideo, type VideoSoporte } from "@/lib/portal/entrega";
import type { AccesoPortal } from "@/lib/portal/datos";
import { cn } from "@/utils/cn";

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success("Copiado");
  } catch {
    toast.error("No se pudo copiar");
  }
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-white/50">{etiqueta}</span>
      <span className="flex min-w-0 items-center gap-2 text-sm text-white">{children}</span>
    </div>
  );
}

/** Un acceso: link, usuario y la contraseña, que se revela con un click. */
function TarjetaAcceso({ slug, acceso, abierto }: { slug: string; acceso: AccesoPortal; abierto: boolean }) {
  const [secreto, setSecreto] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  return (
    <details open={abierto} className="group overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-neutral-800 px-5 py-3.5 text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 truncate">{acceso.name}</span>
        <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs text-white">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <div className="flex flex-col gap-3 p-5">
        {acceso.url && (
          <Dato etiqueta="Link de acceso">
            <a href={acceso.url} target="_blank" rel="noopener noreferrer" className={cn(ENLACE, "truncate")}>
              {acceso.url.replace(/^https?:\/\//, "")}
            </a>
          </Dato>
        )}
        {acceso.username && (
          <Dato etiqueta="Usuario">
            <span className="truncate font-mono">{acceso.username}</span>
            <button type="button" onClick={() => copiar(acceso.username as string)} aria-label="Copiar usuario" className="text-white/50 hover:text-white [&>svg]:size-3.5">
              <Copy1 />
            </button>
          </Dato>
        )}
        {acceso.tieneSecreto && (
          <Dato etiqueta="Contraseña">
            {secreto ? (
              <>
                <span className="truncate font-mono">{secreto}</span>
                <button type="button" onClick={() => copiar(secreto)} aria-label="Copiar contraseña" className="text-white/50 hover:text-white [&>svg]:size-3.5">
                  <Copy1 />
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  iniciar(async () => {
                    const r = await revelarAccesoPortal(slug, acceso.id).catch(() => ({ error: "No se pudo mostrar" }));
                    if ("error" in r) toast.error(r.error);
                    else setSecreto(r.secreto);
                  })
                }
                className={cn(ENLACE, "text-sm")}
              >
                {pendiente ? "Mostrando…" : "Mostrar contraseña"}
              </button>
            )}
          </Dato>
        )}
      </div>
    </details>
  );
}

export function AccesosPortal({ slug, accesos }: { slug: string; accesos: AccesoPortal[] }) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      {accesos.map((a, i) => (
        <TarjetaAcceso key={a.id} slug={slug} acceso={a} abierto={i === 0} />
      ))}
    </div>
  );
}

/** Carrusel de videos de soporte, con flechas para recorrerlo. */
export function VideosSoporte({ videos }: { videos: VideoSoporte[] }) {
  const pista = useRef<HTMLUListElement>(null);
  const mover = (sentido: 1 | -1) => pista.current?.scrollBy({ left: sentido * 320, behavior: "smooth" });

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button type="button" onClick={() => mover(-1)} aria-label="Videos anteriores" className="rounded-full px-2 text-2xl text-white/70 hover:text-white">
          ←
        </button>
        <button type="button" onClick={() => mover(1)} aria-label="Más videos" className="rounded-full px-2 text-2xl text-white/70 hover:text-white">
          →
        </button>
      </div>
      <ul ref={pista} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
        {videos.map((v) => {
          const miniatura = miniaturaVideo(v.url);
          return (
            <li key={v.id} className="w-52 shrink-0 snap-start sm:w-60">
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex aspect-4/5 flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-b from-neutral-800 to-neutral-950 p-5"
              >
                {miniatura && (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura pública de YouTube
                  <img src={miniatura} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity group-hover:opacity-45" />
                )}
                <span className="relative text-white [&>svg]:size-10">
                  <Play />
                </span>
                <span className={cn(DISPLAY, "relative text-2xl leading-[0.95] break-words text-white sm:text-[1.7rem]")}>{v.title}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
