"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExpandArrowTopRightSquare1 } from "@tailgrids/icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/tailgrids/core/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tailgrids/core/tooltip";
import { cn } from "@/utils/cn";
import type { NavEntry } from "./data";
import { NavIcon } from "./nav-icon";
import { hasActiveChild, isChildActive, isEntryActive } from "./utils";

const ROW =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const ROW_IDLE =
  "text-text-secondary hover:bg-sidebar-navigation-nav-item-nav-hover-background hover:text-text-primary";
const ROW_ACTIVE = "bg-sidebar-navigation-nav-item-nav-hover-background text-text-primary";

interface NavItemProps {
  entry: NavEntry;
  collapsed?: boolean;
  onItemClick?: () => void;
}

export function NavItem({ entry, collapsed, onItemClick }: NavItemProps) {
  const pathname = usePathname();
  const active = isEntryActive(entry, pathname);
  const childActive = hasActiveChild(entry, pathname);
  const hasChildren = (entry.items?.length ?? 0) > 0;

  // Colapsado: solo ícono. Un grupo lleva a su primera sección.
  if (collapsed) {
    const href = entry.url ?? entry.items?.[0]?.url ?? "#";
    const className = cn(
      "flex items-center justify-center rounded-lg px-3 py-2.5",
      active || childActive
        ? "bg-sidebar-navigation-nav-item-nav-hover-background text-icon-primary"
        : "text-icon-tertiary transition-colors duration-200 hover:bg-sidebar-navigation-nav-item-nav-hover-background hover:text-icon-primary",
    );

    return (
      <div className="flex justify-center">
        <Tooltip placement="right">
          <TooltipTrigger asChild>
            {entry.external ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={entry.title}
                className={className}
              >
                <NavIcon name={entry.icon} />
              </a>
            ) : (
              <Link
                href={href}
                onClick={onItemClick}
                aria-label={entry.title}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                <NavIcon name={entry.icon} />
              </Link>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>{entry.title}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  if (hasChildren) {
    return (
      <Collapsible id={entry.id} className="max-w-none border-none bg-transparent data-expanded:pb-0!">
        <CollapsibleTrigger
          className={cn(
            "group/collapsible justify-between gap-3 rounded-lg border-none bg-transparent px-3 py-2 text-sm font-medium sm:p-0 sm:px-3 sm:py-2",
            childActive
              ? "bg-sidebar-navigation-nav-item-nav-hover-background text-text-primary"
              : "text-text-secondary transition-colors duration-200 hover:bg-sidebar-navigation-nav-item-nav-hover-background hover:text-text-primary",
          )}
        >
          <span className="flex flex-1 items-center gap-3">
            <span
              className={cn(
                "flex shrink-0",
                childActive
                  ? "text-icon-primary"
                  : "text-icon-tertiary transition-colors duration-200 group-hover/collapsible:text-icon-primary",
              )}
            >
              <NavIcon name={entry.icon} />
            </span>
            <span>{entry.title}</span>
          </span>

          <ChevronDown className="size-4 text-icon-tertiary duration-200 group-data-expanded:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-1 pr-0 group-data-expanded:mt-2">
          {entry.items?.map((child) => (
            <Link
              key={child.url}
              href={child.url}
              onClick={onItemClick}
              aria-current={isChildActive(child, pathname) ? "page" : undefined}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isChildActive(child, pathname) ? ROW_ACTIVE : ROW_IDLE,
              )}
            >
              {child.title}
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (!entry.url) return null;

  if (entry.external) {
    return (
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(ROW, "justify-between", ROW_IDLE)}
      >
        <span className="flex items-center gap-3">
          <span className="flex shrink-0 text-icon-tertiary">
            <NavIcon name={entry.icon} />
          </span>
          <span>{entry.title}</span>
        </span>
        <ExpandArrowTopRightSquare1 className="size-4 text-icon-tertiary" aria-hidden />
      </a>
    );
  }

  return (
    <Link
      href={entry.url}
      onClick={onItemClick}
      aria-current={active ? "page" : undefined}
      className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}
    >
      <span className="flex shrink-0 text-icon-tertiary">
        <NavIcon name={entry.icon} />
      </span>
      <span>{entry.title}</span>
    </Link>
  );
}
