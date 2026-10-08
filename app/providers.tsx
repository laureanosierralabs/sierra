"use client";

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
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      storageKey="tema"
      disableTransitionOnChange
    >
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
