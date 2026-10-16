import { Plus_Jakarta_Sans } from "next/font/google";
import "./login.css";

// The app shell moved to Inter; the login keeps its original typeface.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

/** Apariencia de los componentes de Clerk dentro de nuestra pantalla. */
export const APARIENCIA_CLERK = {
  variables: {
    colorPrimary: "#96c0ff",
    colorBackground: "transparent",
    colorText: "#dadff5",
    colorTextSecondary: "#93a1b4",
    colorInputBackground: "#0a0f21",
    colorInputText: "#dadff5",
    colorDanger: "#ff9a9a",
    borderRadius: "10px",
    fontFamily: "var(--font-jakarta), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    // White-label: el footer "Secured by Clerk" y el card propio se ocultan
    // porque el form se monta dentro de nuestra columna.
    footer: "hidden",
    cardBox: "shadow-none",
    card: "clerk-card",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    formFieldLabel: "clerk-label",
    formFieldInput: "clerk-input",
    formButtonPrimary: "clerk-submit",
    footerActionLink: "clerk-link",
    formFieldAction: "clerk-link",
    identityPreviewEditButton: "clerk-link",
    formResendCodeLink: "clerk-link",
    dividerLine: "clerk-divider-line",
    dividerText: "clerk-divider-text",
    socialButtonsBlockButton: "clerk-social",
    otpCodeFieldInput: "clerk-input",
  },
} as const;

import type { Audiencia } from "@/lib/audiencia-ingreso";

export type { Audiencia };

/* Lo que dice la pantalla según quién entra: el equipo a su panel, el cliente a su portal. */
const TEXTOS: Record<
  Audiencia,
  { badge: string; titulo: [string, string, string]; bajada: string; alt: string }
> = {
  equipo: {
    badge: "LANDING PAGES",
    titulo: ["Cada proyecto,", "de punta a ", "punta"],
    bajada:
      "Briefing, diseño, montaje y entrega. Todo el proceso en un solo lugar, para que nada se pierda entre herramientas.",
    alt: "Sistema Operativo",
  },
  cliente: {
    badge: "PORTAL DE CLIENTES",
    titulo: ["Tu lanzamiento,", "en ", "vivo"],
    bajada:
      "Visitas, registros y ventas de tus landings, tus pedidos al equipo y el reporte de cierre. Todo en un solo lugar.",
    alt: "sierra labs",
  },
};

/**
 * Pantalla de ingreso de dos columnas: marca a la izquierda, el formulario de
 * Clerk a la derecha. La misma para iniciar sesión y para crear la cuenta,
 * con el texto según quién entra.
 */
export function PantallaIngreso({
  audiencia,
  encabezado,
  subtitulo,
  children,
}: {
  audiencia: Audiencia;
  encabezado: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  const t = TEXTOS[audiencia];
  return (
    <div className={`login-page ${jakarta.variable}`}>
      {/* Panel de marca */}
      <aside className="login-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="login-light" src="/light4.webp" alt="" aria-hidden="true" />
        <div className="login-grain" aria-hidden="true" />
        <div className="login-halo" aria-hidden="true" />

        <div className="login-brand-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="login-logo" src="/logotipo-blanco.png" alt={t.alt} />
        </div>

        <div className="login-brand-body">
          <p className="login-badge">
            <span className="login-badge-orb" aria-hidden="true" />
            {t.badge}
          </p>
          <h1 className="login-title">
            {t.titulo[0]}
            <br />
            {t.titulo[1]}
            <span className="login-title-accent">{t.titulo[2]}</span>.
          </h1>
          <p className="login-lede">{t.bajada}</p>
        </div>

        <div className="login-marks" aria-hidden="true">
          <span className="login-mark" />
          <span className="login-mark" />
          <span className="login-mark" />
        </div>
      </aside>

      {/* Formulario (componente nativo de Clerk) */}
      <main className="login-form-side">
        <div className="login-form-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="login-logo login-logo-mobile" src="/logotipo-blanco.png" alt={t.alt} />

          <h2 className="login-heading">{encabezado}</h2>
          <p className="login-sub">{subtitulo}</p>

          <div className="login-clerk">{children}</div>
        </div>
      </main>
    </div>
  );
}
