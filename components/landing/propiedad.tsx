/** Fila de propiedades: ícono + etiqueta a la izquierda, valor a la derecha. */
export function Propiedad({
  icono: Icono,
  label,
  children,
}: {
  icono: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="flex w-36 shrink-0 items-center gap-2 text-xs text-text-tertiary">
        <Icono className="size-4" />
        {label}
      </span>
      <div className="min-w-0 flex-1 text-sm text-text-primary">{children}</div>
    </div>
  );
}
