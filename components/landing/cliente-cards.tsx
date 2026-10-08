"use client";

import Link from "next/link";
import { ArrowRight, Buildings11, Instagram, Phone } from "@tailgrids/icons";
import { EmptyState } from "@/components/common/empty-state";
import { BorrarCliente } from "@/components/landing/borrar";
import { ClienteForm } from "@/components/landing/cliente-form";
import { EstadoClientePill } from "@/components/landing/ui";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import { LABEL_ORIGEN, urlInstagram, urlWhatsapp, type Cliente } from "@/lib/landing/tipos";

const CONTACTO =
  "inline-flex items-center gap-1 rounded-md border border-card-border px-2 py-1 text-xs text-text-secondary transition-colors outline-none hover:bg-background-gray-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-3.5";

function Iniciales({ nombre }: { nombre: string }) {
  const letras = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-badge-blue-background text-xs font-semibold text-badge-blue-text"
    >
      {letras || "?"}
    </span>
  );
}

export function ClienteCards({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return <EmptyState title="Sin contactos" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clientes.map((c) => {
        const wa = urlWhatsapp(c.phone);
        const ig = urlInstagram(c.instagram);

        return (
          <Card
            key={c.id}
            className="flex flex-col gap-3 p-4 transition-colors hover:border-primary-300"
          >
            <div className="flex items-start gap-2.5">
              <Iniciales nombre={c.name} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/landing-pages/clients/${c.id}`}
                  className="block truncate text-sm font-semibold text-text-primary hover:underline"
                >
                  {c.name}
                </Link>
                {c.company && (
                  <p className="flex items-center gap-1 truncate text-xs text-text-tertiary">
                    <Buildings11 className="size-3.5 shrink-0" />
                    {c.company}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <EstadoClientePill estado={c.status} />
              {c.source && (
                <Badge color="gray" size="sm" className="rounded-md px-1.5">
                  {LABEL_ORIGEN[c.source]}
                </Badge>
              )}
            </div>

            {(wa || ig) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className={CONTACTO}>
                    <Phone />
                    WhatsApp
                  </a>
                )}
                {ig && (
                  <a href={ig} target="_blank" rel="noopener noreferrer" className={CONTACTO}>
                    <Instagram />
                    Instagram
                  </a>
                )}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-card-border pt-3">
              <Link
                href={`/landing-pages/clients/${c.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary [&>svg]:size-3.5"
              >
                Ver ficha
                <ArrowRight />
              </Link>
              <span className="flex items-center gap-3">
                <ClienteForm cliente={c} />
                <BorrarCliente id={c.id} />
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
