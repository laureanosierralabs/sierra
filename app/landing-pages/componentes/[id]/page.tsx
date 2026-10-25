import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import { BloqueCodigo } from "@/components/componentes/bloque-codigo";
import { BorrarComponente } from "@/components/componentes/borrar-componente";
import { ComponenteForm } from "@/components/componentes/componente-form";
import { VistaPrevia } from "@/components/componentes/vista-previa";
import { PageHeader } from "@/components/landing/ui";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import { obtenerComponente } from "@/lib/componentes/datos";
import { LABEL_CATEGORIA, LABEL_LENGUAJE } from "@/lib/componentes/tipos";
import { accesoActual } from "@/lib/landing/auth";

export const dynamic = "force-dynamic";

export default async function ComponenteDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [componente, { esOwner }] = await Promise.all([obtenerComponente(id), accesoActual()]);
  if (!componente) notFound();

  return (
    <>
      <Link
        href="/landing-pages/componentes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Componentes
      </Link>

      <PageHeader
        titulo={componente.title}
        descripcion={LABEL_CATEGORIA[componente.category]}
        accion={
          <span className="flex items-center gap-3">
            <ComponenteForm componente={componente} />
            {esOwner && <BorrarComponente id={componente.id} />}
          </span>
        }
      />

      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <VistaPrevia componente={componente} grande />
        </Card>

        {(componente.description || componente.tags.length > 0 || componente.reference_url) && (
          <div className="flex flex-col gap-3">
            {componente.description && (
              <p className="max-w-3xl text-sm whitespace-pre-line text-text-secondary">{componente.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {componente.tags.map((t) => (
                <Badge key={t} color="gray">
                  #{t}
                </Badge>
              ))}
              {componente.reference_url && (
                <a
                  href={componente.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline"
                >
                  <ExpandArrowTopRightSquare1 className="size-4" />
                  Abrir referencia
                </a>
              )}
            </div>
          </div>
        )}

        {componente.install_command && (
          <BloqueCodigo
            titulo="Instalación"
            texto={componente.install_command}
            etiquetaCopiar="Copiar comando"
            mensajeCopiado="Comando copiado"
          />
        )}

        {componente.code && (
          <BloqueCodigo
            titulo="Código"
            detalle={LABEL_LENGUAJE[componente.code_language]}
            texto={componente.code}
            etiquetaCopiar="Copiar código"
            mensajeCopiado="Código copiado"
            ajustable
          />
        )}

        {componente.prompt && (
          <BloqueCodigo
            titulo="Prompt"
            texto={componente.prompt}
            etiquetaCopiar="Copiar prompt"
            mensajeCopiado="Prompt copiado"
            monoespaciado={false}
          />
        )}
      </div>
    </>
  );
}
