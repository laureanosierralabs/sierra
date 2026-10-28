import { GraficoDona } from "@/components/portal/resultados/graficos";
import { COLORES_FUENTES, monto, numero, porcentaje, TARJETA } from "@/components/portal/resultados/formato";
import { partirAnuncio } from "@/lib/lanzamientos/origen";
import type { ResultadosVista } from "@/lib/lanzamientos/resultados";
import { cn } from "@/utils/cn";

interface FilaBarra {
  clave: string;
  etiqueta: string;
  /** El valor llegó tal cual desde Meta (un id): se muestra en monoespaciada. */
  crudo?: boolean;
  /** Dato secundario bajo la etiqueta (p. ej. el id del anuncio). */
  sub?: string | null;
  valor: number;
  detalle?: string;
}

/** Ranking horizontal: etiqueta, cantidad y una barra proporcional al primero. */
function Ranking({ filas, unidad }: { filas: FilaBarra[]; unidad: string }) {
  const maximo = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <ul className="flex flex-col gap-3.5">
      {filas.map((f) => (
        <li key={f.clave}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0" title={f.sub ? `${f.etiqueta} | ${f.sub}` : f.etiqueta}>
              <span className={cn("block truncate text-white/85", f.crudo && "font-mono text-xs")}>{f.etiqueta}</span>
              {f.sub && <span className="block truncate font-mono text-[11px] text-white/45">{f.sub}</span>}
            </span>
            <span className="shrink-0 tabular-nums">
              <strong className="font-semibold">{numero(f.valor)}</strong>{" "}
              <span className="text-xs text-white/55">
                {unidad}
                {f.detalle ? ` · ${f.detalle}` : ""}
              </span>
            </span>
          </div>
          <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
            <span className="block h-full rounded-full bg-[#5073ff]" style={{ width: `${Math.max((f.valor / maximo) * 100, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Subtitulo({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-xs font-semibold tracking-wide text-white/60 uppercase">{children}</h3>;
}

/** De dónde llegan: dona por fuente y, al lado, las campañas y los anuncios que más registros traen. */
export function BloqueOrigen({ r }: { r: ResultadosVista }) {
  const porVisitas = r.baseFuentes === "visitantes";
  const base = (f: { visitantes: number; registros: number }) => (porVisitas ? f.visitantes : f.registros);
  const total = r.fuentes.reduce((t, f) => t + base(f), 0);

  const campanas = r.campanas.filas.filter((f) => f.valor !== null);
  const anuncios = r.anuncios.filas.filter((f) => f.valor !== null);
  const mejorAnuncio = anuncios[0];
  const ventasAnuncios = r.ventasAnuncios.filas.filter((f) => f.valor !== null);
  const ventasCampanas = r.ventasCampanas.filas.filter((f) => f.valor !== null);
  const hayVentas = ventasAnuncios.length > 0 || ventasCampanas.length > 0;
  const textoIngresos = (f: { ingresos: [string, number][] }) =>
    f.ingresos.map(([moneda, total]) => `${moneda} ${monto(total)}`).join(" + ");
  const sinUtm = r.origenesSinUtm.slice(0, 6);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <div className={cn(TARJETA, "p-5 sm:p-6")}>
          <Subtitulo>De dónde llegan</Subtitulo>
          {total === 0 ? (
            <p className="text-sm leading-relaxed text-white/60">
              Cuando entren visitas con enlaces medidos (con UTM), verás aquí de qué fuente llega cada persona.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <GraficoDona
                datos={r.fuentes.map((f) => ({ nombre: f.etiqueta, valor: base(f) }))}
                total={total}
                etiquetaTotal={porVisitas ? "visitantes" : "registros"}
                resumen={`Reparto por fuente: ${r.fuentes.map((f) => `${f.etiqueta} ${numero(base(f))}`).join(", ")}`}
              />
              <ul className="flex w-full min-w-0 flex-col gap-3">
                {r.fuentes.map((f, i) => (
                  <li key={f.fuente} className="flex items-start gap-2.5 text-sm">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{ background: COLORES_FUENTES[i % COLORES_FUENTES.length] }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-white/85">{f.etiqueta}</span>
                        <span className="shrink-0 tabular-nums">
                          <strong className="font-semibold">{numero(base(f))}</strong>{" "}
                          <span className="text-xs text-white/55">{porcentaje(Math.round((base(f) / total) * 1000) / 10)}</span>
                        </span>
                      </span>
                      {porVisitas && f.registros > 0 && (
                        <span className="block text-xs text-white/50 tabular-nums">
                          {numero(f.registros)} {f.registros === 1 ? "registro" : "registros"}
                          {f.conversion !== null ? ` · ${porcentaje(f.conversion)} de conversión` : ""}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-5 text-xs text-white/45">
            {porVisitas ? "Cuenta visitantes según el utm_source del enlace." : "Aún no hay visitas medidas: se cuentan los registros según su utm_source."}
          </p>
        </div>

        <div className={cn(TARJETA, "flex flex-col gap-7 p-5 sm:p-6")}>
          {campanas.length === 0 && anuncios.length === 0 && !hayVentas ? (
            <>
              <Subtitulo>Campañas y anuncios</Subtitulo>
              <p className="-mt-2 text-sm leading-relaxed text-white/60">
                Cuando los registros o las ventas lleguen desde anuncios con UTM, verás aquí qué campañas y qué anuncios traen más gente.
              </p>
            </>
          ) : (
            <>
              {mejorAnuncio && (
                <div className="rounded-xl bg-primary-500/15 p-4 ring-1 ring-primary-500/30">
                  <p className="text-xs font-semibold tracking-wide text-[#a9b8ff] uppercase">El anuncio que más registros trae</p>
                  <p className="mt-1.5 font-mono text-sm break-all text-white">{mejorAnuncio.valor}</p>
                  <p className="mt-1 text-xs text-white/65 tabular-nums">
                    {numero(mejorAnuncio.registros)} {mejorAnuncio.registros === 1 ? "registro" : "registros"} ·{" "}
                    {porcentaje(mejorAnuncio.porcentaje)} del total
                  </p>
                </div>
              )}
              {campanas.length > 0 && (
                <div>
                  <Subtitulo>Campañas</Subtitulo>
                  <Ranking
                    unidad="registros"
                    filas={campanas.map((f) => ({
                      clave: f.valor ?? "",
                      etiqueta: f.valor ?? "",
                      crudo: true,
                      valor: f.registros,
                      detalle: porcentaje(f.porcentaje),
                    }))}
                  />
                </div>
              )}
              {anuncios.length > 0 && (
                <div>
                  <Subtitulo>Anuncios</Subtitulo>
                  <Ranking
                    unidad="registros"
                    filas={anuncios.map((f) => ({
                      clave: f.valor ?? "",
                      etiqueta: f.valor ?? "",
                      crudo: true,
                      valor: f.registros,
                      detalle: porcentaje(f.porcentaje),
                    }))}
                  />
                </div>
              )}
              {ventasAnuncios.length > 0 && (
                <div>
                  <Subtitulo>Ventas por anuncio</Subtitulo>
                  <Ranking
                    unidad="ventas"
                    filas={ventasAnuncios.map((f) => {
                      const a = partirAnuncio(f.valor ?? "");
                      return {
                        clave: f.valor ?? "",
                        etiqueta: a.nombre,
                        sub: a.id,
                        valor: f.ventas,
                        detalle: textoIngresos(f) || porcentaje(f.porcentaje),
                      };
                    })}
                  />
                </div>
              )}
              {ventasCampanas.length > 0 && (
                <div>
                  <Subtitulo>Ventas por campaña</Subtitulo>
                  <Ranking
                    unidad="ventas"
                    filas={ventasCampanas.map((f) => ({
                      clave: f.valor ?? "",
                      etiqueta: f.valor ?? "",
                      crudo: true,
                      valor: f.ventas,
                      detalle: textoIngresos(f) || porcentaje(f.porcentaje),
                    }))}
                  />
                </div>
              )}
              <p className="text-xs text-white/45">Los nombres son los que entrega Meta; cuando traen un número de identificación, se muestra debajo.</p>
            </>
          )}
        </div>
      </div>

      {sinUtm.length > 0 && (
        <div className={cn(TARJETA, "p-5 sm:p-6")}>
          <Subtitulo>Visitas sin UTM, por origen</Subtitulo>
          <Ranking
            unidad="visitantes"
            filas={sinUtm.map((o) => ({ clave: o.origen, etiqueta: o.origen, valor: o.visitantes }))}
          />
          <p className="mt-4 text-xs text-white/45">Personas que llegaron sin un enlace medido, agrupadas por el sitio desde el que vinieron.</p>
        </div>
      )}
    </div>
  );
}
