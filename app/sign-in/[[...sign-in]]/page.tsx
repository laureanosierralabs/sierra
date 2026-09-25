/**
 * Página de login del Sistema Operativo.
 *
 * Usa el componente PRE-ARMADO `<SignIn>` de Clerk (no headless): maneja
 * login por contraseña, "olvidé mi contraseña" y verificación de dispositivo
 * de forma nativa y segura. Se integra en el layout 2-columnas con el
 * branding a la izquierda, mismo lenguaje visual que Synous.
 */

import { SignIn } from "@clerk/nextjs";
import "./login.css";

const AUTH_APPEARANCE = {
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

export default function SignInPage() {
  return (
    <div className="login-page">
      {/* Panel de marca */}
      <aside className="login-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="login-light" src="/light4.webp" alt="" aria-hidden="true" />
        <div className="login-grain" aria-hidden="true" />
        <div className="login-halo" aria-hidden="true" />

        <div className="login-brand-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="login-logo"
            src="/logotipo-blanco.png"
            alt="Sistema Operativo"
          />
        </div>

        <div className="login-brand-body">
          <p className="login-badge">
            <span className="login-badge-orb" aria-hidden="true" />
            LANDING PAGES
          </p>
          <h1 className="login-title">
            Cada proyecto,
            <br />
            de punta a <span className="login-title-accent">punta</span>.
          </h1>
          <p className="login-lede">
            Briefing, diseño, montaje y entrega. Todo el proceso en un solo lugar,
            para que nada se pierda entre herramientas.
          </p>
        </div>

        <div className="login-marks" aria-hidden="true">
          <span className="login-mark" />
          <span className="login-mark" />
          <span className="login-mark" />
        </div>
      </aside>

      {/* Login (componente nativo de Clerk) */}
      <main className="login-form-side">
        <div className="login-form-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="login-logo login-logo-mobile"
            src="/logotipo-blanco.png"
            alt="Sistema Operativo"
          />

          <h2 className="login-heading">Iniciá sesión</h2>
          <p className="login-sub">Entrá con tu cuenta del equipo.</p>

          <div className="login-clerk">
            <SignIn fallbackRedirectUrl="/" appearance={AUTH_APPEARANCE} />
          </div>
        </div>
      </main>
    </div>
  );
}
