import { useSyncExternalStore } from "react";

export type VistaProyectos = "cards" | "tabla";

const CLAVE = "landing:vista-proyectos";
const oyentes = new Set<() => void>();

function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => {
    oyentes.delete(cb);
  };
}

function leerGuardada(): VistaProyectos {
  try {
    return localStorage.getItem(CLAVE) === "tabla" ? "tabla" : "cards";
  } catch {
    return "cards";
  }
}

export function elegirVista(v: VistaProyectos) {
  try {
    localStorage.setItem(CLAVE, v);
  } catch {
    // Modo privado o storage bloqueado: la vista igual funciona.
  }
  oyentes.forEach((cb) => cb());
}

/**
 * Vista elegida (cards o tabla), persistida en localStorage. El servidor no
 * tiene storage: renderiza "cards" y el cliente corrige al hidratar.
 */
export function useVistaGuardada(): VistaProyectos {
  return useSyncExternalStore(suscribir, leerGuardada, () => "cards" as const);
}
