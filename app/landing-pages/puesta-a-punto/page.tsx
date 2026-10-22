import Link from "next/link";
import { redirect } from "next/navigation";
import { ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/landing/ui";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import { accesoActual } from "@/lib/landing/auth";
import { resumenPuesta } from "@/lib/lanzamientos/puesta";
import { puestaAPunto, type PuestaCliente } from "@/lib/lanzamientos/puesta-datos";
import { LABEL_ESTADO_LANZAMIENTO } from "@/lib/lanzamientos/tipos";
import { cn } from "@/utils/cn";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function EstadoPortal({ c }: { c: PuestaCliente }) {
  if (c.portal === undefined) return <Badge color="gray" size="sm">Portal: sin datos</Badge>;
  if (c.portal === null) return <Badge color="error" size="sm">Sin portal</Badge>;
  if (c.portal.personas === 0) return <Badge color="warning" size="sm">Portal sin accesos</Badge>;
  return (
    <Badge color="success" size="sm">
      Portal · {c.portal.personas} {c.portal.personas === 1 ? "acceso" : "accesos"}
    </Badge>
  );
}

/**
 * Puesta a punto: todos los clientes con portal o lanzamientos en curso, y
 * qué le falta a cada lanzamiento para compartirlo. Es la lista "Listo para
 * compartir" de cada lanzamiento, junta en una pantalla.
 */
export default async function PuestaAPunto() {
  const { esOwner } = await accesoActual();
  if (!esOwner) redirect("/landing-pages");

  const clientes = await puestaAPunto();
  const lanzamientos = clientes.flatMap((c) => c.lanzamientos);
  const listos = lanzamientos.filter((l) => resumenPuesta(l.chequeos).listo).length;

  return (
    <>
      <PageHeader
        titulo="Puesta a punto"
        descripcion={
          lanzamientos.length === 0
            ? "Sin lanzamientos en curso"
            : `${listos} de ${lanzamientos.length} ${lanzamientos.length === 1 ? "lanzamiento listo" : "lanzamientos listos"} para compartir`
        }
      />

      {clientes.length === 0 ? (
        <EmptyState
          title="Nada para poner a punto"
          description="Acá aparecen los clientes con portal o con lanzamientos en curso."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {clientes.map((c) => {
            const todoListo = c.lanzamientos.length > 0 && c.lanzamientos.every((l) => resumenPuesta(l.chequeos).listo);
            return (
              <Card key={c.id} className="flex flex-col overflow-hidden p-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-card-border px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/landing-pages/clients/${c.id}`} className="block truncate font-semibold text-title-50 hover:underline">
                      {c.nombre}
                    </Link>
                    {c.operador && <p className="truncate text-xs text-text-tertiary">Operado por {c.operador}</p>}
                  </div>
                  <EstadoPortal c={c} />
                  {todoListo && <Badge color="success" size="sm">Listo para compartir</Badge>}
                  {c.portal && (
                    <a
                      href={`/portal/${c.portal.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Ver el portal de ${c.nombre}`}
                      className="text-text-tertiary hover:text-primary-500 [&>svg]:size-4"
                    >
                      <ExpandArrowTopRightSquare1 />
                    </a>
                  )}
                </div>

                {(c.portal === null || !c.portada || c.accesosEnPortal === 0) && (
                  <Link
                    href={`/landing-pages/clients/${c.id}?vista=${c.portal === null || !c.portada ? "portal" : "accesos"}`}
                    className="flex flex-wrap gap-x-3 gap-y-1 border-b border-card-border bg-badge-warning-background/40 px-4 py-2 text-xs text-text-secondary hover:underline"
                  >
                    {c.portal === null && <span>✕ Habilitar el portal</span>}
                    {c.portal !== null && !c.portada && <span>! Falta la portada del portal</span>}
                    {c.accesosEnPortal === 0 && <span>! Ningún acceso visible en el portal</span>}
                  </Link>
                )}

                {c.lanzamientos.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-text-tertiary">Sin lanzamientos en curso.</p>
                ) : (
                  <ul className="divide-y divide-card-border">
                    {c.lanzamientos.map((l) => {
                      const r = resumenPuesta(l.chequeos);
                      const faltantes = l.chequeos.filter((ch) => ch.estado === "falta");
                      return (
                        <li key={l.id}>
                          <Link
                            href={`/landing-pages/launches/${l.id}`}
                            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-background-gray-secondary"
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                r.listo
                                  ? "bg-badge-success-background text-badge-success-text"
                                  : "bg-badge-error-background text-badge-error-text",
                              )}
                            >
                              {r.listo ? "✓" : r.faltan}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-medium text-text-primary">{l.nombre}</span>
                                <span className="text-xs text-text-tertiary">{LABEL_ESTADO_LANZAMIENTO[l.estado]}</span>
                              </span>
                              <span className="block text-xs text-text-tertiary">
                                {r.listo
                                  ? "Listo para compartir"
                                  : `Falta: ${faltantes.map((f) => f.titulo.toLowerCase()).join(" · ")}`}
                              </span>
                            </span>
                            <span className="shrink-0 text-xs text-text-tertiary tabular-nums">
                              {r.ok}/{r.total}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
