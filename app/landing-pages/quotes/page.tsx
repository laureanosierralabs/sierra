import {
  listarClientes,
  listarCotizaciones,
  listarProyectos,
  obtenerAjuste,
} from "@/lib/landing/datos";
import { PageHeader } from "@/components/landing/ui";
import { EnlaceBoton } from "@/components/landing/enlace-boton";
import { FileText } from "@tailgrids/icons";
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
        accion={
          <span className="flex items-center gap-3">
            <EnlaceBoton href="/landing-pages/quotes/biblioteca" icono={<FileText />}>
              Biblioteca
            </EnlaceBoton>
            <CotizacionForm clientes={clientes} proyectos={proyectos} />
          </span>
        }
      />

      <PlantillaCotizacion url={plantillaUrl} />

      <CotizacionesTabla cotizaciones={cotizaciones} clientes={clientes} proyectos={proyectos} />
    </>
  );
}
