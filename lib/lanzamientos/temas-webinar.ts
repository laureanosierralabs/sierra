/**
 * Estilo de la página del link personal del webinar (/w/<token>, que el
 * cliente ve como <su landing>/vivo/<token>). Se elige por el dominio de las
 * landings del lanzamiento: así la persona ve la marca del cliente y no la
 * nuestra. Sin tema propio, la página sale con el de synx build.
 * Lógica pura.
 */
import { dominioDe } from "@/lib/lanzamientos/tipos";

export interface TemaWebinar {
  /** Nombre de la marca, chico arriba del título. Null = sin rótulo. */
  marca: string | null;
  /** Cómo llama la marca a su evento en vivo: "webinar", "seminario", "clase"… */
  evento: string;
  fondo: string;
  /** Fondo de la tarjeta. */
  tarjeta: string;
  borde: string;
  titulo: string;
  texto: string;
  /** Texto secundario. */
  suave: string;
  boton: string;
  botonHover: string;
  botonTexto: string;
  /** Fondo y borde del campo de email. */
  campo: string;
  campoBorde: string;
  foco: string;
  error: string;
  fuenteTitulo: string;
  fuenteTexto: string;
  /** Hoja de Google Fonts con las fuentes de la marca. Null = fuentes del sistema. */
  fuentesUrl: string | null;
}

const SISTEMA = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

export const TEMA_SYNX: TemaWebinar = {
  marca: null,
  evento: "webinar",
  fondo: "#0a0a0a",
  tarjeta: "transparent",
  borde: "transparent",
  titulo: "#ffffff",
  texto: "#ffffff",
  suave: "rgba(255,255,255,.65)",
  boton: "#0000ff",
  botonHover: "#5073ff",
  botonTexto: "#ffffff",
  campo: "rgba(255,255,255,.06)",
  campoBorde: "rgba(255,255,255,.2)",
  foco: "#5073ff",
  error: "#fca5a5",
  fuenteTitulo: SISTEMA,
  fuenteTexto: SISTEMA,
  fuentesUrl: null,
};

/** Paleta de manuelazuluaga.com (src/styles/theme.css de su landing). */
const TEMA_MANUELA: TemaWebinar = {
  marca: "Manuela Zuluaga",
  evento: "webinar",
  fondo: "#eee4da", // crema
  tarjeta: "#f7f2ed", // papel
  borde: "#c8a49f", // rosa arcilla
  titulo: "#4d0e13", // burgundy
  texto: "#4a3a32", // tierra
  suave: "#844d43", // malva: 5,4:1 sobre crema
  boton: "#4d0e13",
  botonHover: "#6a2b26",
  botonTexto: "#eee4da",
  campo: "#ffffff",
  campoBorde: "#c8a49f",
  foco: "#844d43",
  error: "#a3161d",
  fuenteTitulo: '"Cormorant Garamond",Georgia,serif',
  fuenteTexto: '"DM Sans",system-ui,sans-serif',
  fuentesUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@400;600&display=swap",
};

/**
 * lp.pilarsousa.es, con la paleta de "Volver al Origen" (globals.css de su
 * landing, tokens --color-vo-*): Pilar llama "seminario" a su evento.
 */
const TEMA_PILAR: TemaWebinar = {
  marca: "Pilar Sousa",
  evento: "seminario",
  fondo: "#0b1502", // vo-black
  tarjeta: "#1a2b07", // vo-forest
  borde: "#2e4b0f", // vo-olive
  titulo: "#f6f6e5", // vo-bone
  texto: "#f6f6e5",
  suave: "rgba(246,246,229,.72)",
  boton: "#b4e236", // vo-lumen
  botonHover: "#c6ec5e",
  botonTexto: "#0b1502",
  campo: "rgba(246,246,229,.06)",
  campoBorde: "#2e4b0f",
  foco: "#b4e236",
  error: "#f4a3a3",
  fuenteTitulo: 'Cinzel,"Times New Roman",serif',
  fuenteTexto: '"DM Sans",system-ui,sans-serif',
  fuentesUrl: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=DM+Sans:wght@400;600&display=swap",
};

const POR_DOMINIO: Record<string, TemaWebinar> = {
  "manuelazuluaga.com": TEMA_MANUELA,
  "lp.pilarsousa.es": TEMA_PILAR,
};

/** El tema de la primera landing con dominio conocido; si ninguna lo tiene, el de synx build. */
export function temaWebinar(urls: (string | null | undefined)[]): TemaWebinar {
  for (const url of urls) {
    const dominio = dominioDe(url);
    if (dominio && POR_DOMINIO[dominio]) return POR_DOMINIO[dominio];
  }
  return TEMA_SYNX;
}
