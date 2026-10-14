import { EgresosTabla } from "@/components/finanzas-egresos-tabla";
import { FinanzasSeccion } from "@/components/finanzas-seccion";
import { AcuerdoForm } from "@/components/landing/acuerdo-form";
import { listarMiembros } from "@/lib/landing/auth";
import { listarAcuerdos, listarClientes, listarProyectos } from "@/lib/landing/datos";
import { formatearMonto } from "@/lib/landing/tipos";

/** Los egresos hacia el equipo, al lado de los ingresos para compararlos. */
export async function FinanzasEgresos() {
  const [acuerdos, proyectos, clientes, miembros] = await Promise.all([
    listarAcuerdos(),
    listarProyectos(),
    listarClientes(),
    // Si Clerk falla, el form sigue andando sin el campo de cuenta poblado.
    listarMiembros().catch(() => []),
  ]);

  const total = acuerdos.reduce((t, a) => t + (a.total_amount ?? 0), 0);

  return (
    <FinanzasSeccion
      titulo="Egresos: equipo"
      resumen={total > 0 ? `${formatearMonto(total, "USD")} comprometidos` : undefined}
      accion={<AcuerdoForm proyectos={proyectos} clientes={clientes} miembros={miembros} />}
    >
      <EgresosTabla acuerdos={acuerdos} proyectos={proyectos.map((p) => [p.id, p.name])} />
    </FinanzasSeccion>
  );
}
