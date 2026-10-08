import {
  listarClientes,
  listarCotizaciones,
  listarProyectos,
  obtenerAjuste,
} from "@/lib/landing/datos";
import { PageHeader } from "@/components/landing/ui";
import { CotizacionForm } from "@/components/landing/cotizacion-form";
import { CotizacionesTabla } from "@/components/landing/cotizaciones-tabla";
import { PlantillaCotizacion } from "@/components/landing/plantilla-cotizacion";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage() {
  const [cotizaciones, clientes, proyectos, plantillaUrl] = await Promise.all([
    listarCotizaciones(),
    listarClientes(),
    listarProyectos(),
    obtenerAjuste("quote_template_url"),
  ]);

  return (
    <>
      <PageHeader
        titulo="Cotizaciones"
        descripcion={`${cotizaciones.length} ${cotizaciones.length === 1 ? "cotización" : "cotizaciones"}`}
        accion={<CotizacionForm clientes={clientes} proyectos={proyectos} />}
      />

      <PlantillaCotizacion url={plantillaUrl} />

      <CotizacionesTabla cotizaciones={cotizaciones} clientes={clientes} proyectos={proyectos} />
    </>
  );
}
