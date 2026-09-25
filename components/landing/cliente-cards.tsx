"use client";

import Link from "next/link";
import { ArrowRight, AtSign, Building2, Phone } from "lucide-react";
import { EstadoClientePill } from "@/components/landing/ui";
import { ClienteForm } from "@/components/landing/cliente-form";
import { BorrarCliente } from "@/components/landing/borrar";
import {
  LABEL_ORIGEN,
  urlInstagram,
  urlWhatsapp,
  type Cliente,
} from "@/lib/landing/tipos";

function Iniciales({ nombre }: { nombre: string }) {
  const letras = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-idle-dim text-xs font-bold text-idle">
      {letras || "?"}
    </span>
  );
}

export function ClienteCards({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-surface px-4 py-10 text-center text-sm text-text-3">
        Sin contactos.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clientes.map((c) => {
        const wa = urlWhatsapp(c.phone);
        const ig = urlInstagram(c.instagram);

        return (
          <div
            key={c.id}
            className="flex flex-col rounded-xl border border-line bg-surface p-3 transition-colors hover:border-line-strong"
          >
            <div className="flex items-start gap-2.5">
              <Iniciales nombre={c.name} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/landing-pages/clients/${c.id}`}
                  className="block truncate font-display text-sm font-bold hover:underline"
                >
                  {c.name}
                </Link>
                {c.company && (
                  <p className="flex items-center gap-1 truncate text-xs text-text-3">
                    <Building2 className="size-3 shrink-0" />
                    {c.company}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <EstadoClientePill estado={c.status} />
              {c.source && (
                <span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[0.625rem] text-text-2">
                  {LABEL_ORIGEN[c.source]}
                </span>
              )}
            </div>

            {(wa || ig) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[0.6875rem] text-text-2 transition-colors hover:border-line-strong hover:text-text"
                  >
                    <Phone className="size-3" />
                    WhatsApp
                  </a>
                )}
                {ig && (
                  <a
                    href={ig}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[0.6875rem] text-text-2 transition-colors hover:border-line-strong hover:text-text"
                  >
                    <AtSign className="size-3" />
                    Instagram
                  </a>
                )}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5 mt-3">
              <Link
                href={`/landing-pages/clients/${c.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-text-2 transition-colors hover:text-text"
              >
                Ver ficha
                <ArrowRight className="size-3" />
              </Link>
              <span className="flex items-center gap-3">
                <ClienteForm cliente={c} />
                <BorrarCliente id={c.id} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
