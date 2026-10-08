"use client";

import {
  Clouds,
  ColourPalette3,
  ExpandArrowTopRightSquare1,
  FileText,
  Folder1,
  Gallery,
  Globe2,
  Layout5,
  Link1AngularRight,
  Locked3,
  Megaphone1,
  Plug1,
} from "@tailgrids/icons";
import { BorrarBoton } from "@/components/landing/borrar-boton";
import { Copiar, Credencial } from "@/components/landing/credencial";
import { RecursoForm } from "@/components/landing/recurso-form";
import { Badge } from "@/components/tailgrids/core/badge";
import type { RecursoVista } from "@/lib/landing/datos";
import { borrarRecurso, borrarRecursoCliente } from "@/app/landing-pages/acciones";
import { LABEL_TIPO_RECURSO, type TipoRecurso } from "@/lib/landing/tipos";

const POR_TIPO: Record<TipoRecurso, React.ReactNode> = {
  archivo: <Folder1 />,
  diseno: <ColourPalette3 />,
  infraestructura: <Plug1 />,
  marketing: <Megaphone1 />,
  acceso: <Locked3 />,
  otro: <Link1AngularRight />,
};

/** Servicios que se reconocen por dominio; el resto cae al ícono del tipo. */
const POR_DOMINIO: { patron: RegExp; icono: React.ReactNode }[] = [
  { patron: /figma\.com/i, icono: <Layout5 /> },
  { patron: /drive\.google\.com|docs\.google\.com/i, icono: <Folder1 /> },
  { patron: /cloudflare\.com/i, icono: <Clouds /> },
  { patron: /wordpress|wp-admin/i, icono: <Globe2 /> },
  { patron: /notion\.so/i, icono: <FileText /> },
  { patron: /unsplash|cloudinary|imgur/i, icono: <Gallery /> },
];

function iconoDe(recurso: RecursoVista): React.ReactNode {
  if (recurso.url) {
    const match = POR_DOMINIO.find((d) => d.patron.test(recurso.url!));
    if (match) return match.icono;
  }
  return POR_TIPO[recurso.kind] ?? <Link1AngularRight />;
}

export function RecursoFila({
  recurso: r,
  duenoId,
  tabla,
}: {
  recurso: RecursoVista;
  duenoId: string;
  tabla: "project" | "client";
}) {
  const icono = iconoDe(r);
  const conCredenciales = Boolean(r.username || r.tieneSecreto);

  return (
    <li>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-background-gray-secondary">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-badge-neutral-background text-badge-neutral-icon-color [&>svg]:size-4"
          >
            {icono}
          </span>

          {r.url ? (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-text-primary hover:underline"
            >
              <span className="truncate">{r.name}</span>
              <ExpandArrowTopRightSquare1 className="size-3 shrink-0 text-text-tertiary" />
            </a>
          ) : (
            <span className="truncate text-sm font-medium text-text-primary">{r.name}</span>
          )}
          <Badge color="gray" size="sm" className="shrink-0">
            {LABEL_TIPO_RECURSO[r.kind]}
          </Badge>
          {conCredenciales && (
            <Locked3
              className="size-3 shrink-0 text-text-tertiary"
              aria-label="Tiene credenciales"
            />
          )}
        </span>

        <span className="flex shrink-0 items-center gap-3">
          {r.notes && (
            <span className="hidden max-w-55 truncate text-xs text-text-tertiary md:block">
              {r.notes}
            </span>
          )}
          <RecursoForm duenoId={duenoId} tabla={tabla} recurso={r} />
          <BorrarBoton
            etiqueta="Borrar recurso"
            onConfirmar={() =>
              tabla === "client"
                ? borrarRecursoCliente(r.id, duenoId)
                : borrarRecurso(r.id, duenoId)
            }
          />
        </span>
      </div>

      {conCredenciales && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-card-border bg-background-gray-secondary/50 px-4 py-2 pl-14">
          {r.username && (
            <span className="flex items-center gap-2">
              <span className="text-[0.6875rem] text-text-tertiary">Usuario</span>
              <span className="truncate font-mono text-sm text-text-primary">{r.username}</span>
              <Copiar texto={r.username} />
            </span>
          )}
          {r.tieneSecreto && (
            <span className="flex items-center gap-2">
              <span className="text-[0.6875rem] text-text-tertiary">Contraseña</span>
              <Credencial recursoId={r.id} tabla={tabla} />
            </span>
          )}
        </div>
      )}
    </li>
  );
}
