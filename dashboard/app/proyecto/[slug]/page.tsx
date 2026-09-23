import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  GitBranch,
  History,
  Scale,
} from "lucide-react";
import { getProyecto, getProyectos } from "@/lib/contexto";
import { diasHasta } from "@/lib/types";
import { Card, Deadline, Empty, EstadoPill, PrioridadTag } from "@/components/ui";
import { EditarProyecto } from "@/components/editar-proyecto";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return getProyectos().map((p) => ({ slug: p.slug }));
}

function esUrl(v: string) {
  return /^https?:\/\//.test(v);
}

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16: params es una Promise.
  const { slug } = await params;
  const p = getProyecto(slug);
  if (!p) notFound();

  const dias = diasHasta(p.entrega);

  return (
    <div className="w-full px-6 py-10 md:px-10">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Inicio
      </Link>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{p.cliente}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {p.nombre}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <EstadoPill estado={p.estado} />
            <PrioridadTag prioridad={p.prioridad} />
            {dias !== null && <Deadline dias={dias} />}
            {p.actualizado && (
              <span className="tnum text-xs text-text-3">
                Actualizado {p.actualizado}
              </span>
            )}
          </div>
        </div>
        <EditarProyecto p={p} />
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <p className="eyebrow mb-2">Próximo paso</p>
            {p.proximoPaso ? (
              <p className="text-lg leading-snug">{p.proximoPaso}</p>
            ) : (
              <Empty>Sin definir. Contámelo por la terminal.</Empty>
            )}
          </Card>

          {p.bloqueos.length > 0 && (
            <Card className="border-critical/30 bg-critical-dim/40 p-6">
              <p className="eyebrow mb-3 text-critical">Bloqueos</p>
              <ul className="flex flex-col gap-2">
                {p.bloqueos.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-critical" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {p.estadoActual && (
            <Card className="p-6">
              <p className="eyebrow mb-2">Estado actual</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-2">
                {p.estadoActual}
              </p>
            </Card>
          )}

          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Scale className="size-3.5 text-text-3" />
              <p className="eyebrow">Decisiones</p>
            </div>
            {p.decisiones.length === 0 ? (
              <Empty>Todavía no hay decisiones registradas.</Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {p.decisiones.map((d, i) => (
                  <li key={i} className="border-l-2 border-line pl-3 text-sm text-text-2">
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <History className="size-3.5 text-text-3" />
              <p className="eyebrow">Bitácora</p>
            </div>
            {p.bitacora.length === 0 ? (
              <Empty>Sin movimientos registrados.</Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {p.bitacora.map((b, i) => (
                  <li key={i} className="border-l-2 border-line pl-3 text-sm text-text-2">
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <GitBranch className="size-3.5 text-text-3" />
              <p className="eyebrow">Recursos</p>
            </div>
            {p.recursos.length === 0 ? (
              <Empty>Sin recursos cargados.</Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {p.recursos.map((r, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <span className="text-xs text-text-3">{r.que}</span>
                    {esUrl(r.donde) ? (
                      <a
                        href={r.donde}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 break-all text-sm text-text transition-colors hover:underline"
                      >
                        {r.donde.replace(/^https?:\/\//, "")}
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    ) : (
                      <code className="break-all rounded bg-surface-2 px-2 py-1 text-xs text-text-2">
                        {r.donde.replace(/`/g, "")}
                      </code>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {p.responsables.length > 0 && (
            <Card className="p-6">
              <p className="eyebrow mb-3">Responsables</p>
              <div className="flex flex-wrap gap-2">
                {p.responsables.map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-text-2"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {p.notas && (
            <Card className="p-6">
              <p className="eyebrow mb-2">Notas</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-2">
                {p.notas}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
