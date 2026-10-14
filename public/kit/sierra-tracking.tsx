"use client";

/**
 * Sierra Launch Kit · navegador (v1)
 *
 * <SierraTracking />  va UNA vez en el layout raíz: mide las visitas de
 *                     todas las rutas del proyecto (también al navegar entre
 *                     páginas sin recargar). Sin cookies.
 * <SierraCampos />    va DENTRO de cada <form>: agrega la ruta y los UTM como
 *                     campos ocultos, para que el servidor los reciba con
 *                     atribucionDe(formData).
 * leerAtribucion()    lo mismo para formularios que envían con fetch/JSON.
 */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
type Utm = Partial<Record<(typeof UTM)[number], string>>;

/** UTM de la URL; si no hay, los guardados en la sesión (la visita anterior). */
function leerUtm(): Utm {
  const resultado: Utm = {};
  try {
    const consulta = new URLSearchParams(window.location.search);
    for (const nombre of UTM) {
      let valor = consulta.get(nombre);
      if (valor) window.sessionStorage.setItem(`sl_${nombre}`, valor);
      else valor = window.sessionStorage.getItem(`sl_${nombre}`);
      if (valor) resultado[nombre] = valor.slice(0, 120);
    }
  } catch {
    /* sessionStorage bloqueado: sin UTM guardados */
  }
  return resultado;
}

export function leerAtribucion(): { path: string; utm: Utm } {
  return { path: window.location.pathname, utm: leerUtm() };
}

export function SierraTracking() {
  const ruta = usePathname();

  useEffect(() => {
    const panel = process.env.NEXT_PUBLIC_SIERRA_URL;
    const sitio = process.env.NEXT_PUBLIC_SIERRA_SITE_KEY;
    if (!panel || !sitio || !ruta) return;
    try {
      const cuerpo = JSON.stringify({ s: sitio, p: ruta, r: document.referrer || "", u: leerUtm() });
      const destino = `${panel.replace(/\/+$/, "")}/api/t`;
      // Texto plano: no dispara preflight CORS ni demora la página.
      if (navigator.sendBeacon) navigator.sendBeacon(destino, cuerpo);
      else void fetch(destino, { method: "POST", body: cuerpo, keepalive: true, mode: "no-cors" });
    } catch {
      /* la landing sigue funcionando aunque el conteo falle */
    }
  }, [ruta]);

  return null;
}

export function SierraCampos() {
  const contenedor = useRef<HTMLSpanElement>(null);

  // En el navegador (en el servidor no hay URL ni sessionStorage): se
  // completan los campos directamente, sin estado ni renders extra.
  useEffect(() => {
    const raiz = contenedor.current;
    if (!raiz) return;
    const { path, utm } = leerAtribucion();
    const poner = (nombre: string, valor: string) => {
      const campo = raiz.querySelector<HTMLInputElement>(`input[name="${nombre}"]`);
      if (campo) campo.value = valor;
    };
    poner("sl_path", path);
    for (const nombre of UTM) poner(nombre, utm[nombre] ?? "");
  }, []);

  return (
    <span ref={contenedor} hidden>
      <input type="hidden" name="sl_path" defaultValue="" />
      {UTM.map((nombre) => (
        <input key={nombre} type="hidden" name={nombre} defaultValue="" />
      ))}
    </span>
  );
}
