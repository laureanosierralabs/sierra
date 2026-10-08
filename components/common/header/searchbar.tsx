"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search1 } from "@tailgrids/icons";
import { NavIcon } from "@/components/common/sidebar/nav-icon";
import type { NavLeaf } from "@/components/common/sidebar/data";
import { InputGroup, InputGroupAddon } from "@/components/tailgrids/core/input-group";

const KBD = "rounded-md border border-card-border bg-background-gray-primary/50 px-2 py-0.75 text-xs text-text-tertiary";
const KBD_KEY = "rounded border border-card-border bg-card-background px-1.5 py-0.5 font-mono text-[10px] shadow-xs";

/** Paleta de comandos (Ctrl/Cmd+K) sobre las rutas que el usuario puede ver. */
export function SearchBar({ leaves }: { leaves: NavLeaf[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const bySection = useMemo(() => {
    const map = new Map<string, NavLeaf[]>();
    for (const leaf of leaves) {
      map.set(leaf.section, [...(map.get(leaf.section) ?? []), leaf]);
    }
    return [...map.entries()];
  }, [leaves]);

  function handleSelect(leaf: NavLeaf) {
    setOpen(false);
    if (leaf.external) {
      window.open(leaf.url, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(leaf.url);
  }

  return (
    <>
      {/* Disparador compacto (< xl) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center rounded-lg border border-card-border bg-card-background text-icon-primary shadow-xs transition-colors outline-none hover:bg-background-gray-primary focus-visible:border-input-primary-focus-border focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 xl:hidden"
        aria-label="Buscar páginas"
      >
        <Search1 className="size-4.5" />
      </button>

      {/* Disparador completo (xl+) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Buscar páginas"
        overlayClassName="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        contentClassName="fixed top-1/2 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-card-border bg-card-background text-text-primary shadow-lg outline-none max-sm:max-w-[calc(100%-2rem)]"
      >
        <div className="border-b border-card-border p-3.5">
          <InputGroup className="h-10">
            <InputGroupAddon align="inline-start" className="pr-0 text-icon-tertiary">
              <Search1 className="size-4.5" />
            </InputGroupAddon>
            <Command.Input
              placeholder="Buscar páginas..."
              className="w-full min-w-0 flex-1 border-none bg-transparent pl-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:ring-0 focus:outline-none"
            />
            <InputGroupAddon align="inline-end">
              <span className={KBD}>ESC</span>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <Command.List className="max-h-96 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-text-tertiary">
            No se encontraron páginas.
          </Command.Empty>

          {bySection.map(([section, items]) => (
            <Command.Group
              key={section}
              heading={section}
              className="py-1.5 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-text-tertiary **:[[cmdk-group-heading]]:uppercase"
            >
              {items.map((leaf) => (
                <Command.Item
                  key={leaf.id}
                  value={`${leaf.section} ${leaf.parentTitle ?? ""} ${leaf.title} ${leaf.url}`}
                  onSelect={() => handleSelect(leaf)}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-background-gray-primary data-[selected=true]:bg-background-gray-primary data-[selected=true]:text-text-primary"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center text-icon-secondary">
                      <NavIcon name={leaf.icon} />
                    </span>
                    <div className="flex items-center gap-1.5 truncate">
                      {leaf.parentTitle && (
                        <span className="truncate font-normal text-text-tertiary">
                          {leaf.parentTitle} /
                        </span>
                      )}
                      <span className="truncate text-text-primary">{leaf.title}</span>
                    </div>
                  </div>
                  <span className="hidden shrink-0 text-xs text-text-tertiary sm:inline">
                    {leaf.external ? "Externo" : leaf.url}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>

        <div className="flex items-center justify-between border-t border-card-border bg-background-gray-primary/40 px-4 py-2.5 text-xs text-text-tertiary">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className={KBD_KEY}>↑</kbd>
              <kbd className={KBD_KEY}>↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className={KBD_KEY}>↵</kbd>
              <span>Abrir</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className={KBD_KEY}>ESC</kbd>
            <span>Cerrar</span>
          </span>
        </div>
      </Command.Dialog>
    </>
  );
}
