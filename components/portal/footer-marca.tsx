import Image from "next/image";
import { Envelope1, ExpandArrowTopRightSquare1, Instagram, Linkedin } from "@tailgrids/icons";

/** Links del footer. Cuando la marca tenga su mail propio, se cambia acá. */
const PAGINAS = [
  { etiqueta: "laureanosierra.com", href: "https://laureanosierra.com" },
  { etiqueta: "Servicio", href: "https://laureanosierra.com/servicio/" },
];

const REDES = [
  { etiqueta: "Instagram", detalle: "@laureanosierra_", href: "https://instagram.com/laureanosierra_", icono: Instagram },
  { etiqueta: "LinkedIn", detalle: "in/laureanosierra", href: "https://www.linkedin.com/in/laureanosierra", icono: Linkedin },
];

const EMAIL = "laureanosierra.labs@gmail.com";

const LINK =
  "group/link inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none";

function Columna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium tracking-[0.08em] text-white/40 uppercase">{titulo}</p>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

/**
 * Footer de marca (synx build) para las pantallas que ve el cliente: logo,
 * páginas, redes y contacto, y la marca grande de fondo. Negro y blanco, con
 * el azul de la marca solo como detalle.
 */
export function FooterMarca() {
  const anio = new Date().getFullYear();

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-white/10 print:hidden">
      {/* Línea de luz azul sobre el borde. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-3xl bg-linear-to-r from-transparent via-primary-500 to-transparent"
      />

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-14 pb-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <Image src="/synxbuild/synxbuild-white.png" alt="synx build" width={446} height={91} className="h-auto w-[132px]" />
          <p className="max-w-xs text-sm leading-relaxed text-white/50">
            Landing pages y lanzamientos, medidos de punta a punta.
          </p>
        </div>

        <Columna titulo="Páginas">
          {PAGINAS.map((p) => (
            <li key={p.href}>
              <a href={p.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                {p.etiqueta}
                <ExpandArrowTopRightSquare1 className="size-3.5 opacity-0 transition-opacity group-hover/link:opacity-100" />
              </a>
            </li>
          ))}
        </Columna>

        <Columna titulo="Redes">
          {REDES.map(({ etiqueta, detalle, href, icono: Icono }) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noopener noreferrer" className={LINK} aria-label={`${etiqueta} ${detalle}`}>
                <span className="flex size-7 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition-colors group-hover/link:bg-primary-500 group-hover/link:ring-primary-500">
                  <Icono className="size-3.5" />
                </span>
                {detalle}
              </a>
            </li>
          ))}
        </Columna>

        <Columna titulo="Contacto">
          <li>
            <a href={`mailto:${EMAIL}`} className={LINK}>
              <span className="flex size-7 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 transition-colors group-hover/link:bg-primary-500 group-hover/link:ring-primary-500">
                <Envelope1 className="size-3.5" />
              </span>
              <span className="break-all">{EMAIL}</span>
            </a>
          </li>
        </Columna>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-white/10 px-4 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>© {anio} synx build · Todos los derechos reservados</span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_2px_rgb(0_0_255/0.7)]" />
          Portal de clientes
        </span>
      </div>

      {/* La marca grande de fondo, cortada por el borde inferior. */}
      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.22em] text-center text-[clamp(4.5rem,19vw,15rem)] leading-none font-semibold tracking-[-0.06em] text-transparent select-none [background-clip:text] bg-linear-to-b from-white/10 to-white/0"
      >
        synx build
      </p>
    </footer>
  );
}
