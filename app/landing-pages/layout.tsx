export default function LandingPagesLayout({
  children,
  panel,
}: {
  children: React.ReactNode;
  /** Slot para el panel lateral de tarea (ruta interceptada). */
  panel: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-[1600px] px-8 py-8">{children}</div>
      {panel}
    </>
  );
}
