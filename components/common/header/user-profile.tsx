"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronDown, Exit, Gear1 } from "@tailgrids/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/tailgrids/core/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSection,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/tailgrids/core/dropdown";

export function UserProfileButton() {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const nombre = user?.fullName?.trim() || email || "Cuenta";
  const imagen = user?.imageUrl;
  const inicial = nombre.charAt(0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menú de cuenta"
        className="group flex items-center gap-2.5 rounded-lg border-0 p-0 transition-all outline-none focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 focus-visible:ring-offset-1"
      >
        <Avatar>
          {imagen && <AvatarImage src={imagen} alt="" className="size-10 rounded-lg" />}
          <AvatarFallback className="rounded-lg border border-border-secondary-alt bg-background-gray-secondary_alt">
            {inicial}
          </AvatarFallback>
        </Avatar>

        <span className="hidden max-w-40 truncate text-sm leading-5 font-medium text-text-primary xl:block">
          {nombre}
        </span>

        <ChevronDown className="hidden size-4 text-icon-tertiary transition-transform duration-200 group-aria-expanded:-rotate-180 xl:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent placement="bottom end" className="w-70 overflow-hidden p-0 shadow-lg">
        <DropdownMenuHeader className="flex w-full items-center justify-start gap-2 border-b border-border-secondary-alt px-4 py-3">
          <Avatar size="md">
            {imagen && <AvatarImage src={imagen} alt="" />}
            <AvatarFallback className="border border-border-secondary-alt bg-background-gray-secondary_alt">
              {inicial}
            </AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-text-primary">{nombre}</span>
            {email && email !== nombre && (
              <span className="truncate text-xs text-text-tertiary">{email}</span>
            )}
          </span>
        </DropdownMenuHeader>

        <DropdownMenuSection className="p-1.5">
          <DropdownMenuItem
            onAction={() => openUserProfile()}
            className="cursor-pointer px-3 py-2.5"
          >
            <span className="shrink-0 text-icon-secondary group-hover:text-text-primary">
              <Gear1 className="size-4.5" />
            </span>
            <span className="leading-5 font-medium">Administrar cuenta</span>
          </DropdownMenuItem>
        </DropdownMenuSection>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onAction={() => signOut({ redirectUrl: "/sign-in" })}
          className="m-1.5 w-auto cursor-pointer px-3 py-2.5"
        >
          <span className="text-icon-secondary group-hover:text-text-primary">
            <Exit className="size-4.5" />
          </span>
          <span className="leading-5">Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
