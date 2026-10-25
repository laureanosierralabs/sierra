"use client";

import { Sparkline } from "@/components/portal/resultados/graficos";
import { monto, numero, porcentaje, TARJETA } from "@/components/portal/resultados/formato";
import { variacionPorcentual, type ResultadosVista } from "@/lib/lanzamientos/resultados";
import { cn } from "@/utils/cn";

interface Variacion {
  texto: string;
  tono: "sube" | "baja" | "igual";
}

const TONO: Record<Variacion["tono"], string> = {
  sube: "text-emerald-400",
  baja: "text-rose-400",
  igual: "text-white/55",
};

const FLECHA: Record<Variacion["tono"], string> = { sube: "▲", baja: "▼", igual: "=" };

/** Cambio en porcentaje; null si no hay base para comparar. */
function porPorcentaje(actual: number | null, anterior: number | null): Variacion | null {
  const v = variacionPorcentual(actual, anterior);
  if (v === null) return null;
  return {
    texto: v === 0 ? "igual" : `${Math.abs(v).toLocaleString("es-AR")}%`,
    tono: v > 0 ? "sube" : v < 0 ? "baja" : "igual",
  };
}

/** Cambio en puntos porcentuales (para una conversión). */
function enPuntos(actual: number | null, anterior: number | null): Variacion | null {
  if (actual === null || anterior === null) return null;
  const d = Math.round((actual - anterior) * 10) / 10;
  return {
    texto: d === 0 ? "igual" : `${Math.abs(d).toLocaleString("es-AR")} pts`,
    tono: d > 0 ? "sube" : d < 0 ? "baja" : "igual",
  };
}

function TarjetaKpi({
  etiqueta,
  valor,
  explicacion,
  linea,
  variacion,
  contra,
  serie,
  indice,
}: {
  etiqueta: string;
  valor: string;
  explicacion: string;
  /** Dato destacado debajo del número (por ejemplo, los ingresos). */
  linea?: string;
  variacion: Variacion | null;
  contra: string | null;
  serie: (number | null)[];
  indice: number;
}) {
  return (
    <article
      style={{ "--retraso": `${0.05 + indice * 0.06}s` } as React.CSSProperties}
      className={cn(TARJETA, "portal-entrar flex min-w-0 flex-col gap-1 p-4 sm:p-5")}
    >
      <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase">{etiqueta}</h3>
      <p className="mt-1 text-3xl font-extrabold tracking-tighter text-white tabular-nums sm:text-4xl">{valor}</p>
      {linea && <p className="text-sm font-semibold tracking-tight text-white tabular-nums">{linea}</p>}
      <p className="text-xs leading-snug text-white/55">{explicacion}</p>
      {variacion && contra && (
        <p className="mt-1 text-xs">
          <span className={cn("font-semibold tabular-nums", TONO[variacion.tono])}>
            <span aria-hidden="true">{FLECHA[variacion.tono]}</span>{" "}
            <span className="sr-only">{variacion.tono === "sube" ? "Subió" : variacion.tono === "baja" ? "Bajó" : "Sin cambios,"} </span>
            {variacion.texto}
          </span>{" "}
          <span className="text-white/45">{contra}</span>
        </p>
      )}
      <div className="mt-auto pt-3">
        <Sparkline valores={serie} />
      </div>
    </article>
  );
}

/**
 * Los cuatro números que el cliente mira primero. Cada tarjeta lleva una
 * frase que explica qué cuenta, la serie diaria en miniatura y, si el período
 * es comparable, el cambio contra el tramo anterior de igual largo.
 */
