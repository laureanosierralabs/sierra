import Link from "next/link";
import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { EmptyState } from "@/components/common/empty-state";
import { Card } from "@/components/tailgrids/core/card";
import { accesoActual } from "@/lib/landing/auth";
import { supabaseAdmin } from "@/lib/landing/supabase";
import { organizacionesDelUsuario, type OrgPortal } from "@/lib/portal/contexto";

export const dynamic = "force-dynamic";

/** Organizaciones vinculadas a un cliente, para la vista interna del owner. */
async function organizacionesVinculadas(): Promise<OrgPortal[]> {
  const { data } = await supabaseAdmin().from("client_orgs").select("clerk_org_id");
  const vinculadas = new Set((data ?? []).map((v) => v.clerk_org_id as string));
  if (vinculadas.size === 0) return [];

  const clerk = await clerkClient();
  const { data: orgs } = await clerk.organizations.getOrganizationList({ limit: 100 });
  return orgs
    .filter((o) => vinculadas.has(o.id) && o.slug)
    .map((o) => ({ id: o.id, slug: o.slug as string, nombre: o.name }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/**
 * Entrada al portal. Un usuario con un solo cliente va directo a él; quien
 * maneja varias marcas (un growth operator) elige. El owner ve todos.
 */
export default async function PortalInicio() {
  const acceso = await accesoActual();
  const orgs = acceso.esOwner ? await organizacionesVinculadas() : await organizacionesDelUsuario();

  if (!acceso.esOwner && orgs.length === 1) redirect(`/portal/${orgs[0].slug}`);

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold text-text-primary">Portal de clientes</h1>
      <p className="mb-6 text-sm text-text-tertiary">
        {acceso.esOwner ? "Vista interna: todos los clientes con portal." : "Elegí la marca que querés ver."}
      </p>

      {orgs.length === 0 ? (
        <EmptyState
          title={acceso.esOwner ? "Ningún cliente tiene portal todavía" : "Tu acceso todavía no está listo"}
          description={
            acceso.esOwner
              ? "Se habilita desde la ficha del cliente."
              : "Si recibiste una invitación hace poco, recargá la página en unos minutos."
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-card-border">
            {orgs.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/portal/${o.slug}`}
                  className="block px-5 py-3.5 text-sm font-medium text-text-primary transition-colors hover:bg-background-gray-secondary"
                >
                  {o.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
