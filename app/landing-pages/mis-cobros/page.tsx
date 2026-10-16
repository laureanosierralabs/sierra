import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/landing/ui";
import { VistaMisCobros } from "@/components/landing/vista-mis-cobros";
import { misAcuerdos } from "@/lib/landing/mis-cobros";

export const dynamic = "force-dynamic";

/**
 * Lo que la persona del equipo cobra por su trabajo: lo acordado, lo pagado y
 * lo que falta, por acuerdo y por proyecto. Solo lo suyo (ver lib/landing/mis-cobros.ts).
 */
export default async function MisCobros() {
  const acuerdos = await misAcuerdos();

  return (
    <>
      <PageHeader titulo="Mis cobros" descripcion="Lo acordado por tu trabajo y lo que ya cobraste" />

      {acuerdos.length === 0 ? (
        <EmptyState
          title="Todavía no tenés acuerdos cargados"
          description="Cuando se registre un acuerdo a tu nombre, vas a ver acá cuánto cobrás por cada proyecto y los pagos que recibas."
        />
      ) : (
        <VistaMisCobros acuerdos={acuerdos} />
      )}
    </>
  );
}
