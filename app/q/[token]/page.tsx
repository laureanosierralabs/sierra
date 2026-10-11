import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BotonImprimir } from "@/components/landing/boton-imprimir";
import { BarraPago, DocumentoCotizacionPublica } from "@/components/landing/cotizacion-publica";
import { obtenerCotizacionPublica } from "@/lib/landing/datos";
import { codigoCotizacion } from "@/lib/landing/tipos";

export const dynamic = "force-dynamic";

// Ruta pública (sin sesión, ver proxy.ts). Lo único que la protege es el
// token: un link revocado o inventado da 404 sin revelar si existió.
const cotizacionDe = cache((token: string) => obtenerCotizacionPublica(token));

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cotizacion = await cotizacionDe((await params).token);
  return {
    // También es el nombre sugerido al guardar el PDF.
    title: cotizacion
      ? `Cotización ${codigoCotizacion(cotizacion.numero)}${cotizacion.cliente ? ` · ${cotizacion.cliente}` : ""}`
      : "Cotización",
    robots: { index: false, follow: false },
  };
}

export default async function CotizacionPublicaPage({ params }: Props) {
  const cotizacion = await cotizacionDe((await params).token);
  if (!cotizacion) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-doc-paper text-doc-ink [print-color-adjust:exact]">
      <div className="flex justify-end px-6 pt-6 sm:px-14 print:hidden">
        <BotonImprimir />
      </div>
      <main className="flex-1">
        <DocumentoCotizacionPublica cotizacion={cotizacion} />
      </main>
      <BarraPago cotizacion={cotizacion} />
      <div className="h-5 bg-doc-band" />
    </div>
  );
}
