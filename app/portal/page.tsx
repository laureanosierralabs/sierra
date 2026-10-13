import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/common/empty-state";
import { Card } from "@/components/tailgrids/core/card";
import { accesoActual } from "@/lib/landing/auth";
import { portalesDisponibles } from "@/lib/portal/contexto";

export const dynamic = "force-dynamic";

/**
 * Entrada al portal. Un usuario con un solo cliente va directo a él; quien
 * maneja varias marcas (un growth operator) elige. El owner ve todos.
 */
export default async function PortalInicio() {
  const acceso = await accesoActual();
  const portales = await portalesDisponibles();

  if (!acceso.esOwner && portales.length === 1) redirect(`/portal/${portales[0].slug}`);

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold text-text-primary">Portal de clientes</h1>
      <p className="mb-6 text-sm text-text-tertiary">
        {acceso.esOwner ? "Vista interna: todos los clientes con portal." : "Elegí la marca que querés ver."}
      </p>

      {portales.length === 0 ? (
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
            {portales.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/portal/${p.slug}`}
                  className="block px-5 py-3.5 text-sm font-medium text-text-primary transition-colors hover:bg-background-gray-secondary"
                >
                  {p.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
