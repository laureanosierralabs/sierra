"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

export interface Miga {
  href: string;
  label: string;
}

/*
 * Las migas viven en el header (layout) y solo conocen la URL. Una página de
 * detalle puede contarles los nombres reales (el cliente, el lanzamiento) con
 * <MigasDetalle>: esos tramos reemplazan al último tramo genérico ("Cliente").
 * Se guardan junto a la ruta, así nunca se muestran en otra página.
 */
let actual: { path: string; tramos: Miga[] } | null = null;
const oyentes = new Set<() => void>();

function publicar(valor: typeof actual) {
  actual = valor;
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

/** Tramos que reemplazan al último de la ruta actual, o null si la página no los dio. */
export function useMigasDetalle(pathname: string): Miga[] | null {
  const valor = useSyncExternalStore(
    suscribir,
    () => actual,
    () => null,
  );
  return valor && valor.path === pathname ? valor.tramos : null;
}

export function MigasDetalle({ tramos }: { tramos: Miga[] }) {
  const pathname = usePathname();
  const clave = JSON.stringify(tramos);

  useEffect(() => {
    publicar({ path: pathname, tramos: JSON.parse(clave) as Miga[] });
    return () => {
      if (actual?.path === pathname) publicar(null);
    };
  }, [pathname, clave]);

  return null;
}
