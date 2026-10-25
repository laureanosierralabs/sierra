"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ExpandArrowTopRightSquare1, Search1 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { CopiarBoton } from "@/components/componentes/copiar-boton";
import { ComponenteForm } from "@/components/componentes/componente-form";
import { VistaPrevia } from "@/components/componentes/vista-previa";
import { FiltroBotones } from "@/components/landing/filtro-botones";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import {
  categoriasEnUso,
  filtrarComponentes,
  LABEL_CATEGORIA,
  type CategoriaComponente,
  type ComponenteUI,
} from "@/lib/componentes/tipos";

type Filtro = CategoriaComponente | "todas";

/** Buscador + chips de categoría + grilla. El filtrado es local: instantáneo. */
export function BibliotecaComponentes({ componentes }: { componentes: ComponenteUI[] }) {
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<Filtro>("todas");
  const textoDiferido = useDeferredValue(texto);

  const categorias = useMemo(() => categoriasEnUso(componentes), [componentes]);
  const visibles = useMemo(
    () => filtrarComponentes(componentes, { texto: textoDiferido, categoria: categoria === "todas" ? null : categoria }),
    [componentes, textoDiferido, categoria],
  );

  if (componentes.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay componentes"
        description="Pegá el primero: código, prompt o comando de instalación. Después lo encontrás en segundos."
        action={<ComponenteForm />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <label className="relative block max-w-md">
          <span className="sr-only">Buscar componentes</span>
          <Search1 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por título, tag o categoría…"
            className="w-full rounded-lg border border-card-border bg-input-background py-2.5 pr-4 pl-9 text-sm text-title-50 outline-none placeholder:text-input-placeholder-text focus:border-input-primary-focus-border focus:ring-4 focus:ring-input-primary-focus-border/20"
          />
        </label>

        <FiltroBotones<Filtro>
          etiqueta="Filtrar por categoría"
          valor={categoria}
          onChange={setCategoria}
          opciones={[
            { valor: "todas", etiqueta: "Todas", cantidad: componentes.length },
            ...categorias.map((c) => ({ valor: c.slug as Filtro, etiqueta: c.label, cantidad: c.cantidad })),
          ]}
        />
      </div>

      {visibles.length === 0 ? (
        <EmptyState title="Nada coincide" description="Probá con otra palabra o quitá el filtro de categoría." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibles.map((c) => (
            <TarjetaComponente key={c.id} componente={c} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaComponente({ componente: c }: { componente: ComponenteUI }) {
  return (
    <li className="group relative">
      <Card className="flex h-full flex-col overflow-hidden p-0 transition-colors group-focus-within:border-primary-500 group-hover:border-primary-500">
        <VistaPrevia componente={c} />

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-sm font-semibold text-title-50">
              {/* Enlace extendido: toda la tarjeta lleva al detalle; las acciones quedan por encima (z-10). */}
              <Link href={`/landing-pages/componentes/${c.id}`} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary-500">
                {c.title}
              </Link>
            </h3>
            <Badge color="gray" className="shrink-0">
              {LABEL_CATEGORIA[c.category]}
            </Badge>
          </div>

          {c.tags.length > 0 && (
            <p className="flex flex-wrap gap-x-2 text-xs text-text-tertiary">
              {c.tags.slice(0, 5).map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </p>
          )}

          <div className="relative z-10 mt-auto flex flex-wrap items-center gap-1.5 pt-2">
            {c.code && <CopiarBoton texto={c.code} etiqueta="Copiar código" mensaje="Código copiado" />}
            {c.prompt && <CopiarBoton texto={c.prompt} etiqueta="Copiar prompt" mensaje="Prompt copiado" />}
            {c.install_command && (
              <CopiarBoton texto={c.install_command} etiqueta="Copiar comando" mensaje="Comando copiado" />
            )}
            {c.reference_url && (
              <a
                href={c.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-card-border bg-card-background px-2 py-1 text-xs font-medium text-text-secondary transition-colors outline-none hover:border-primary-500 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <ExpandArrowTopRightSquare1 className="size-3.5" />
                Referencia
              </a>
            )}
          </div>
        </div>
      </Card>
    </li>
  );
}
