/**
 * Plantillas de tarea: definen el formulario que se renderiza en su página.
 * Las respuestas viven en tasks.content, indexadas por id de campo.
 */

export type TipoCampo =
  | "opciones"
  | "texto"
  | "links"
  | "lista"
  | "fecha"
  /** Pasos a completar. Se guarda la lista de items tildados. */
  | "checklist"
  /** Items que crea el usuario. Se guarda "[x] texto" por línea. */
  | "checklist-libre";

/** Item de checklist. Puede tener sub-items anidados un nivel. */
export interface ItemChecklist {
  texto: string;
  hijos?: string[];
}

export interface Campo {
  id: string;
  label: string;
  tipo: TipoCampo;
  /** Para "opciones" y "checklist" plano. */
  opciones?: string[];
  /** Para "checklist" con anidación. Tiene precedencia sobre `opciones`. */
  items?: ItemChecklist[];
  /** Permite marcar más de una opción. */
  multiple?: boolean;
  ayuda?: string;
  filas?: number;
}

export interface Seccion {
  id: string;
  titulo: string;
  campos: Campo[];
}

export interface Plantilla {
  id: string;
  nombre: string;
  secciones: Seccion[];
}

const BRIEFING: Plantilla = {
  id: "briefing",
  nombre: "Briefing",
  secciones: [
    {
      id: "publico",
      titulo: "Público objetivo",
      campos: [
        {
          id: "rango_edad",
          label: "Rango de edad",
          tipo: "opciones",
          multiple: true,
          opciones: ["18 - 30", "30 - 40", "40 - 50", "50 - 80"],
        },
        {
          id: "genero",
          label: "Género",
          tipo: "opciones",
          opciones: ["Mujeres", "Hombres", "Ambos"],
        },
        {
          id: "educacion",
          label: "Nivel de educación",
          tipo: "opciones",
          multiple: true,
          opciones: ["Primaria", "Preparatoria", "Universidad"],
        },
        {
          id: "tecnologia",
          label: "Familiarización con la tecnología",
          tipo: "opciones",
          opciones: ["Poca", "Media", "Mucha"],
        },
        {
          id: "ocupacion",
          label: "¿A qué se dedican?",
          tipo: "texto",
          filas: 3,
        },
      ],
    },
  ],
};

const DISENO: Plantilla = {
  id: "diseno",
  nombre: "Diseño",
  secciones: [
    {
      id: "pasos",
      titulo: "Checklist de diseño",
      campos: [
        {
          id: "pasos",
          label: "",
          tipo: "checklist",
          opciones: [
            "Separar imágenes y fotos del experto que serán utilizadas",
            "Identidad visual del proyecto",
            "Moodboard",
            "Hero section",
            "Estructura",
            "Mockups",
            "Diseños adicionales",
            "Responsive a celular",
            "Responsive a tablet",
            "Prototipo final",
            "Exportar recursos (assets)",
          ],
        },
        {
          id: "notas",
          label: "Notas",
          tipo: "texto",
          ayuda: "Decisiones de diseño, pendientes con el cliente, etc.",
          filas: 3,
        },
      ],
    },
  ],
};

const ARCHIVOS: Plantilla = {
  id: "archivos",
  nombre: "Solicitar archivos e informaciones",
  secciones: [
    {
      id: "pedidos",
      titulo: "Qué pedirle al cliente",
      campos: [
        {
          id: "pasos",
          label: "",
          tipo: "checklist",
          opciones: [
            "Acceso a WordPress o acceso al servicio de hosting",
            "Acceso al lugar donde se está gestionando el dominio (preferiblemente en Cloudflare)",
            "Copy para la página",
            "Fotos de alta resolución del experto/producto",
            "Logotipo del evento/producto (si está disponible)",
            "Manual de la marca u orientaciones sobre la identidad visual",
            "Datos de integraciones de otras herramientas",
            "Códigos de píxeles y etiquetas",
            "Enlace de pago (si está disponible)",
            "Testimonios (si están disponibles)",
          ],
        },
        {
          id: "notas",
          label: "Qué falta / pendientes con el cliente",
          tipo: "texto",
          ayuda: "Los accesos van en Recursos del proyecto, no acá.",
          filas: 3,
        },
      ],
    },
  ],
};

