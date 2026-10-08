import Link from "next/link";
import { ArrowRight } from "@tailgrids/icons";
import type { ColumnDef } from "@tanstack/react-table";
import { BorrarCliente } from "@/components/landing/borrar";
import { ClienteForm } from "@/components/landing/cliente-form";
import { EnlaceExterno } from "@/components/landing/enlace-boton";
import { EstadoSelect } from "@/components/landing/estado-select";
import {
  ESTADOS_CLIENTE,
  LABEL_ORIGEN,
  urlInstagram,
  urlWhatsapp,
  type Cliente,
} from "@/lib/landing/tipos";

const SIN_DATO = <span className="text-text-tertiary">—</span>;

/** Teléfono o usuario: enlace externo si se puede armar la URL, texto plano si no. */
function Contacto({ valor, href }: { valor: string | null; href: string | null }) {
  if (!valor) return SIN_DATO;
  return href ? <EnlaceExterno href={href}>{valor}</EnlaceExterno> : <>{valor}</>;
}

/** Nombre, Empresa, Estado, Origen, WhatsApp, Instagram. */
export function crearColumnasClientes(): ColumnDef<Cliente>[] {
  return [
    {
      id: "name",
      header: "Nombre",
      accessorFn: (c) => c.name,
      cell: ({ row }) => (
        <Link
          href={`/landing-pages/clients/${row.original.id}`}
          className="font-medium text-text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "company",
      header: "Empresa",
      accessorFn: (c) => c.company ?? "",
      cell: ({ getValue }) => getValue<string>() || SIN_DATO,
    },
    {
      id: "status",
      header: "Estado",
      accessorFn: (c) => c.status,
      // Ordena por la posición en la lista de estados, no alfabéticamente.
      sortingFn: (a, b) =>
        ESTADOS_CLIENTE.indexOf(a.original.status) - ESTADOS_CLIENTE.indexOf(b.original.status),
      cell: ({ row }) => (
        <EstadoSelect id={row.original.id} valor={row.original.status} tipo="cliente" />
      ),
    },
    {
      id: "source",
      header: "Origen",
      accessorFn: (c) => (c.source ? LABEL_ORIGEN[c.source] : ""),
      cell: ({ row }) => {
        const { source, source_detail } = row.original;
        if (!source) return SIN_DATO;
        return (
          <span className="text-xs text-text-secondary">
            {LABEL_ORIGEN[source]}
            {source_detail && <span className="text-text-tertiary"> · {source_detail}</span>}
          </span>
        );
      },
    },
    {
      id: "phone",
      header: "WhatsApp",
      accessorFn: (c) => c.phone ?? "",
      cell: ({ row }) => (
        <Contacto valor={row.original.phone} href={urlWhatsapp(row.original.phone)} />
      ),
    },
    {
      id: "instagram",
      header: "Instagram",
      accessorFn: (c) => c.instagram ?? "",
      cell: ({ row }) => (
        <Contacto valor={row.original.instagram} href={urlInstagram(row.original.instagram)} />
      ),
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex items-center justify-end gap-3">
          <Link
            href={`/landing-pages/clients/${row.original.id}`}
            aria-label="Ver ficha"
            title="Ver ficha"
            className="rounded text-text-tertiary transition-colors outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-4"
          >
            <ArrowRight />
          </Link>
          <ClienteForm cliente={row.original} />
          <BorrarCliente id={row.original.id} />
        </span>
      ),
    },
  ];
}
