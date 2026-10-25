import Link from "next/link";
import { redirect } from "next/navigation";
import { DISPLAY, ENLACE, EtiquetaPortal } from "@/components/portal/portal-ui";
import { ImagenProgresiva } from "@/components/common/imagen-progresiva";
import { accesoActual } from "@/lib/landing/auth";
import { portalesDisponibles } from "@/lib/portal/contexto";
import { cn } from "@/utils/cn";

export const dynamic = "force-dynamic";

/**
 * Entrada al portal. Un usuario con una sola marca va directo a ella; quien
 * opera varias (Santiago con Pilar Sousa y Aida Qui) elige cuál ver, cada una
 * con su portada. El equipo con permiso de portales ve todas.
 */
export default async function PortalInicio() {
  const acceso = await accesoActual();
  const portales = await portalesDisponibles();
  // Alguien del equipo con permiso de portales (el owner siempre): ve todas las marcas.
  const interno = !acceso.esCliente;

  if (!interno && portales.length === 1) redirect(`/portal/${portales[0].slug}`);

  return (
    <div className="pt-6 sm:pt-10">
      <EtiquetaPortal>{interno ? "Vista interna" : "Bienvenido"}</EtiquetaPortal>
      <h1 className={cn(DISPLAY, "mt-4 text-[clamp(2rem,6vw,3.5rem)] leading-[0.95] text-white")}>
        {interno ? "Portales de clientes" : "Elige la marca"}
      </h1>
      <p className="mt-3 max-w-xl text-sm text-white/60 sm:text-base">
        {interno
          ? "Todos los clientes con portal, como los ve cada uno."
          : "Tienes acceso a más de una marca. Entra a la que quieras ver; después cambias con «Cambiar de marca», arriba."}
      </p>

      {portales.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
          <p className="font-bold text-white">
            {interno ? "Ningún cliente tiene portal todavía" : "Tu acceso todavía no está listo"}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {interno
              ? "Se habilita desde la ficha del cliente."
              : "Si recibiste una invitación hace poco, recarga la página en unos minutos."}
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {portales.map((p, i) => (
            <li key={p.slug}>
              <Link
                href={`/portal/${p.slug}`}
                style={{ "--retraso": `${0.1 + i * 0.06}s` } as React.CSSProperties}
                className={cn(
                  "portal-entrar group relative flex aspect-8/3 items-end overflow-hidden rounded-3xl p-5 ring-1 ring-white/10 outline-none sm:p-6",
                  "transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:ring-primary-500/40 focus-visible:ring-4 focus-visible:ring-primary-500/50",
                  p.portada ? "bg-neutral-800" : "bg-[#444446]",
                )}
              >
                {p.portada ? (
                  <>
                    <ImagenProgresiva src={p.portada} className="absolute inset-0 h-full w-full object-cover" />
                    <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
                  </>
                ) : null}
                <span className="relative flex w-full items-end justify-between gap-3">
                  <span className={cn(DISPLAY, "text-2xl leading-none text-white sm:text-3xl")}>{p.nombre}</span>
                  <span className={cn(ENLACE, "shrink-0 text-sm")}>
                    Entrar <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