export function FilaKpis({ r }: { r: ResultadosVista }) {
  const { actual, anterior, serie } = r;
  const contra = r.rango && anterior ? `vs. ${r.rango.dias} días anteriores` : null;
  const soloVenta = actual.tipoConversion === "venta";
  const hayVentas = soloVenta || r.datos.paginas.some((p) => p.kind === "venta") || r.datos.compras.length > 0;
  // Con el listado de registros recortado, el período anterior estaría incompleto.
  const comparaRegistros = !r.truncado;

  const visitantes = (
    <TarjetaKpi
      key="visitantes"
      etiqueta="Visitantes"
      valor={r.hayVisitas ? numero(actual.visitantes) : "—"}
      explicacion={
        r.hayVisitas
          ? "Personas únicas que vieron tu landing (quien vuelve otro día cuenta de nuevo)."
          : "Aún no hay visitas medidas. Aparecerán cuando la landing empiece a recibir tráfico."
      }
      variacion={r.hayVisitas && anterior ? porPorcentaje(actual.visitantes, anterior.visitantes) : null}
      contra={contra}
      serie={r.hayVisitas ? serie.map((d) => d.visitantes) : []}
      indice={0}
    />
  );

  const conversion = (
    <TarjetaKpi
      key="conversion"
      etiqueta={soloVenta ? "Conversión a venta" : "Conversión a registro"}
      valor={porcentaje(actual.conversion)}
      explicacion={
        actual.conversion !== null
          ? soloVenta
            ? `Compran ${actual.conversion.toLocaleString("es-AR")} de cada 100 visitantes.`
            : `Se registran ${actual.conversion.toLocaleString("es-AR")} de cada 100 visitantes.`
          : "Se calcula cuando hay visitas medidas en la landing."
      }
      variacion={anterior ? enPuntos(actual.conversion, anterior.conversion) : null}
      contra={contra}
      serie={serie.map((d) => (soloVenta ? null : d.conversion))}
      indice={2}
    />
  );

  const ventasIngresos = (conIngresos: boolean, indice: number) => (
    <TarjetaKpi
      key="ventas"
      etiqueta="Ventas"
      valor={numero(actual.ventas)}
      linea={
        conIngresos && r.ingresos.length > 0
          ? r.ingresos.map(([m, t]) => `${m} ${monto(t)}`).join(" · ")
          : undefined
      }
      explicacion={
        !conIngresos
          ? "Compras confirmadas."
          : r.precioLista
            ? "Compras confirmadas. Ingresos según precio de lista, sin cupones ni reembolsos."
            : "Compras confirmadas y lo que ingresó por ellas."
      }
      variacion={anterior ? porPorcentaje(actual.ventas, anterior.ventas) : null}
      contra={contra}
      serie={serie.map((d) => d.ventas)}
      indice={indice}
    />
  );

  const registros = (
    <TarjetaKpi
      key="registros"
      etiqueta="Registros"
      valor={numero(actual.registros)}
      explicacion="Personas que dejaron sus datos para registrarse."
      variacion={anterior && comparaRegistros ? porPorcentaje(actual.registros, anterior.registros) : null}
      contra={contra}
      serie={serie.map((d) => d.registros)}
      indice={1}
    />
  );

  let cuarta;
  if (hayVentas) {
    cuarta = ventasIngresos(true, 3);
  } else if (r.meta) {
    cuarta = (
      <TarjetaKpi
        key="meta"
        etiqueta="Meta"
        valor={`${r.meta.porcentaje}%`}
        explicacion={`Llevas ${numero(r.meta.registros)} de ${numero(r.meta.objetivo)} registros (todo el lanzamiento).`}
        variacion={null}
        contra={null}
        serie={serie.map((d) => d.acumulado)}
        indice={3}
      />
    );
  } else {
    const dias = r.rango?.dias ?? Math.max(serie.length, 1);
    cuarta = (
      <TarjetaKpi
        key="promedio"
        etiqueta="Registros por día"
        valor={numero(Math.round(actual.registros / dias))}
        explicacion={`Promedio de ${numero(dias)} ${dias === 1 ? "día" : "días"}.`}
        variacion={null}
        contra={null}
        serie={serie.map((d) => d.registros)}
        indice={3}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {soloVenta ? [visitantes, ventasIngresos(false, 1), conversion] : [visitantes, registros, conversion]}
      {soloVenta ? (
        <TarjetaKpi
          key="ingresos"
          etiqueta="Ingresos"
          valor={r.ingresos.length === 1 ? `${r.ingresos[0][0]} ${monto(r.ingresos[0][1])}` : r.ingresos.length ? "Varias monedas" : "—"}
          linea={r.ingresos.length > 1 ? r.ingresos.map(([m, t]) => `${m} ${monto(t)}`).join(" · ") : undefined}
          explicacion={r.precioLista ? "Según precio de lista, sin cupones ni reembolsos." : "Lo que ingresó por las ventas medidas."}
          variacion={null}
          contra={null}
          serie={[]}
          indice={3}
        />
      ) : (
        cuarta
      )}
    </div>
  );
}
