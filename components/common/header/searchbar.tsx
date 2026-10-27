"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search1 } from "@tailgrids/icons";
import type { NavLeaf } from "@/components/common/sidebar/data";
import { InputGroup, InputGroupAddon } from "@/components/tailgrids/core/input-group";

const KBD = "rounded-md border border-card-border bg-background-gray-primary/50 px-2 py-0.75 text-xs text-text-tertiary";

/** cmdk se baja aparte, la primera vez que se abre la paleta. */
const PaletaComandos = dynamic(
  () => import("@/components/common/header/paleta-comandos").then((m) => m.PaletaComandos),
);

/** Paleta de comandos (Ctrl/Cmd+K) sobre las rutas que el usuario puede ver. */
export function SearchBar({ leaves }: { leaves: NavLeaf[] }) {
  const [open, setOpen] = useState(false);
  // Una vez abierta se queda montada, para que cierre con su transición.
  const [cargada, setCargada] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCargada(true);
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function abrir() {
    setCargada(true);
    setOpen(true);
  }

  return (
    <>
      {/* Disparador compacto (< xl) */}
      <button
        type="button"
        onClick={abrir}
        className="flex size-10 items-center justify-center rounded-lg border border-card-border bg-card-background text-icon-primary shadow-xs transition-colors outline-none hover:bg-background-gray-primary focus-visible:border-input-primary-focus-border focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 xl:hidden"
        aria-label="Buscar páginas"
      >
        <Search1 className="size-4.5" />
      </button>

      {/* Disparador completo (xl+) */}
      <button
        type="button"
        onClick={abrir}
        className="hidden w-full text-left outline-none focus:outline-none xl:block"
      >
        <InputGroup className="h-10 cursor-pointer">
          <InputGroupAddon align="inline-start" className="pr-0 text-icon-tertiary">
            <Search1 className="size-4.5" />
          </InputGroupAddon>
          <span className="flex-1 pl-2 text-sm text-text-tertiary select-none">Buscar páginas...</span>
          <InputGroupAddon align="inline-end">
            <span className={KBD}>Ctrl K</span>
          </InputGroupAddon>
        </InputGroup>
      </button>

      {cargada && <PaletaComandos leaves={leaves} open={open} onOpenChange={setOpen} />}
    </>
  );
}
