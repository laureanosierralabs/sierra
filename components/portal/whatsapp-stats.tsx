import { numero, porcentaje, TARJETA } from "@/components/portal/resultados/formato";
import { cn } from "@/utils/cn";

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota: string }) {
  return (
    <div className={cn(TARJETA, "p-4 sm:p-5")}>
      <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase">{etiqueta}</h3>
      <p className="mt-2 text-3xl font-extrabold tracking-tighter tabular-nums">{valor}</p>
      <p className="mt-1 text-xs leading-snug text-white/55">{nota}</p>
    </div>
  );
}

/**
 * Cabecera de la pestaña WhatsApp: cuántos registrados hicieron clic para
 * entrar al grupo y cómo van los grupos cargados. Todo sale de datos medidos;
 * si no se pudieron leer los clics, la tarjeta lo dice en vez de mostrar un 0.
 */
export function EstadisticasWhatsapp({
  clics,
  grupos,
}: {
  /** null = los clics no se pudieron leer. */
  clics: { registrados: number; entraron: number; porcentaje: number | null } | null;
  /** null = los grupos no se pudieron leer. */
  grupos: { cargados: number; llenos: number; libres: number; enviadas: number } | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      <Dato
        etiqueta="Entraron al grupo"
        valor={clics ? `${numero(clics.entraron)} de ${numero(clics.registrados)}` : "—"}
        nota={
          clics
            ? `${porcentaje(clics.porcentaje)} de las personas registradas hizo clic para entrar.`
            : "Aún no hay clics medidos al grupo."
        }
      />
      <Dato
        etiqueta="Enviadas a los grupos"
        valor={grupos ? numero(grupos.enviadas) : "—"}
        nota="Personas a las que el link fijo mandó a un grupo."
      />
      <Dato
        etiqueta="Grupos cargados"
        valor={grupos ? numero(grupos.cargados) : "—"}
        nota={
          !grupos
            ? "No se pudieron leer los grupos."
            : grupos.cargados === 0
              ? "Carga los links abajo para empezar a repartir gente."
              : `${numero(grupos.libres)} con lugar disponible.`
        }
      />
      <Dato
        etiqueta="Grupos llenos"
        valor={grupos && grupos.cargados > 0 ? `${numero(grupos.llenos)} de ${numero(grupos.cargados)}` : "—"}
        nota="Cuando uno se llena, el link pasa solo al siguiente."
      />
    </div>
  );
}
