"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Building2,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderKanban,
  LayoutGrid,
  ListChecks,
  Rocket,
  Sparkles,
  UserCircle,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NavFinanzas } from "@/components/nav-finanzas";
import { DEFINICIONES, type Unidad } from "@/lib/unidades";

const ICONOS: Record<string, LucideIcon> = {
  LayoutGrid,
  FolderKanban,
  ListChecks,
  Users,
  FileText,
  UserCog,
};

const ICONO_UNIDAD: Record<Unidad, LucideIcon> = {
  "landing-pages": Rocket,
  "marca-personal": UserCircle,
  "synous-ai": Sparkles,
  "wonder-digital": Building2,
};

/** Unidades con logo propio en vez de ícono de lucide. */
const LOGO_UNIDAD: Partial<Record<Unidad, string>> = {
  "synous-ai": "/logo-synous.png",
};

const FILA =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-2 hover:text-text";
const SUBFILA =
  "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-surface-2 hover:text-text";

function activo(pathname: string, href: string, exacto: boolean) {
  return exacto ? pathname === href : pathname.startsWith(`${href}/`);
}

/** Secciones de una unidad, sin el nivel de agrupación. */
function Secciones({
  unidad,
  pathname,
  esOwner,
  className = "",
}: {
  unidad: Unidad;
  pathname: string;
  esOwner: boolean;
  className?: string;
}) {
  const secciones = (DEFINICIONES[unidad].secciones ?? []).filter(
    (s) => esOwner || !s.owner,
  );
  const base = DEFINICIONES[unidad].href;

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {secciones.map(({ href, label, icono }) => {
        const Icon = ICONOS[icono] ?? LayoutGrid;
        const esInicio = href === base;
        const marcado = activo(pathname, href, esInicio) || pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={`${SUBFILA} ${marcado ? "bg-surface-2 text-text" : "text-text-2"}`}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function UnidadColapsable({
  unidad,
  pathname,
  esOwner,
}: {
  unidad: Unidad;
  pathname: string;
  esOwner: boolean;
}) {
  const def = DEFINICIONES[unidad];
  const dentro = pathname.startsWith(def.href);
  const [abierto, setAbierto] = useState(dentro);

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`${FILA} w-full justify-between font-medium text-text-2`}
      >
        <span className="flex items-center gap-2.5">
          <IconoUnidad unidad={unidad} />
          {def.nombre}
        </span>
        <ChevronDown
          className={`size-3.5 transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <Secciones
          unidad={unidad}
          pathname={pathname}
          esOwner={esOwner}
          className="mt-0.5 pl-3"
        />
      )}
    </div>
  );
}

function IconoUnidad({ unidad }: { unidad: Unidad }) {
  const logo = LOGO_UNIDAD[unidad];
  if (logo) {
    return (
      <Image
        src={logo}
        alt=""
        width={16}
        height={16}
        className="shrink-0 rounded-sm"
      />
    );
  }
  const Icon = ICONO_UNIDAD[unidad];
  return <Icon className="size-4" />;
}

function LinkUnidad({ unidad, pathname }: { unidad: Unidad; pathname: string }) {
  const def = DEFINICIONES[unidad];

  if (def.externa) {
    return (
      <a
        href={def.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${FILA} justify-between text-text-2`}
      >
        <span className="flex items-center gap-2.5">
          <IconoUnidad unidad={unidad} />
          {def.nombre}
        </span>
        <ExternalLink className="size-3.5 text-text-3" />
      </a>
    );
  }

  const marcado = pathname === def.href || pathname.startsWith(`${def.href}/`);
  return (
    <Link
      href={def.href}
      className={`${FILA} ${marcado ? "bg-surface-2 text-text" : "text-text-2"}`}
    >
      <IconoUnidad unidad={unidad} />
      {def.nombre}
    </Link>
  );
}

/**
 * Navegación según el acceso del usuario. Un member con una sola unidad la ve
 * plana: sin el nivel de agrupación, porque no hay nada entre qué elegir.
 */
export function SidebarNav({
  esOwner,
  unidades,
}: {
  esOwner: boolean;
  unidades: Unidad[];
}) {
  const pathname = usePathname();

  if (!esOwner && unidades.length === 1) {
    return (
      <Secciones
        unidad={unidades[0]}
        pathname={pathname}
        esOwner={esOwner}
      />
    );
  }

  const visibles: Unidad[] = esOwner
    ? ["landing-pages", "marca-personal", "synous-ai"]
    : unidades;

  return (
    <div className="flex flex-col gap-1">
      {esOwner && (
        <>
          <Link
            href="/"
            className={`${FILA} font-medium ${pathname === "/" ? "bg-surface-2 text-text" : "text-text-2"}`}
          >
            <LayoutGrid className="size-4" />
            Inicio
          </Link>
          <NavFinanzas />
        </>
      )}

      {visibles.map((u) =>
        DEFINICIONES[u].secciones ? (
          <UnidadColapsable
            key={u}
            unidad={u}
            pathname={pathname}
            esOwner={esOwner}
          />
        ) : (
          <LinkUnidad key={u} unidad={u} pathname={pathname} />
        ),
      )}
    </div>
  );
}
