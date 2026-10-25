import { BibliotecaComponentes } from "@/components/componentes/biblioteca-componentes";
import { ComponenteForm } from "@/components/componentes/componente-form";
import { PageHeader } from "@/components/landing/ui";
import { listarComponentes } from "@/lib/componentes/datos";

export const dynamic = "force-dynamic";

/**
 * Biblioteca de componentes para landings: lo que el equipo quiere reusar
 * (código, prompt, comando de instalación y referencias), con búsqueda al vuelo.
 */
export default async function Componentes() {
  const componentes = await listarComponentes();

  return (
    <>
      <PageHeader
        titulo="Componentes"
        descripcion={`${componentes.length} ${componentes.length === 1 ? "componente" : "componentes"} para reusar en landings`}
        accion={<ComponenteForm />}
      />
      <BibliotecaComponentes componentes={componentes} />
    </>
  );
}
