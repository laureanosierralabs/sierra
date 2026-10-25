"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Key } from "react-aria-components";
import { Close, MenuFriesLeft1, MenuMeatballs1 } from "@tailgrids/icons";
import { CollapsibleGroup } from "@/components/tailgrids/core/collapsible";
import { cn } from "@/utils/cn";
import type { NavSection } from "./data";
import { NavItem } from "./nav-item";
import { findActiveGroupKey } from "./utils";

interface SidebarProps {
  sections: NavSection[];
  titulo: string;
  rolLabel: string;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isMobileSheet?: boolean;
  onItemClick?: () => void;
}

export function Sidebar({
  sections,
  titulo,
  rolLabel,
  isSidebarOpen,
  toggleSidebar,
  isMobileSheet = false,
  onItemClick,
}: SidebarProps) {
  const pathname = usePathname();
  const activeGroupKey = useMemo(
    () => findActiveGroupKey(sections, pathname),
    [sections, pathname],
  );

  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(
    () => new Set<Key>(activeGroupKey ? [activeGroupKey] : []),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className={cn(
          "flex items-center px-4 pt-7 text-text-primary",
          isSidebarOpen ? "justify-between" : "flex-col justify-center gap-4",
        )}
      >
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`synx build · ${titulo}`}>
          {isSidebarOpen ? (
            <span className="flex min-w-0 flex-col items-start gap-2">
              <Image src="/synxbuild/synxbuild-blue.png" alt="synx build" width={444} height={91} priority className="logo-en-claro h-auto w-[118px]" />
              <Image src="/synxbuild/synxbuild-white.png" alt="synx build" width={446} height={91} priority className="logo-en-oscuro h-auto w-[118px]" />
              <BadgeRol rol={rolLabel} />
            </span>
          ) : (
            <Image src="/synxbuild/icono-blue.png" alt="synx build" width={91} height={91} className="size-7 shrink-0" />
          )}
        </Link>

        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "p-1.5 transition-colors",
            isMobileSheet
              ? "rounded-lg text-icon-tertiary hover:bg-background-gray-primary hover:text-text-primary"
              : "text-icon-tertiary hover:text-text-secondary",
          )}
          aria-label={isMobileSheet ? "Cerrar menú" : isSidebarOpen ? "Contraer menú" : "Expandir menú"}
          aria-expanded={isMobileSheet ? undefined : isSidebarOpen}
        >
          {isMobileSheet ? <Close className="size-4.5" /> : <MenuFriesLeft1 className="size-4.5" />}
        </button>
      </div>

      <nav
        aria-label="Principal"
        className={cn(
          "flex-1 overflow-y-auto",
          isSidebarOpen ? "mt-7 space-y-6 px-4" : "mt-5 px-2",
        )}
      >
        <CollapsibleGroup expandedKeys={expandedKeys} onExpandedChange={setExpandedKeys}>
          {sections.map((section) => (
            <div key={section.label}>
              {isSidebarOpen ? (
                <p className="mt-6 mb-4 text-xs text-text-tertiary uppercase">{section.label}</p>
              ) : (
                <span className="flex items-center justify-center pt-6 pb-4 text-icon-secondary">
                  <MenuMeatballs1 className="size-4.5" aria-hidden />
                </span>
              )}

              <div className={cn("space-y-1", !isSidebarOpen && "space-y-1.5")}>
                {section.items.map((entry) => (
                  <NavItem
                    key={entry.id}
                    entry={entry}
                    collapsed={!isSidebarOpen}
                    onItemClick={onItemClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </CollapsibleGroup>
      </nav>
    </div>
  );
}

/** El rol de quien está logueado, con un punto azul que respira (sutil). */
function BadgeRol({ rol }: { rol: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-background-gray-secondary px-2 py-0.5 text-[11px] leading-4 font-medium text-text-secondary">
      <span aria-hidden="true" className="relative flex size-1.5">
        <span className="absolute inline-flex size-full rounded-full bg-primary-500 opacity-60 motion-safe:animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <span className="relative inline-flex size-1.5 rounded-full bg-primary-500" />
      </span>
      {rol}
    </span>
  );
}
