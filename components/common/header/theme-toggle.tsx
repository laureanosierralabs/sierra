"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MoonHalfLeft5, Sun1 } from "@tailgrids/icons";
import { Button } from "@/components/tailgrids/core/button";

const noopSubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme es undefined hasta hidratar: se asume claro para que el
  // primer render coincida con el del servidor. Con "system" resolvedTheme ya
  // trae el valor real, a diferencia de `theme`.
  const montado = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const oscuro = montado && resolvedTheme === "dark";

  return (
    <Button
      iconOnly
      appearance="outline"
      onClick={() => setTheme(oscuro ? "light" : "dark")}
      aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="size-10 rounded-lg border border-card-border bg-card-background text-icon-primary shadow-xs outline-none focus-visible:border-input-primary-focus-border focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20"
    >
      {oscuro ? <Sun1 className="size-4.5" /> : <MoonHalfLeft5 className="size-4.5" />}
    </Button>
  );
}
