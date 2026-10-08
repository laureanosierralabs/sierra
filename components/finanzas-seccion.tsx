/** Sección de Finanzas: título con resumen a un lado y la acción (alta, filtro) al otro. */
export function FinanzasSeccion({
  titulo,
  resumen,
  accion,
  children,
}: {
  titulo: string;
  /** Texto chico junto al título (cantidad, total comprometido). */
  resumen?: React.ReactNode;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-title-50">
          {titulo}
          {resumen && (
            <span className="ml-2 text-sm font-normal text-text-tertiary tabular-nums">
              {resumen}
            </span>
          )}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}
