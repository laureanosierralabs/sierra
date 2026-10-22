import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { ElementoBibliotecaForm, FilaBiblioteca } from "@/components/landing/biblioteca-propuesta";
import { SeccionCard } from "@/components/landing/seccion-card";
import { PageHeader } from "@/components/landing/ui";
import { accesoActual } from "@/lib/landing/auth";
import { listarBiblioteca } from "@/lib/landing/datos";

export const dynamic = "force-dynamic";

/**
 * Biblioteca de la propuesta: los "incluye" y las preguntas que se repiten en
 * las cotizaciones. En cada cotización se tildan los que van.
 */
export default async function BibliotecaPropuesta() {
  const { esOwner } = await accesoActual();
  if (!esOwner) redirect("/landing-pages");

  const biblioteca = await listarBiblioteca();
  const incluye = biblioteca.filter((b) => b.kind === "incluye");
  const preguntas = biblioteca.filter((b) => b.kind === "pregunta");

  return (
    <>
      <Link
        href="/landing-pages/quotes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" />
        Cotizaciones
      </Link>

      <PageHeader
        titulo="Biblioteca de propuestas"
        descripcion="Lo que se repite en tus cotizaciones. En cada una tildás lo que va y sumás lo propio."
      />

      <div className="flex flex-col gap-6">
        <SeccionCard titulo="Este servicio incluye" cantidad={incluye.length} accion={<ElementoBibliotecaForm kind="incluye" />}>
          {incluye.length === 0 ? (
            <EmptyState variant="inline" className="px-4 py-6" title="Sin ítems todavía" />
          ) : (
            <ul className="divide-y divide-card-border">
              {incluye.map((e) => (
                <FilaBiblioteca key={e.id} elemento={e} />
              ))}
            </ul>
          )}
        </SeccionCard>

        <SeccionCard titulo="Importantes" cantidad={preguntas.length} accion={<ElementoBibliotecaForm kind="pregunta" />}>
          {preguntas.length === 0 ? (
            <EmptyState variant="inline" className="px-4 py-6" title="Sin preguntas todavía" />
          ) : (
            <ul className="divide-y divide-card-border">
              {preguntas.map((e) => (
                <FilaBiblioteca key={e.id} elemento={e} />
              ))}
            </ul>
          )}
        </SeccionCard>
      </div>
    </>
  );
}
