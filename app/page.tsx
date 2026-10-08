import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/common/page-container";
import { InicioContenido } from "@/components/inicio/inicio-contenido";
import { InicioSkeleton } from "@/components/inicio/inicio-skeleton";
import { accesoActual } from "@/lib/landing/auth";
import { rutaInicial } from "@/lib/unidades";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const acceso = await accesoActual();
  // El proxy ya manda a los members a su unidad; esto cubre el caso en que
  // Clerk falló allá y dejó pasar la request.
  if (!acceso.esOwner) redirect(rutaInicial(acceso.esOwner, acceso.unidades));

  return (
    <PageContainer>
      <Suspense fallback={<InicioSkeleton />}>
        <InicioContenido />
      </Suspense>
    </PageContainer>
  );
}
