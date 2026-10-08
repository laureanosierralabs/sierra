import { notFound } from "next/navigation";
import { Folder1, UserMultiple1 } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { CrearEntidad } from "@/components/crear-entidad";
import { InicioGrilla } from "@/components/inicio-grilla";
import { SeccionTitulo } from "@/components/landing/ui";
import { RecursosLista } from "@/components/recursos-lista";
import { Card } from "@/components/tailgrids/core/card";
import { UnidadClientes } from "@/components/unidad-clientes";
import { getUnidad } from "@/lib/contexto";

export const dynamic = "force-dynamic";

export default async function UnidadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 16: params es una Promise.
  const { slug } = await params;
  const u = await getUnidad(slug);
  if (!u) notFound();

  return (
    <PageContainer>
      <PageHeader title={u.nombre} description={u.queEs} />

      <section className="mb-8">
        <SeccionTitulo
          icono={Folder1}
          accion={<CrearEntidad unidad={u.slug} tipo="proyecto" />}
        >
          Proyectos
        </SeccionTitulo>
        {u.proyectos.length === 0 ? (
          <EmptyState title="Esta unidad todavía no tiene proyectos cargados." />
        ) : (
          <InicioGrilla proyectos={u.proyectos} />
        )}
      </section>

      <section className="mb-8">
        <SeccionTitulo
          icono={UserMultiple1}
          accion={<CrearEntidad unidad={u.slug} tipo="cliente" />}
        >
          Clientes
        </SeccionTitulo>
        <UnidadClientes clientes={u.clientes} unidad={u.slug} />
      </section>

      {(u.comoSeOpera || u.recursos.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-2">
          {u.comoSeOpera && (
            <Card>
              <h2 className="mb-2 text-sm font-semibold text-title-50">Cómo se opera</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-text-secondary">
                {u.comoSeOpera}
              </p>
            </Card>
          )}
          {u.recursos.length > 0 && (
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-title-50">Recursos</h2>
              <RecursosLista recursos={u.recursos} />
            </Card>
          )}
        </section>
      )}
    </PageContainer>
  );
}
