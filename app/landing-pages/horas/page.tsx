import { redirect } from "next/navigation";
import { HorasView } from "@/components/horas/horas-view";
import { listarClientes } from "@/lib/landing/datos";
import { horasVisibles } from "@/lib/horas/datos";
import { mesDe, mesValido } from "@/lib/horas/tipos";
import { diaDe } from "@/lib/lanzamientos/tipos";

export const dynamic = "force-dynamic";

/**
 * Tabla de horas del equipo. Cada uno carga día, comienzo, finalización y qué
 * hizo; las horas se suman solas. Se mira por mes, que es como se rinde la
 * planilla de Wonder, y se exporta con sus mismas columnas.
 */
export default async function Horas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const valor = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const hoy = diaDe(new Date());
  const mes = mesValido(valor("mes")) ?? hoy.slice(0, 7);
  const { desde, hasta } = mesDe(`${mes}-01`);
  const persona = valor("persona") || null;
  const cliente = valor("cliente") || null;

  const [vista, clientes] = await Promise.all([
    horasVisibles({ desde, hasta, persona, cliente }),
    listarClientes()
      .then((l) => l.map((c) => ({ id: c.id, name: c.name })))
      .catch(() => []),
  ]);
  if (!vista) redirect("/sin-acceso");

  return (
    <HorasView
      entradas={vista.entradas}
      esOwner={vista.esOwner}
      userId={vista.userId}
      personas={vista.personas}
      truncado={vista.truncado}
      tarifas={vista.tarifas}
      clientes={clientes}
      mes={mes}
      hoy={hoy}
      filtros={{ persona: vista.esOwner ? persona : null, cliente }}
    />
  );
}
