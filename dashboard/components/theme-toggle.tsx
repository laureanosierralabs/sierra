"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "light" | "dark";

function leerTema(): Tema {
  const guardado = localStorage.getItem("tema") as Tema | null;
  return (
    guardado ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

const oyentes = new Set<() => void>();

function suscribir(cb: () => void) {
  oyentes.add(cb);
  return () => {
    oyentes.delete(cb);
  };
}

export function ThemeToggle() {
  // El tema ya se aplicó antes del paint (script en layout.tsx). Leerlo desde
  // el DOM evita el render en cascada de setState dentro de un efecto.
  const tema = useSyncExternalStore(
    suscribir,
    leerTema,
    () => "dark" as Tema,
  );

  function setTema(valor: Tema) {
    document.documentElement.dataset.theme = valor;
    oyentes.forEach((cb) => cb());
  }

  function alternar() {
    const siguiente: Tema = tema === "dark" ? "light" : "dark";
    localStorage.setItem("tema", siguiente);
    setTema(siguiente);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={tema === "dark" ? "Tema claro" : "Tema oscuro"}
      className="shrink-0 rounded-lg p-1.5 text-text-3 transition-colors hover:bg-surface-2 hover:text-text"
    >
      {tema === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </button>
  );
}
