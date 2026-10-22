import Link from "next/link";
import { Card } from "@/components/tailgrids/core/card";
import { resumenPuesta, type Chequeo, type GrupoChequeo } from "@/lib/lanzamientos/puesta";
import { cn } from "@/utils/cn";

const GRUPOS: GrupoChequeo[] = ["Lanzamiento", "Landings", "Datos", "Portal"];

const MARCA: Record<Chequeo["estado"], { simbolo: string; clase: string; lectura: string }> = {
  ok: { simbolo: "✓", clase: "bg-badge-success-background text-badge-success-text", lectura: "Listo" },
  falta: { simbolo: "✕", clase: "bg-badge-error-background text-badge-error-text", lectura: "Falta" },
  sugerido: { simbolo: "!", clase: "bg-badge-warning-background text-badge-warning-text", lectura: "Sugerido" },
};

function enlaceDe(c: Chequeo, launchId: string, clientId: string): { href: string; texto: string } | null {
  switch (c.donde) {
    case "configuracion":
      return { href: `/landing-pages/launches/${launchId}?vista=configuracion`, texto: "Configuración" };
    case "ficha-portal":
      return { href: `/landing-pages/clients/${clientId}?vista=portal`, texto: "Portal del cliente" };
    case "ficha-accesos":
      return { href: `/landing-pages/clients/${clientId}?vista=accesos`, texto: "Accesos del cliente" };
    default:
      return null; // "editar": el lápiz de arriba.
  }
}

/**
 * "Listo para compartir": lo que le falta al lanzamiento para mostrárselo al
 * cliente con datos reales. Se abre sola si falta algo obligatorio.
 */
export function ListoParaCompartir({
  chequeos,
  launchId,
  clientId,
}: {
  chequeos: Chequeo[];
  launchId: string;
  clientId: string;
}) {
  const { listo, faltan, ok, total } = resumenPuesta(chequeos);
  const sugeridos = chequeos.filter((c) => c.estado === "sugerido").length;

  return (
    <Card className="mb-6 overflow-hidden p-0">
      <details open={!listo} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              listo ? MARCA.ok.clase : MARCA.falta.clase,
            )}
          >
            {listo ? "✓" : faltan}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-title-50">
              {listo ? "Listo para compartir con el cliente" : `Faltan ${faltan} ${faltan === 1 ? "cosa" : "cosas"} para compartirlo`}
            </span>
            <span className="block text-xs text-text-tertiary">
              {ok} de {total} completos
              {sugeridos > 0 ? ` · ${sugeridos} ${sugeridos === 1 ? "sugerencia" : "sugerencias"}` : ""}
            </span>
          </span>
          <span className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-background-gray-secondary sm:block" aria-hidden="true">
            <span
              className={cn("block h-full rounded-full", listo ? "bg-success-500" : "bg-primary-500")}
              style={{ width: `${Math.round((ok / Math.max(total, 1)) * 100)}%` }}
            />
          </span>
          <span aria-hidden="true" className="text-text-tertiary transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 border-t border-card-border px-4 py-4 lg:grid-cols-2">
          {GRUPOS.map((grupo) => {
            const items = chequeos.filter((c) => c.grupo === grupo);
            if (items.length === 0) return null;
            return (
              <section key={grupo} aria-label={grupo}>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-text-tertiary uppercase">{grupo}</h3>
                <ul className="flex flex-col gap-2">
                  {items.map((c) => {
                    const enlace = c.estado === "ok" ? null : enlaceDe(c, launchId, clientId);
                    return (
                      <li key={c.id} className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            MARCA[c.estado].clase,
                          )}
                        >
                          <span aria-hidden="true">{MARCA[c.estado].simbolo}</span>
                          <span className="sr-only">{MARCA[c.estado].lectura}</span>
                        </span>
                        <span className="min-w-0 text-sm">
                          <span className={c.estado === "ok" ? "text-text-secondary" : "font-medium text-text-primary"}>
                            {c.titulo}
                          </span>
                          {c.detalle && <span className="block text-xs text-text-tertiary">{c.detalle}</span>}
                          {enlace && (
                            <Link href={enlace.href} className="text-xs font-medium text-primary-500 hover:underline">
                              Ir a {enlace.texto} →
                            </Link>
                          )}
                          {c.estado !== "ok" && c.donde === "editar" && (
                            <span className="block text-xs text-text-tertiary">Se carga en el lápiz de arriba.</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </details>
    </Card>
  );
}
