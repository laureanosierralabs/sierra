/**
 * Apariencia de los componentes de Clerk (`<SignIn>`, `<SignUp>`), solo con
 * tokens del template.
 *
 * `variables` acepta cadenas `var(--...)` (Clerk las resuelve con color-mix y
 * sintaxis de color relativo). Como los tokens cambian con `data-theme`, el
 * formulario sigue el tema claro/oscuro sin lógica extra.
 *
 * `elements` usa el modificador `!` porque los estilos de Clerk no están en una
 * capa CSS y, sin importancia, le ganan a las utilidades de Tailwind.
 */
export const CLERK_APARIENCIA = {
  variables: {
    colorPrimary: "var(--color-primary-500)",
    colorPrimaryForeground: "var(--color-white-100)",
    colorBackground: "var(--color-card-background)",
    colorForeground: "var(--color-title-50)",
    colorMutedForeground: "var(--color-text-tertiary)",
    colorNeutral: "var(--color-title-50)",
    colorBorder: "var(--color-card-border)",
    colorInput: "var(--color-input-background)",
    colorInputForeground: "var(--color-title-50)",
    colorDanger: "var(--color-error-500)",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    // White-label: el título lo pone nuestra página y el form vive en nuestra
    // columna, así que sin footer "Secured by Clerk" ni tarjeta propia.
    rootBox: "w-full!",
    cardBox: "w-full! border-0! bg-transparent! shadow-none!",
    card: "border-0! bg-transparent! p-0! shadow-none!",
    footer: "hidden!",
    headerTitle: "hidden!",
    headerSubtitle: "hidden!",
  },
} as const;

/**
 * Sign-up keeps Clerk's own step titles (email code, verification) and its
 * footer link back to sign-in, as the bare <SignUp> did before.
 */
export const CLERK_APARIENCIA_REGISTRO = {
  variables: CLERK_APARIENCIA.variables,
  elements: {
    rootBox: CLERK_APARIENCIA.elements.rootBox,
    cardBox: CLERK_APARIENCIA.elements.cardBox,
    card: CLERK_APARIENCIA.elements.card,
  },
} as const;
