"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/**
 * Grilla de puntos donde algunos se encienden y apagan con brillo propio.
 * Adaptado del patrón de Consciencia MCE.
 *
 * Se dibuja en un <canvas> y no con divs: una grilla de 12px sobre una portada
 * de 400px son cientos de puntos, y como nodos del DOM eso destruye el scroll.
 *
 * Solo brilla una fracción a la vez; el resto queda tenue. Si parpadearan
 * todos, el fondo competiría con el nombre que va encima.
 */
export function GrillaPuntos({
  gap = 12,
  radius = 1.2,
  density = 0.4,
}: {
  gap?: number;
  radius?: number;
  density?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The glow color comes from a theme token: redraw when the theme changes.
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Colores de los tokens del tema. La portada es siempre oscura (gradiente
    // primary-950), así que los puntos apagados van en blanco con poca opacidad
    // y los encendidos en el primary claro, que el className del canvas aporta.
    const glowColor = getComputedStyle(canvas).color;
    const apagado =
      getComputedStyle(document.documentElement).getPropertyValue("--color-white-100").trim() ||
      glowColor;

    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let dots: { x: number; y: number; phase: number; speed: number; glows: boolean }[] = [];

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = parent.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          dots.push({
            x,
            y,
            // La fase depende de la POSICIÓN, no del azar: así los vecinos se
            // encienden casi juntos y se lee como una onda, no como ruido.
            phase: (x / width) * Math.PI * 2.2 + (y / height) * 0.9,
            speed: 0.8 + Math.random() * 0.5,
            glows: Math.random() < density,
          });
        }
      }
    };

    const draw = (t: number) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      for (const d of dots) {
        if (d.glows && !reducido) {
          const wave = (Math.sin(t * 0.0009 * d.speed + d.phase) + 1) / 2;
          // Al cubo: la onda pasa más tiempo apagada y el pico queda corto.
          const w = wave * wave * wave;
          ctx.globalAlpha = 0.06 + w * 0.94;
          ctx.fillStyle = glowColor;
          // shadowBlur es lo más caro del canvas. Solo cerca del pico: aplicarlo
          // a todos los que brillan costaría miles de halos por segundo.
          if (w > 0.45) {
            ctx.shadowBlur = 12 * w;
            ctx.shadowColor = glowColor;
          } else {
            ctx.shadowBlur = 0;
          }
        } else {
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = apagado;
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    build();
    if (reducido) draw(0);
    else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      build();
      if (reducido) draw(0);
    });
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [gap, radius, density, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-primary-300"
    />
  );
}
