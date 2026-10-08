"use client";

import { MenuHamburger1 } from "@tailgrids/icons";
import { AppBreadcrumbs } from "@/components/common/app-breadcrumbs";
import type { NavLeaf } from "@/components/common/sidebar/data";
import { SearchBar } from "./searchbar";
import { ThemeToggle } from "./theme-toggle";
import { UserProfileButton } from "./user-profile";

interface HeaderProps {
  leaves: NavLeaf[];
  esOwner: boolean;
  onMenuClick: () => void;
}

export function Header({ leaves, esOwner, onMenuClick }: HeaderProps) {
  return (
    <header className="w-full shrink-0 border-b-[0.5px] border-card-border bg-card-surface-area px-2 py-4 lg:px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="rounded-md px-1.5 py-1 text-icon-tertiary transition-colors hover:text-text-primary xl:hidden"
        >
          <MenuHamburger1 className="size-5" />
        </button>

        <div className="hidden min-w-0 flex-1 sm:block">
          <AppBreadcrumbs esOwner={esOwner} />
        </div>

        <div className="ml-auto flex items-center gap-2.5 sm:ml-0">
          <div className="xl:w-72">
            <SearchBar leaves={leaves} />
          </div>
          <ThemeToggle />
          <UserProfileButton />
        </div>
      </div>
    </header>
  );
}