const INFRA_WORDPRESS: Plantilla = {
  id: "infra-wordpress",
  nombre: "Infraestructura (WordPress)",
  secciones: [
    {
      id: "pasos",
      titulo: "Checklist de infraestructura",
      campos: [
        {
          id: "pasos",
          label: "",
          tipo: "checklist",
          items: [
            { texto: "Contratar servicio de hosting" },
            { texto: "Contratar dominio" },
            { texto: "Configurar el servicio de hosting" },
            { texto: "Apuntar el dominio al servicio de hosting" },
            { texto: "Crear una cuenta en Cloudflare y vincular el dominio" },
            { texto: "Instalar WordPress" },
            {
              texto: "Instalar plugins",
              hijos: [
                "Elementor",
                "Elementor Pro",
                "Code Snippets",
                "Happy Addons for Elementor",
                "UpdraftPlus",
                "WP Rocket",
                "Yoast SEO",
                "Redirection",
                "WPS Hide Login",
                "PixelYourSite",
                "File Manager",
              ],
            },
            { texto: "Cambiar la zona horaria, idioma y descripción del sitio" },
            {
              texto:
                'Cambiar la estructura de enlaces permanentes a "nombre de entrada"',
            },
            { texto: "Instalar el tema Hello Elementor" },
            { texto: "Cambiar el favicon" },
            { texto: "Instalar etiquetas y píxeles" },
          ],
        },
        {
          id: "notas",
          label: "Notas",
          tipo: "texto",
          ayuda: "Credenciales en el gestor, no acá. Accesos van en Recursos.",
          filas: 3,
        },
      ],
    },
  ],
};

const MONTAJE_WORDPRESS: Plantilla = {
  id: "montaje-wordpress",
  nombre: "Montaje de la web (WordPress)",
  secciones: [
    {
      id: "pasos",
      titulo: "Checklist de montaje",
      campos: [
        {
          id: "pasos",
          label: "",
          tipo: "checklist",
          opciones: [
            "Configurar Elementor",
            "Agregar fuentes personalizadas",
            "Configurar fuentes y colores globales del sitio",
            "Cambiar el slug (URL amigable) del sitio",
            "Agregar códigos generales a la web",
            "Desarrollar página específica",
            "Animaciones",
            "Configurar el SEO (título, meta descripción, imagen destacada de link)",
          ],
        },
        {
          id: "notas",
          label: "Notas",
          tipo: "texto",
          filas: 3,
        },
      ],
    },
  ],
};

const OPTIMIZACION_WORDPRESS: Plantilla = {
  id: "optimizacion-wordpress",
  nombre: "Optimización (WordPress)",
  secciones: [
    {
      id: "pasos",
      titulo: "Checklist de optimización",
      campos: [
        {
          id: "pasos",
          label: "",
          tipo: "checklist",
          opciones: [
            "Configurar el plugin WP Rocket",
            "Realizar testeo 1",
            "Eliminar temas, plugins y archivos de WordPress que no se estén utilizando",
            "Utilizar pocas fuentes (máximo 2) y pocos pesos (máximo 2)",
            "Guardar imágenes en los formatos correctos (webp para comunes, svg para vectoriales)",
            "Precargar fuentes e imagen LCP (Largest Contentful Paint)",
            "Cambiar font-display a swap",
            "Precargar DNS",
            "Realizar testeo final",
          ],
        },
        {
          id: "notas",
          label: "Resultados de los testeos",
          tipo: "texto",
          ayuda: "PageSpeed, GTmetrix: puntajes antes y después.",
          filas: 3,
        },
      ],
    },
  ],
};

