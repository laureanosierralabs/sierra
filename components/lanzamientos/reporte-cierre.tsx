import Image from "next/image";
import { LABEL_TIPO_LANDING, type Lanzamiento } from "@/lib/lanzamientos/tipos";
import type { Reporte } from "@/lib/lanzamientos/reporte";

const numero = (n: number) => n.toLocaleString("es-AR");
const porcentaje = (p: number | null) => (p === null ? "—" : `${p.toLocaleString("es-AR")}%`);
const FECHA = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
const DIA = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const fecha = (dia: string) => FECHA.format(new Date(`${dia}T00:00:00Z`));

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 inline-block rounded-lg bg-doc-navy px-5 py-1.5 text-[15px] font-medium text-doc-paper">
      {children}
    </h2>
  );
}

function Cifra({ label, valor, detalle }: { label: string; valor: string; detalle?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border-2 border-doc-box px-4 py-3 break-inside-avoid">
      <span className="text-sm text-doc-muted">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{valor}</span>
      {detalle && <span className="text-xs text-doc-muted">{detalle}</span>}
    </div>
  );
}

function horas(h: number): string {
  if (h < 1) return "menos de 1 hora";
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} días`;
}

/**
 * Documento del reporte de cierre: lo que se le entrega al cliente al
 * terminar el lanzamiento. Mismo lenguaje visual que las cotizaciones, y se
 * descarga en PDF con la impresión del navegador.
 */
export function ReporteCierre({
  lanzamiento,
  cliente,
  reporte,
}: {
  lanzamiento: Lanzamiento;
  cliente: string;
  reporte: Reporte;
}) {
  const r = reporte;
  const hayVentas = r.ventas > 0;
  const hayVisitas = r.visitantes > 0;

  return (
    <article className="mx-auto flex w-full max-w-[1000px] flex-col gap-12 bg-doc-paper px-6 pt-12 pb-12 text-doc-ink sm:px-14 print:max-w-none print:px-12 print:pt-10 [print-color-adjust:exact]">
      <header className="flex flex-wrap items-center justify-between gap-6 border-b-4 border-doc-box pb-6">
        <Image src="/synxbuild/synxbuild-blue.png" alt="synx build" width={444} height={91} priority className="h-auto w-44 sm:w-52" />
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-xl bg-doc-navy px-6 py-2.5 text-lg font-semibold text-doc-paper sm:text-xl">
            Reporte de cierre
          </span>
          <span className="text-xs text-doc-muted">{cliente}</span>
        </div>
      </header>

      <section>
        <h1 className="text-2xl font-semibold sm:text-3xl">{lanzamiento.name}</h1>
        <p className="mt-1 text-doc-muted">
          {lanzamiento.starts_on ? fecha(lanzamiento.starts_on) : "Sin fecha de inicio"}
          {lanzamiento.ends_on ? ` → ${fecha(lanzamiento.ends_on)}` : ""}
          {r.dias ? ` · ${r.dias} días` : ""}
        </p>
        {r.incompleto && (
          <p className="mt-4 rounded-lg border-2 border-doc-box px-4 py-2 text-sm">
            Este lanzamiento tiene más registros de los que entran en el reporte: los totales son parciales.
          </p>
        )}
        {lanzamiento.status !== "cerrado" && (
          <p className="mt-4 rounded-lg border-2 border-doc-box px-4 py-2 text-sm">
            El lanzamiento todavía no cerró: estos números son parciales y se actualizan solos.
          </p>
        )}
      </section>

      <section>
        <Titulo>Resultados</Titulo>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4">
          <Cifra label="Visitantes" valor={hayVisitas ? numero(r.visitantes) : "—"} detalle={hayVisitas ? "Únicos por día" : "Sin visitas medidas"} />
          <Cifra label="Registros" valor={numero(r.registros)} />
          <Cifra label="Conversión a registro" valor={porcentaje(r.conversionRegistro)} detalle="Registros sobre visitantes" />
          {r.meta ? (
            <Cifra label="Meta" valor={`${r.meta.logrado}%`} detalle={`de ${numero(r.meta.objetivo)} registros`} />
          ) : (
            <Cifra label="Día pico" valor={r.pico ? numero(r.pico.registros) : "—"} detalle={r.pico ? DIA.format(new Date(`${r.pico.dia}T00:00:00Z`)) : undefined} />
          )}
        </div>
        {hayVentas && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4">
            <Cifra label="Ventas" valor={numero(r.ventas)} />
            <Cifra label="Conversión a venta" valor={porcentaje(r.conversionVenta)} detalle="Ventas sobre visitantes" />
            <Cifra label="Registros que compraron" valor={porcentaje(r.registrosQueCompraron)} />
            {r.ingresos.map((i) => (
              <Cifra
                key={i.moneda}
                label={`Ingresos (${i.moneda})`}
                valor={i.total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                detalle={r.ingresosPrecioLista ? "Según precio de lista (sin cupones ni reembolsos)" : undefined}
              />
            ))}
          </div>
        )}
        {r.meta && r.pico && (
          <p className="mt-4 text-sm text-doc-muted">
            El día pico fue el {DIA.format(new Date(`${r.pico.dia}T00:00:00Z`))}, con {numero(r.pico.registros)} registros.
          </p>
        )}
      </section>

      {r.embudo.length > 0 && (
        <section className="break-inside-avoid">
          <Titulo>Después del registro</Titulo>
          <ol className="flex flex-wrap items-stretch gap-3">
            <li className="flex flex-col rounded-xl border-2 border-doc-box px-4 py-3">
              <span className="text-sm text-doc-muted">Registros</span>
              <span className="text-xl font-semibold tabular-nums">{numero(r.registros)}</span>
            </li>
            {r.embudo.map((p) => (
              <li key={p.name} className="flex flex-col rounded-xl border-2 border-doc-box px-4 py-3">
                <span className="text-sm text-doc-muted">{p.name}</span>
                <span className="text-xl font-semibold tabular-nums">
                  {numero(p.cruzan)} <span className="text-sm font-medium text-doc-muted">{porcentaje(p.porcentaje)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {r.porLanding.length > 0 && (
        <section className="break-inside-avoid">
          <Titulo>Por landing</Titulo>
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b-2 border-doc-box text-left text-sm text-doc-muted">
                <th className="py-2 font-medium">Landing</th>
                <th className="py-2 text-right font-medium">Visitantes</th>
                <th className="py-2 text-right font-medium">Conversiones</th>
                <th className="py-2 text-right font-medium">Conversión</th>
              </tr>
            </thead>
            <tbody>
              {r.porLanding.map((f) => (
                <tr key={f.id} className="border-b border-doc-rule">
                  <td className="py-2">
                    {f.name} <span className="text-sm text-doc-muted">· {LABEL_TIPO_LANDING[f.kind]}</span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{f.visitantes ? numero(f.visitantes) : "—"}</td>
                  <td className="py-2 text-right tabular-nums">
                    {numero(f.conversiones)} {f.kind === "venta" ? "ventas" : "registros"}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">{porcentaje(f.cvr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.tests.map((t) => (
            <p key={t.tipo} className="mt-3 text-sm">
              {t.significativa ? (
                <>
                  <strong>{t.mejor}</strong> convirtió mejor que {t.segunda}, y la diferencia es consistente (95% de
                  confianza): es la versión para repetir.
                </>
              ) : (
                <>
                  Entre {t.mejor} y {t.segunda} no hubo una ganadora clara: la diferencia puede ser casualidad.
                </>
              )}
            </p>
          ))}
        </section>
      )}

      {r.fuentes.length > 0 && (
        <section className="break-inside-avoid">
          <Titulo>De dónde vino la gente</Titulo>
          <ul className="flex flex-col">
            {r.fuentes.map((f) => (
              <li key={f.fuente || "sin-utm"} className="flex justify-between gap-4 border-b border-doc-rule py-2 text-[15px]">
                <span>{f.fuente || "Sin UTM (directo u orgánico)"}</span>
                <span className="tabular-nums text-doc-muted">
                  {numero(f.visitantes)} visitantes{f.registros ? ` · ${numero(f.registros)} registros` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.pedidos.total > 0 && (
        <section className="break-inside-avoid">
          <Titulo>Operación</Titulo>
          <p className="text-[15px]">
            Durante el lanzamiento se gestionaron <strong>{numero(r.pedidos.total)} pedidos</strong> (
            {[
              r.pedidos.incidencias && `${r.pedidos.incidencias} incidencias`,
              r.pedidos.cambios && `${r.pedidos.cambios} cambios`,
              r.pedidos.aprobaciones && `${r.pedidos.aprobaciones} aprobaciones`,
            ]
              .filter(Boolean)
              .join(", ")}
            ). {numero(r.pedidos.cerrados)} quedaron cerrados
            {r.pedidos.horasResolucion !== null ? `, con un tiempo típico de resolución de ${horas(r.pedidos.horasResolucion)}` : ""}.
          </p>
        </section>
      )}

      {lanzamiento.closing_notes && (
        <section>
          <Titulo>Conclusiones y próximos pasos</Titulo>
          <p className="text-[15px] whitespace-pre-wrap">{lanzamiento.closing_notes}</p>
        </section>
      )}

      <footer className="border-t-2 border-doc-box pt-4 text-xs text-doc-muted">
        synx build · Launch Operations. Visitantes medidos sin cookies y contados una vez por día.
      </footer>
    </article>
  );
}
