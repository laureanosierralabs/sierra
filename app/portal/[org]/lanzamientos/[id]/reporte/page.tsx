import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft } from "@tailgrids/icons";
import { BotonImprimir } from "@/components/landing/boton-imprimir";
import { ReporteCierre } from "@/components/lanzamientos/reporte-cierre";
import { armarReporte } from "@/lib/lanzamientos/reporte";
import { contextoPortal } from "@/lib/portal/contexto";
import { lanzamientoPortal } from "@/lib/portal/datos";
import { pedidosDeLanzamiento } from "@/lib/pedidos/datos";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ org: string; id: string }> };

const datosDe = cache(async (org: string, id: string) => {
  const ctx = await contextoPortal(org);
  if (!ctx) return null;
  const detalle = await lanzamientoPortal(ctx, id);
  if (!detalle) return null;
  // Los pedidos son un extra: si fallan, el reporte sale igual sin esa sección.
  const pedidos = await pedidosDeLanzamiento(ctx.clientId, id).catch(() => []);
  return { ctx, detalle, reporte: armarReporte(detalle, pedidos) };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { org, id } = await params;
  const datos = await datosDe(org, id);
  // También es el nombre sugerido al guardar el PDF.
  return { title: datos ? `Reporte de cierre · ${datos.detalle.lanzamiento.name}` : "Reporte de cierre" };
}

/** Reporte de cierre del lanzamiento: la entrega final, descargable en PDF. */
export default async function ReportePortal({ params }: Props) {
  const { org, id } = await params;
  const datos = await datosDe(org, id);
  if (!datos) notFound();
  const { ctx, detalle, reporte } = datos;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/portal/${ctx.slug}/lanzamientos/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="size-4" />
          {detalle.lanzamiento.name}
        </Link>
        <BotonImprimir />
      </div>
      <div className="overflow-hidden rounded-xl border border-card-border print:rounded-none print:border-0">
        <ReporteCierre lanzamiento={detalle.lanzamiento} cliente={ctx.clienteNombre} reporte={reporte} />
      </div>
    </>
  );
}
