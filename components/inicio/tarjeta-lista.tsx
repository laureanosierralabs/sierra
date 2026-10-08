import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/tailgrids/core/card";

interface TarjetaListaProps {
  titulo: string;
  descripcion?: string;
  /** Destino de "Ver todo"; se omite si no hay una pantalla más completa. */
  verTodo?: { href: string; label: string };
  children: ReactNode;
}

/** Carcasa de las listas de Inicio: encabezado con borde y cuerpo sin padding. */
export function TarjetaLista({ titulo, descripcion, verTodo, children }: TarjetaListaProps) {
  return (
    <Card className="flex flex-col p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-medium text-text-primary">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-xs text-text-tertiary">{descripcion}</p>}
        </div>
        {verTodo && (
          <Link
            href={verTodo.href}
            className="rounded-md text-sm font-medium text-text-secondary transition-colors outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {verTodo.label} →
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}
