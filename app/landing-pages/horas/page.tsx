import { Download1 } from "@tailgrids/icons";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/common/kpi-card";
import { CopiarParaSheets } from "@/components/horas/copiar-sheets";
import { AccionesHora, HoraForm } from "@/components/horas/hora-form";
import { Input, Select } from "@/components/landing/dialogo-form";
import { PageHeader } from "@/components/landing/ui";
import { Button } from "@/components/tailgrids/core/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow } from "@/components/tailgrids/core/table";
import { listarClientes } from "@/lib/landing/datos";
import { horasVisibles } from "@/lib/horas/datos";
import { duracionTexto, fechaValida, mesDe, paraPegarEnSheets, totalMinutos } from "@/lib/horas/tipos";
import { diaDe } from "@/lib/lanzamientos/tipos";

export const dynamic = "force-dynamic";

const DIA = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

/** Mes anterior al que contiene `fecha` (AAAA-MM-DD). */
function mesAnterior(fecha: string) {
  const [a, m] = fecha.split("-").map(Number);
  return mesDe(m === 1 ? `${a - 1}-12-01` : `${a}-${String(m - 1).padStart(2, "0")}-01`);
}

/**
 * Tabla de horas del equipo. Cada uno carga día, comienzo, finalización y qué
 * hizo; las horas se suman solas. Por defecto muestra el mes en curso, que es
 * como se rinde la planilla. Se exporta con las columnas de la planilla de
 * Wonder (copiar y pegar en Google Sheets, o CSV).
 */
export default async function Horas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const valor = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const hoy = diaDe(new Date());
  const mes = mesDe(hoy);
  const desde = fechaValida(valor("desde")) ?? mes.desde;
  const hasta = fechaValida(valor("hasta")) ?? mes.hasta;
  const persona = valor("persona") || null;
  const cliente = valor("cliente") || null;

  const [vista, clientes] = await Promise.all([
    horasVisibles({ desde, hasta, persona, cliente }),
    listarClientes()
      .then((l) => l.map((c) => ({ id: c.id, name: c.name })))
      .catch(() => []),
  ]);
  if (!vista) redirect("/sin-acceso");

  const { entradas, esOwner, userId, personas, truncado } = vista;
  const nombreCliente = new Map(clientes.map((c) => [c.id, c.name]));
  const total = totalMinutos(entradas);
  const dias = new Set(entradas.map((e) => e.work_date)).size;
  const verPersona = esOwner && !persona;

  const porPersona = verPersona
    ? [...entradas.reduce((m, e) => m.set(e.user_name, (m.get(e.user_name) ?? 0) + e.minutes), new Map<string, number>())]
        .sort((a, b) => b[1] - a[1])
    : [];

  const filtros = new URLSearchParams({ desde, hasta });
  if (persona && esOwner) filtros.set("persona", persona);
  if (cliente) filtros.set("cliente", cliente);
  const anterior = mesAnterior(mes.desde);

  return (
    <>
      <PageHeader
        titulo="Horas"
        descripcion={esOwner ? "Las horas del equipo, para rendir y exportar" : "Cargá tus horas: se suman solas"}
        accion={<HoraForm hoy={hoy} clientes={clientes} />}
      />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-input-label-text">Desde</span>
          <Input name="desde" type="date" defaultValue={desde} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-input-label-text">Hasta</span>
          <Input name="hasta" type="date" defaultValue={hasta} />
        </label>
        {esOwner && (
          <label className="flex min-w-40 flex-col gap-1.5">
            <span className="text-sm font-medium text-input-label-text">Persona</span>
            <Select name="persona" defaultValue={persona ?? ""}>
              <option value="">Todo el equipo</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label className="flex min-w-40 flex-col gap-1.5">
          <span className="text-sm font-medium text-input-label-text">Cliente</span>
          <Select name="cliente" defaultValue={cliente ?? ""}>
            <option value="">Todos</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit">Filtrar</Button>
        <span className="flex items-center gap-3 pb-2.5 text-sm">
          <a href="/landing-pages/horas" className="font-medium text-primary-500 hover:underline">
            Este mes
          </a>
          <a
            href={`/landing-pages/horas?desde=${anterior.desde}&hasta=${anterior.hasta}`}
            className="font-medium text-primary-500 hover:underline"
          >
            Mes anterior
          </a>
        </span>
      </form>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Horas trabajadas" value={duracionTexto(total)} hint={`${(total / 60).toFixed(2).replace(".", ",")} h`} />
        <KpiCard label="Días trabajados" value={String(dias)} />
        <KpiCard label="Cargas" value={String(entradas.length)} />
      </div>

      {truncado && (
        <p className="mb-6 text-sm text-text-secondary">
          Hay más cargas de las que se muestran: acotá las fechas para que los totales sean completos.
        </p>
      )}

      {porPersona.length > 1 && (
        <p className="mb-6 text-sm text-text-secondary">
          {porPersona.map(([nombre, min]) => `${nombre}: ${duracionTexto(min)}`).join(" · ")}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
        <CopiarParaSheets texto={paraPegarEnSheets(entradas)} filas={entradas.length} />
        <a
          href={`/landing-pages/horas/exportar?${filtros}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:underline [&>svg]:size-4"
        >
          <Download1 />
          Descargar CSV
        </a>
      </div>

      {entradas.length === 0 ? (
        <EmptyState
          title="No hay horas en este período"
          description="Cargá el día, la hora de comienzo, la de finalización y qué trabajaste: las horas se calculan solas."
        />
      ) : (
        <TableRoot aria-label="Horas cargadas">
          <TableHeader>
            <TableRow>
              <TableHead>Día</TableHead>
              {verPersona && <TableHead>Persona</TableHead>}
              <TableHead>Horario</TableHead>
              <TableHead className="text-right">Horas</TableHead>
              <TableHead>Qué se trabajó</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entradas.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap">{DIA.format(new Date(`${e.work_date}T00:00:00Z`))}</TableCell>
                {verPersona && <TableCell className="whitespace-nowrap">{e.user_name}</TableCell>}
                <TableCell className="whitespace-nowrap">
                  {e.start_time} – {e.end_time}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">{duracionTexto(e.minutes)}</TableCell>
                <TableCell className="min-w-64 whitespace-pre-line">{e.notes}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {e.client_id ? (nombreCliente.get(e.client_id) ?? "—") : "—"}
                </TableCell>
                <TableCell>
                  {(esOwner || e.user_id === userId) && <AccionesHora entrada={e} hoy={hoy} clientes={clientes} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableRoot>
      )}
    </>
  );
}
