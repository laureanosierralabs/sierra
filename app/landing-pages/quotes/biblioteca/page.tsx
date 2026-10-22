import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import {
  ElementoBibliotecaForm,
  FilaBiblioteca,
  FilaPlantilla,
  TarjetaPortfolio,
  TrabajoPortfolioForm,
  FilaVideo,
  VideoSoporteForm,
} from "@/components/landing/biblioteca-propuesta";
import { SeccionCard } from "@/components/landing/seccion-card";
import { PageHeader } from "@/components/landing/ui";
import { accesoActual } from "@/lib/landing/auth";
import {
  listarBiblioteca,
  listarClientes,
  listarPlantillas,
  listarPortfolio,
  listarVideosSoporte,
} from "@/lib/landing/datos";

export const dynamic = "force-dynamic";

/**
 * Biblioteca de la propuesta: los "incluye" y las preguntas que se repiten en
 * las cotizaciones. En cada cotización se tildan los que van.
 */
export default async function BibliotecaPropuesta() {
  const { esOwner } = await accesoActual();
  if (!esOwner) redirect("/landing-pages");

  const [biblioteca, plantillas, portfolio, clientes, videos] = await Promise.all([
    listarBiblioteca(),
    listarPlantillas(),
    listarPortfolio(),
    listarClientes(),
    listarVideosSoporte(),
  ]);
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
        descripcion="Tu kit: plantillas por servicio, los textos que se repiten, tu portfolio y los videos de soporte del portal."
      />

      <div className="flex flex-col gap-6">
        <SeccionCard titulo="Plantillas" cantidad={plantillas.length}>
          {plantillas.length === 0 ? (
            <EmptyState
              variant="inline"
              className="px-4 py-6"
              title="Sin plantillas todavía"
              description="Armá bien una cotización y tocá Guardar como plantilla: la próxima vez sale armada en un minuto."
            />
          ) : (
            <ul className="divide-y divide-card-border">
              {plantillas.map((p) => (
                <FilaPlantilla key={p.id} plantilla={p} clientes={clientes.map((c) => ({ id: c.id, name: c.name }))} />
              ))}
            </ul>
          )}
        </SeccionCard>

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

        <SeccionCard titulo="Portfolio" cantidad={portfolio.length} accion={<TrabajoPortfolioForm />}>
          {portfolio.length === 0 ? (
            <EmptyState
              variant="inline"
              className="px-4 py-6"
              title="Sin trabajos todavía"
              description="Los que cargues salen al pie de las propuestas, como en tus PDFs."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {portfolio.map((t) => (
                <TarjetaPortfolio key={t.id} trabajo={t} />
              ))}
            </ul>
          )}
        </SeccionCard>

        <SeccionCard titulo="Videos de soporte" cantidad={videos.length} accion={<VideoSoporteForm />}>
          {videos.length === 0 ? (
            <EmptyState
              variant="inline"
              className="px-4 py-6"
              title="Sin videos todavía"
              description="Tutoriales para tus clientes (cómo entrar a WordPress, cómo cambiar un link…): salen en su portal."
            />
          ) : (
            <ul className="divide-y divide-card-border">
              {videos.map((v) => (
                <FilaVideo key={v.id} video={v} />
              ))}
            </ul>
          )}
        </SeccionCard>
      </div>
    </>
  );
}
