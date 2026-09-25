"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, ChevronDown, Building2, User } from "lucide-react";

export function NavFinanzas() {
  const pathname = usePathname();
  const enFinanzas = pathname.startsWith("/finanzas");
  const [abierto, setAbierto] = useState(enFinanzas);

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
      >
        <span className="flex items-center gap-2.5">
          <Wallet className="size-4" />
          Finanzas
        </span>
        <ChevronDown
          className={`size-3.5 transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div className="mt-0.5 flex flex-col gap-0.5 pl-3">
          <SubLink
            href="/finanzas/negocio"
            activo={pathname === "/finanzas/negocio"}
            icon={<Building2 className="size-3.5" />}
          >
            Negocio
          </SubLink>
          <SubLink
            href="/finanzas/personal"
            activo={pathname === "/finanzas/personal"}
            icon={<User className="size-3.5" />}
          >
            Personal
          </SubLink>
        </div>
      )}
    </div>
  );
}

function SubLink({
  href,
  activo,
  icon,
  children,
}: {
  href: string;
  activo: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-surface-2 hover:text-text ${
        activo ? "bg-surface-2 text-text" : "text-text-2"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
