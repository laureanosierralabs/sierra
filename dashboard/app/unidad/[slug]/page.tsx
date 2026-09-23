import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";
import { getUnidad, getUnidades } from "@/lib/contexto";
import { Card, Empty } from "@/components/ui";
import { ProyectoCard } from "@/components/proyecto-card";
import { CrearEntidad } from "@/components/crear-entidad";
import { EstadoClienteSelect } from "@/components/estado-cliente-select";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return getUnidades().map((u) => ({ slug: u.slug }));
}

function esUrl(v: string) {
  return /^https?:\/\//.test(v);
}

export default async function UnidadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16: params es una Promise.
  const { slug } = await params;
  const u = getUnidad(slug);
  if (!u) notFound();

  return (
    <div className="w-full px-6 py-10 md:px-10">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-3 transition-colors hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Inicio
      </Link>

      <header className="mb-10">
        <p className="eyebrow">Unidad de negocio</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{u.nombre}</h1>
        {u.queEs && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-2">
            {u.queEs}
          </p>
        )}
      </header>

      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-2">
            Proyectos
          </h2>
          <CrearEntidad unidad={u.slug} tipo="proyecto" />
        </div>
        {u.proyectos.length === 0 ? (
          <Empty>Esta unidad todavía no tiene proyectos cargados.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {u.proyectos.map((p) => (
              <ProyectoCard key={p.slug} p={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text-2">
            Clientes
          </h2>
          <CrearEntidad unidad={u.slug} tipo="cliente" />
        </div>
        {u.clientes.length === 0 ? (
          <Empty>Esta unidad todavía no tiene clientes cargados.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {u.clientes.map((c) => (
              <Card key={c.slug} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Users className="size-3.5 shrink-0 text-text-3" />
                    <h3 className="truncate font-display text-[0.9375rem] font-bold">
                      {c.nombre}
                    </h3>
                  </div>
                  <EstadoClienteSelect
                    archivo={c.archivo}
                    slug={c.slug}
                    unidad={u.slug}
                    estado={c.estado}
                  />
                </div>
                {c.contexto && (
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-2">
                    {c.contexto}
                  </p>
                )}
                {c.canal && (
                  <p className="mt-3 text-xs text-text-3">Canal: {c.canal}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {(u.comoSeOpera || u.recursos.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {u.comoSeOpera && (
            <Card className="p-6">
              <p className="eyebrow mb-2">Cómo se opera</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-2">
                {u.comoSeOpera}
              </p>
            </Card>
          )}
          {u.recursos.length > 0 && (
            <Card className="p-6">
              <p className="eyebrow mb-4">Recursos</p>
              <ul className="flex flex-col gap-3">
                {u.recursos.map((r, i) => (
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
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
