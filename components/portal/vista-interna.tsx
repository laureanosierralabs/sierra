/** Aviso para el owner mirando el portal como el cliente. Fijo en una esquina: no tapa la portada. */
export function AvisoVistaInterna() {
  return (
    <p className="fixed right-4 bottom-4 z-40 rounded-full border border-badge-warning-text/40 bg-neutral-900/90 px-3.5 py-2 text-xs font-medium text-badge-warning-text shadow-lg backdrop-blur print:hidden">
      Vista interna: así lo ve el cliente
    </p>
  );
}
