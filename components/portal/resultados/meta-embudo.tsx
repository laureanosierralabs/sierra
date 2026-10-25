import { numero, porcentaje, TARJETA } from "@/components/portal/resultados/formato";
import type { ResultadosVista } from "@/lib/lanzamientos/resultados";
import { cn } from "@/utils/cn";

/** Meta de registros del lanzamiento: barra de avance y, si se puede, hacia dónde va. */
export function TarjetaMeta({ r }: { r: ResultadosVista }) {
  const meta = r.meta;
  if (!meta) return null;
  const { objetivo, registros, porcentaje: avance, ritmo } = meta;
  const lleva = Math.min((registros / objetivo) * 100, 100);
  const proyectado = ritmo ? Math.min((ritmo.proyeccion / objetivo) * 100, 100) : null;
  const cumple = ritmo ? ritmo.faltan <= 0 : false;

  return (
    <div className={cn(TARJETA, "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <p className="text-5xl font-extrabold tracking-tighter tabular-nums sm:text-6xl">
          {avance}
          <span className="text-3xl text-white/60">%</span>
        </p>
        <p className="text-sm text-white/65">
          <strong className="font-semibold text-white tabular-nums">{numero(registros)}</strong> de{" "}
          <span className="tabular-nums">{numero(objetivo)}</span> registros
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(avance, 100)}
        aria-label={`Meta de registros: ${avance}% alcanzado`}
        className="relative mt-5 h-3 overflow-hidden rounded-full bg-white/8"
      >
        {proyectado !== null && proyectado > lleva && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 rounded-full bg-primary-500/30"
            style={{ width: `${proyectado}%` }}
          />
        )}
        <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-[#5073ff]" style={{ width: `${lleva}%` }} />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/70">
        {ritmo ? (
          <>
            Día {ritmo.diasTranscurridos} de {ritmo.diasTotales}. A este ritmo llegarás a{" "}
            <strong className="font-semibold text-white tabular-nums">{numero(ritmo.proyeccion)}</strong> registros al
            cierre
            {cumple ? ": cumplirás la meta." : `: te faltarían ${numero(ritmo.faltan)} para la meta.`}
          </>
        ) : (
          "La proyección aparece cuando el lanzamiento ya empezó y tiene fecha de cierre."
        )}
      </p>
      {(r.rango || r.landing) && (
        <p className="mt-1 text-xs text-white/45">La meta cuenta todos los registros del lanzamiento, sin importar el filtro.</p>
      )}
    </div>
  );
}

/** Del visitante al comprador: barras proporcionales y qué parte del paso anterior llega a cada uno. */
export function TarjetaEmbudo({ r }: { r: ResultadosVista }) {
  const pasos = r.embudo;
  const maximo = Math.max(...pasos.map((p) => p.cantidad), 1);
  const listas = r.listas.filter((l) => l.cantidad > 0);

  return (
    <div className={cn(TARJETA, "p-5 sm:p-6")}>
      {pasos.length < 2 ? (
        <p className="text-sm leading-relaxed text-white/60">
          El embudo aparece cuando hay visitas y registros medidos. Cuando la gente entre al grupo de WhatsApp, se conecte
          al webinar o compre, verás también esos pasos.
        </p>
      ) : (
        <ol className="flex flex-col gap-5">
          {pasos.map((p, i) => (
            <li key={p.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span className="text-sm font-medium text-white/80">{p.etiqueta}</span>
                <span className="flex items-baseline gap-2">
                  <strong className="text-xl font-extrabold tracking-tight tabular-nums">{numero(p.cantidad)}</strong>
                  {p.porcentaje !== null && (
                    <span className="text-xs text-white/55 tabular-nums">{porcentaje(p.porcentaje)} del paso anterior</span>
                  )}
                </span>
              </div>
              <div aria-hidden="true" className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/8">
                <span
                  className="block h-full rounded-full bg-[#5073ff]"
                  style={{ width: `${Math.max((p.cantidad / maximo) * 100, 1.5)}%`, opacity: 1 - i * 0.12 }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      {listas.length > 0 && (
        <div className={cn(pasos.length >= 2 && "mt-6 border-t border-white/10 pt-5")}>
          <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase">Listas cargadas</h3>
          <p className="mt-1 text-xs text-white/45">
            De los registrados, cuántos están en cada lista. Las listas no traen fechas: cuentan todo el lanzamiento.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {listas.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0 truncate text-white/80">{l.name}</span>
                <span className="shrink-0 tabular-nums">
                  <strong className="font-semibold">{numero(l.cantidad)}</strong>
                  {l.porcentaje !== null && <span className="ml-2 text-xs text-white/55">{porcentaje(l.porcentaje)}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
