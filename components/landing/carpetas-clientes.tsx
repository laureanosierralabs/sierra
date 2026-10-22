"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, Folder1 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { ListaProyectos, type DatosLista } from "@/components/landing/lista-proyectos";
import type { VistaProyectos } from "@/components/landing/vista-guardada";
import { Card } from "@/components/tailgrids/core/card";
import { GRUPOS_PROYECTO, grupoDe, type Proyecto } from "@/lib/landing/tipos";

export interface Carpeta {
  /** Id del cliente (la marca); "" = proyectos sin cliente. */
  id: string;
  nombre: string;
  operador: string | null;
  /** Operadores cuyos proyectos se juntan acá (operan solo esta marca). */
  incluye: string[];
  portada: string | null;
  items: Proyecto[];
}

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

function TarjetaCarpeta({ carpeta, href }: { carpeta: Carpeta; href: string }) {
  const porGrupo = GRUPOS_PROYECTO.map((g) => ({
    ...g,
    cantidad: carpeta.items.filter((p) => grupoDe(p.status) === g.id).length,
  })).filter((g) => g.cantidad > 0);

  return (
    <Card className="group flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-md">
      <Link href={href} scroll={false} className="relative block aspect-8/3 overflow-hidden bg-primary-500/10 outline-none">
        {carpeta.portada ? (
          // eslint-disable-next-line @next/next/no-img-element -- portada del bucket público
          <img src={carpeta.portada} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span aria-hidden="true" className="flex h-full items-center justify-center text-3xl font-bold text-primary-500/60">
            {carpeta.id ? iniciales(carpeta.nombre) : <Folder1 className="size-8" />}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <Link href={href} scroll={false} className="block truncate text-base font-semibold text-title-50 hover:underline">
            {carpeta.nombre}
          </Link>
          {(carpeta.operador || carpeta.incluye.length > 0) && (
            <p className="truncate text-xs text-text-tertiary">
              {carpeta.operador
                ? `Operado por ${carpeta.operador}`
                : `Con ${carpeta.incluye.join(", ")}`}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-background-gray-secondary px-2 py-0.5 text-xs font-medium text-text-primary tabular-nums">
            {carpeta.items.length === 1 ? "1 proyecto" : `${carpeta.items.length} proyectos`}
          </span>
          {porGrupo.map((g) => (
            <span key={g.id} className="rounded-md px-2 py-0.5 text-xs text-text-tertiary tabular-nums ring-1 ring-card-border">
              {g.cantidad} {g.label.toLowerCase()}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Link
            href={href}
            scroll={false}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            Ver proyectos
          </Link>
          {carpeta.id && (
            <Link
              href={`/landing-pages/clients/${carpeta.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-text-primary ring-1 ring-card-border transition-colors hover:bg-background-gray-secondary"
            >
              Ver ficha
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Proyectos agrupados por marca como carpetas: primero una tarjeta por marca
 * y, al entrar (`?marca=<id>`), sus proyectos. La carpeta abierta vive en la
 * URL: el botón "atrás" del navegador vuelve a todas.
 */
export function CarpetasClientes({
  carpetas,
  vista,
  datos,
}: {
  carpetas: Carpeta[];
  vista: VistaProyectos;
  datos: DatosLista;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const abierta = params.get("marca");
  const hrefDe = (id: string) => `${pathname}?marca=${id || "sin-cliente"}`;

  const carpeta = abierta ? carpetas.find((c) => (c.id || "sin-cliente") === abierta) : null;

  if (abierta) {
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            href={pathname}
            scroll={false}
            className="inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="size-4" />
            Todas las marcas
          </Link>
          {carpeta && (
            <>
              <span className="text-text-tertiary">/</span>
              <h2 className="text-base font-semibold text-title-50">{carpeta.nombre}</h2>
              <span className="text-xs text-text-tertiary tabular-nums">{carpeta.items.length}</span>
              {carpeta.id && (
                <Link
                  href={`/landing-pages/clients/${carpeta.id}`}
                  className="ml-auto text-sm font-medium text-primary-500 hover:underline"
                >
                  Ver ficha →
                </Link>
              )}
            </>
          )}
        </div>
        {carpeta ? (
          <ListaProyectos vista={vista} proyectos={carpeta.items} datos={datos} />
        ) : (
          <EmptyState title="Esta marca no tiene proyectos con estos filtros" />
        )}
      </div>
    );
  }

  if (carpetas.length === 0) return <EmptyState title="No hay proyectos con estos filtros" />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {carpetas.map((c) => (
        <TarjetaCarpeta key={c.id || "sin-cliente"} carpeta={c} href={hrefDe(c.id)} />
      ))}
    </div>
  );
}
