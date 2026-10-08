import { currentUser } from "@clerk/nextjs/server";
import { unstable_rethrow } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { GraficoCobrado } from "@/components/inicio/grafico-cobrado";
import { KpisInicio, type DatosKpis } from "@/components/inicio/kpis";
import { ListaItems } from "@/components/inicio/lista-items";
import { ProyectosActivos } from "@/components/inicio/proyectos-activos";
import { TarjetaLista } from "@/components/inicio/tarjeta-lista";
import {
  armarAtencion,
  fechaLarga,
  otrasMonedas,
  proximasEntregas,
  resumenTareas,
  saludo,
  serieCobrado,
} from "@/lib/inicio";
import { listarMiembros } from "@/lib/landing/auth";
import { cargarFinanzas } from "@/lib/landing/balance";
import { listarClientes, listarProyectos, listarTareas } from "@/lib/landing/datos";
import { formatearMonto } from "@/lib/landing/tipos";
import { financeSummary, money, today, type FinanceData } from "@/lib/personal-finance";
import { loadPersonalFinance } from "@/lib/personal-finance-server";

/** Las finanzas personales no deben tumbar Inicio si la carga falla. */
async function cargarPersonal(): Promise<FinanceData | null> {
  try {
    return await loadPersonalFinance();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[inicio] no se pudieron cargar las finanzas personales:", e);
    return null;
  }
}

export async function InicioContenido() {
  const hoy = today();
  const mesActual = hoy.slice(0, 7);

  const [usuario, proyectos, tareas, clientes, miembros, finanzas, personal] = await Promise.all([
    currentUser(),
    listarProyectos(),
    listarTareas(),
    listarClientes(),
    listarMiembros(),
    cargarFinanzas(),
    cargarPersonal(),
  ]);

  const clientePor = new Map(clientes.map((c) => [c.id, c.name]));
  const miembroPor = new Map(miembros.map((m) => [m.id, m.nombre]));
  const proyectoNombre = new Map(proyectos.map((p) => [p.id, p.name]));
  const { balance } = finanzas;

  const atencion = armarAtencion({
    tareas,
    proyectos,
    cotizaciones: finanzas.cotizaciones,
    clientes: clientePor,
    proyectoNombre,
    personal,
    hoy,
  });
  const entregas = proximasEntregas(
    { tareas, proyectos, clientes: clientePor, proyectoNombre, hoy },
    new Set(atencion.map((i) => i.key)),
  );

  const cobradoMes = balance.meses.find((m) => m.mes === mesActual)?.ingresos ?? null;
  const { vencidas, paraHoy } = resumenTareas(tareas, hoy);
  const resumenPersonal = personal ? financeSummary(personal, mesActual) : null;

  const kpis: DatosKpis = {
    cobradoMes: formatearMonto(cobradoMes?.USD ?? 0, "USD"),
    cobradoNota: cobradoMes ? otrasMonedas(cobradoMes) : null,
    porCobrar: formatearMonto(balance.porCobrar.USD, "USD"),
    porCobrarNota: otrasMonedas(balance.porCobrar),
    tareasVencidas: vencidas,
    tareasHoy: paraHoy,
    cashPersonal: resumenPersonal
      ? resumenPersonal.cash === null
        ? { valor: "Estimación parcial", nota: "Faltan datos para convertir a USD" }
        : { valor: money(resumenPersonal.cash, "USD"), nota: "Saldo de cuentas, en USD" }
      : null,
  };

  const nombre = usuario?.firstName;

  return (
    <>
      <PageHeader
        title={nombre ? `${saludo()}, ${nombre}` : saludo()}
        description={`${fechaLarga()}. ${
          atencion.length > 0
            ? `${atencion.length} ${atencion.length === 1 ? "cosa necesita" : "cosas necesitan"} tu atención.`
            : "Todo en orden."
        }`}
      />

      <KpisInicio kpis={kpis} />

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TarjetaLista titulo="Necesita atención" descripcion="Lo más urgente primero">
            <ListaItems items={atencion} vacio="Todo en orden. No hay nada urgente." />
          </TarjetaLista>
        </div>
        <TarjetaLista
          titulo="Próximas entregas"
          descripcion="Próximos 14 días"
          verTodo={{ href: "/landing-pages", label: "Calendario" }}
        >
          <ListaItems items={entregas} vacio="Sin entregas en los próximos 14 días." />
        </TarjetaLista>
      </div>

      <div className="mb-6">
        <GraficoCobrado puntos={serieCobrado(balance, mesActual)} />
      </div>

      <ProyectosActivos proyectos={proyectos} clientes={clientePor} miembros={miembroPor} />
    </>
  );
}
