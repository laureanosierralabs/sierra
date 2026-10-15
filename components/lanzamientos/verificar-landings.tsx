"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle1,
  ExpandArrowTopRightSquare1,
  InfoOctagon,
  InfoTriangle,
  RefreshCircle1Clockwise,
  Shield1Check,
} from "@tailgrids/icons";
import { toast } from "sonner";
import { verificarLandings } from "@/app/landing-pages/salud-acciones";
import { Button } from "@/components/tailgrids/core/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailgrids/core/dialog";
import { Backdrop, OverlayWrapper } from "@/components/tailgrids/core/overlay";
import { estadoGeneral, type EstadoChequeo, type SaludLanding } from "@/lib/lanzamientos/salud";
import { cn } from "@/utils/cn";

const ESTILO: Record<EstadoChequeo, { icono: React.ReactNode; color: string; resumen: string }> = {
  ok: { icono: <CheckCircle1 />, color: "text-badge-success-text", resumen: "Todo bien" },
  aviso: { icono: <InfoTriangle />, color: "text-badge-warning-text", resumen: "Revisar" },
  error: { icono: <InfoOctagon />, color: "text-badge-error-text", resumen: "Con problemas" },
};

const HORA = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Revisa todas las landings del lanzamiento y muestra un semáforo por cada
 * una: lo que conviene mirar antes de prender los anuncios.
 */
export function VerificarLandings({ launchId }: { launchId: string }) {
  const [pendiente, iniciar] = useTransition();
  const [resultado, setResultado] = useState<{ landings: SaludLanding[]; revisado: string } | null>(null);
  const [abierto, setAbierto] = useState(false);

  function verificar() {
    setAbierto(true);
    iniciar(async () => {
      try {
        const r = await verificarLandings(launchId);
        if ("error" in r) {
          toast.error(r.error);
          setAbierto(false);
          return;
        }
        setResultado(r);
      } catch {
        toast.error("No se pudieron verificar las landings");
        setAbierto(false);
      }
    });
  }

  const conProblemas = resultado?.landings.filter((l) => estadoGeneral(l.chequeos) !== "ok").length ?? 0;

  return (
    <>
      <Button appearance="outline" onPress={verificar} isDisabled={pendiente}>
        <Shield1Check />
        Verificar landings
      </Button>

      <OverlayWrapper isOpen={abierto} onOpenChange={(v) => !pendiente && setAbierto(v)}>
        <Backdrop className="z-10000" isDismissable={!pendiente}>
          <Dialog className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto p-0">
            <DialogHeader className="border-b border-card-border py-4 pr-14 pl-5">
              <DialogTitle>Salud de las landings</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 p-5">
              {pendiente || !resultado ? (
                <p className="text-sm text-text-secondary">
                  Revisando cada landing, sus links y lo que midió el panel. Puede tardar unos segundos…
                </p>
              ) : (
                <>
                  <p className="text-sm text-text-secondary">
                    {conProblemas === 0
                      ? "Todas las landings están bien."
                      : `${conProblemas} de ${resultado.landings.length} landings necesitan atención.`}{" "}
                    <span className="text-text-tertiary">Revisado a las {HORA.format(new Date(resultado.revisado))}.</span>
                  </p>
                  {resultado.landings.map((l) => {
                    const general = estadoGeneral(l.chequeos);
                    return (
                      <section key={l.id} className="rounded-lg border border-card-border">
                        <header className="flex items-center justify-between gap-3 border-b border-card-border px-4 py-2.5">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className={cn("shrink-0 [&>svg]:size-4", ESTILO[general].color)}>
                              {ESTILO[general].icono}
                            </span>
                            <span className="truncate text-sm font-semibold text-text-primary">{l.name}</span>
                            {l.url && (
                              <a
                                href={l.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Abrir ${l.name}`}
                                className="shrink-0 text-text-tertiary hover:text-text-primary [&>svg]:size-3.5"
                              >
                                <ExpandArrowTopRightSquare1 />
                              </a>
                            )}
                          </span>
                          <span className={cn("shrink-0 text-xs font-medium", ESTILO[general].color)}>
                            {ESTILO[general].resumen}
                          </span>
                        </header>
                        <ul className="divide-y divide-card-border">
                          {l.chequeos.map((c) => (
                            <li key={c.id} className="flex items-start gap-2.5 px-4 py-2">
                              <span className={cn("mt-0.5 shrink-0 [&>svg]:size-4", ESTILO[c.estado].color)}>
                                {ESTILO[c.estado].icono}
                              </span>
                              <span className="min-w-0 text-sm">
                                <span className="font-medium text-text-primary">{c.etiqueta}</span>
                                <span className="block text-text-tertiary">{c.detalle}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </>
              )}
            </div>

            <DialogFooter className="border-t border-card-border px-5 py-3">
              <DialogClose appearance="outline" isDisabled={pendiente}>
                Cerrar
              </DialogClose>
              <Button onPress={verificar} isDisabled={pendiente}>
                <RefreshCircle1Clockwise />
                {pendiente ? "Verificando…" : "Verificar de nuevo"}
              </Button>
            </DialogFooter>
          </Dialog>
        </Backdrop>
      </OverlayWrapper>
    </>
  );
}