const ENTREGA: Plantilla = {
  id: "entrega",
  nombre: "Entrega de proyecto",
  secciones: [
    {
      id: "pasos",
      titulo: "Checklist de entrega",
      campos: [
        {
          id: "pasos",
          label: "",
          tipo: "checklist",
          items: [
            { texto: "Subir todos los archivos al drive del cliente" },
            { texto: "Entregar factura" },
            {
              texto: "Mensaje al WhatsApp con todos sus links",
              hijos: ["Notion de proyecto", "Drive", "Web"],
            },
          ],
        },
        {
          id: "notas",
          label: "Notas de entrega",
          tipo: "texto",
          filas: 3,
        },
      ],
    },
  ],
};

const REVISION: Plantilla = {
  id: "revision",
  nombre: "Revisión",
  secciones: [
    {
      id: "puntos",
      titulo: "Puntos a revisar",
      campos: [
        {
          id: "items",
          label: "",
          tipo: "checklist-libre",
          ayuda: "Una línea por punto. Enter agrega el siguiente.",
        },
      ],
    },
  ],
};

const MODIFICACIONES: Plantilla = {
  id: "modificaciones",
  nombre: "Modificaciones del cliente",
  secciones: [
    {
      id: "alteraciones",
      titulo: "Alteraciones solicitadas",
      campos: [
        {
          id: "items",
          label: "",
          tipo: "checklist-libre",
          ayuda: "Una línea por alteración. Enter agrega la siguiente.",
        },
      ],
    },
  ],
};

export const PLANTILLAS: Record<string, Plantilla> = {
  briefing: BRIEFING,
  archivos: ARCHIVOS,
  diseno: DISENO,
  "infra-wordpress": INFRA_WORDPRESS,
  "montaje-wordpress": MONTAJE_WORDPRESS,
  "optimizacion-wordpress": OPTIMIZACION_WORDPRESS,
  entrega: ENTREGA,
  revision: REVISION,
  modificaciones: MODIFICACIONES,
};

export function plantillaDe(id: string | null): Plantilla | null {
  return id ? (PLANTILLAS[id] ?? null) : null;
}

/** Valor guardado de un campo, según su tipo. */
export type ValorCampo = string | string[] | null;

export type Contenido = Record<string, ValorCampo>;

export const TIPOS_PROYECTO = ["wordpress", "codigo"] as const;
export type TipoProyecto = (typeof TIPOS_PROYECTO)[number];

export const LABEL_TIPO_PROYECTO: Record<TipoProyecto, string> = {
  wordpress: "WordPress",
  codigo: "A código",
};

interface TareaDefecto {
  title: string;
  template: string | null;
}

/** El flujo es el mismo; cambia qué plantilla usa cada tarea técnica. */
function checklist(tecnicas: {
  infra: string | null;
  montaje: string | null;
  optimizacion: string | null;
}): TareaDefecto[] {
  return [
    { title: "Reunión de briefing", template: "briefing" },
    { title: "Solicitar archivos e informaciones", template: "archivos" },
    { title: "Diseño", template: "diseno" },
    { title: "Infraestructura", template: tecnicas.infra },
    { title: "Revisión 1", template: "revision" },
    { title: "Modificaciones del cliente", template: "modificaciones" },
    { title: "Montaje de la web", template: tecnicas.montaje },
    { title: "Optimización", template: tecnicas.optimizacion },
    // Vacía a propósito: son los cambios que pide el cliente ya entregado.
    { title: "Revisión final", template: "revision" },
    { title: "Entrega de proyecto", template: "entrega" },
  ];
}

const POR_TIPO: Record<TipoProyecto, TareaDefecto[]> = {
  wordpress: checklist({
    infra: "infra-wordpress",
    montaje: "montaje-wordpress",
    optimizacion: "optimizacion-wordpress",
  }),
  // Todavía sin plantillas técnicas propias.
  codigo: checklist({ infra: null, montaje: null, optimizacion: null }),
};

export function tareasPorDefecto(tipo: string | null): TareaDefecto[] {
  return POR_TIPO[(tipo as TipoProyecto) ?? "wordpress"] ?? POR_TIPO.wordpress;
}
