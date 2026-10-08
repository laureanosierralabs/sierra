"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const noopSubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme es undefined en el servidor: hasta hidratar se asume oscuro,
  // igual que antes, para que el markup del primer render coincida.
  const montado = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const tema = montado && resolvedTheme === "light" ? "light" : "dark";

  function alternar() {
    setTheme(tema === "dark" ? "light" : "dark");
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
