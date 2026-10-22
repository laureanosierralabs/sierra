"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  // Before mount resolvedTheme is undefined: fall back to "system" so dark users
  // don't get a light toast on first paint.
  const theme = resolvedTheme === "dark" || resolvedTheme === "light" ? resolvedTheme : "system";
  return <Toaster theme={theme} />;
}

/**
 * Providers de cliente compartidos. `storageKey="tema"` conserva la
 * preferencia que los usuarios ya tenían guardada con el script anterior.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  // El portal del cliente es siempre oscuro: es su identidad visual. Forzarlo
  // acá (y no con un data-theme en un contenedor) hace que TODOS los colores
  // del template cambien, porque varios se resuelven en la raíz de la página.
  // No pisa la preferencia guardada: el panel sigue con la de cada uno.
  const enPortal = usePathname()?.startsWith("/portal") ?? false;
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      forcedTheme={enPortal ? "dark" : undefined}
      storageKey="tema"
      disableTransitionOnChange
    >
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
