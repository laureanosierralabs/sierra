import { EgresosTabla } from "@/components/finanzas-egresos-tabla";
import { FinanzasSeccion } from "@/components/finanzas-seccion";
import { AcuerdoForm } from "@/components/landing/acuerdo-form";
import { listarAcuerdos, listarClientes, listarProyectos } from "@/lib/landing/datos";
import { formatearMonto } from "@/lib/landing/tipos";

/** Los egresos hacia el equipo, al lado de los ingresos para compararlos. */
export async function FinanzasEgresos() {
  const [acuerdos, proyectos, clientes] = await Promise.all([
    listarAcuerdos(),
    listarProyectos(),
    listarClientes(),
  ]);

  const total = acuerdos.reduce((t, a) => t + (a.total_amount ?? 0), 0);

  return (
    <FinanzasSeccion
      titulo="Egresos: equipo"
      resumen={total > 0 ? `${formatearMonto(total, "USD")} comprometidos` : undefined}
      accion={<AcuerdoForm proyectos={proyectos} clientes={clientes} />}
    >
      <EgresosTabla acuerdos={acuerdos} proyectos={proyectos.map((p) => [p.id, p.name])} />
    </FinanzasSeccion>
  );
}
