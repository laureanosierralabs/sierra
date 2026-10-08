import Link from "next/link";
import { FinanzasCotizacionesTabla } from "@/components/finanzas-cotizaciones-tabla";
import { FinanzasSeccion } from "@/components/finanzas-seccion";
import { listarClientes, listarCotizaciones, listarProyectos } from "@/lib/landing/datos";

/**
 * Los ingresos salen de quotes directamente: no hay un movimiento espejo por
 * cada cobro. Una cotización que cubre tres proyectos suma una sola vez.
 * Los totales viven en el resumen de arriba, no se repiten acá.
 */
export async function FinanzasCotizaciones() {
  const [cotizaciones, clientes, proyectos] = await Promise.all([
    listarCotizaciones(),
    listarClientes(),
    listarProyectos(),
  ]);

  if (cotizaciones.length === 0) return null;

  return (
    <FinanzasSeccion
      titulo="Ingresos · Cotizaciones"
      resumen={cotizaciones.length}
      accion={
        <Link
          href="/landing-pages/quotes"
          className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          Gestionar cotizaciones →
        </Link>
      }
    >
      <FinanzasCotizacionesTabla
        cotizaciones={cotizaciones}
        clientes={clientes.map((c) => [c.id, c.company ?? c.name])}
        proyectos={proyectos.map((p) => [p.id, p.name])}
      />
    </FinanzasSeccion>
  );
}
