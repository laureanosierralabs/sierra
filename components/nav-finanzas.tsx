"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";

/**
 * Link directo a las finanzas personales. Las del negocio viven dentro de
 * su unidad (Landing Pages), así que acá no hay nada que desplegar.
 */
export function NavFinanzas() {
  const pathname = usePathname();
  const activo = pathname.startsWith("/finanzas");

  return (
    <Link
      href="/finanzas/personal"
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-2 hover:text-text ${
        activo ? "bg-surface-2 text-text" : "text-text-2"
      }`}
    >
      <Wallet className="size-4" />
      Finanzas
    </Link>
  );
}
