/**
 * Alertas de lanzamientos activos: lo que se rompió y nadie vio. Lógica pura
 * (las reglas); los datos los junta lib/lanzamientos/alertas-datos.ts.
 */

export type GravedadAlerta = "error" | "aviso";

export interface Alerta {
  id: string;
  gravedad: GravedadAlerta;
  lanzamiento: { id: string; name: string; cliente: string };
  titulo: string;
  detalle: string;
}

export interface EstadoLanzamientoActivo {
  id: string;
  name: string;
  cliente: string;
  /** Inicio del lanzamiento (AAAA-MM-DD) o null. */
  starts_on: string | null;
  /** Proyectos conectados que usan sus landings, con el último evento que mandaron. */
  sitios: { id: string; name: string; ultimoEvento: string | null }[];
  /** Usa MailerLite (alguna landing con grupo). */
  usaMailerlite: boolean;
  /** Avisos de MailerLite con error en las últimas 24 h, y el último motivo. */
  webhookFallidos: number;
  ultimoErrorWebhook: string | null;
  /** Último registro que entró por cualquier vía; null si nunca. */
  ultimoRegistro: string | null;
}

const HORA_MS = 3_600_000;
/** Con anuncios prendidos siempre hay visitas: 6 h de silencio es raro. */
export const SILENCIO_SITIO_HORAS = 6;
/** Un día entero sin registros en un lanzamiento activo merece una mirada. */
export const SIN_REGISTROS_HORAS = 24;

function hace(desde: string, ahora: number): string {
  const horas = Math.floor((ahora - Date.parse(desde)) / HORA_MS);
  if (horas < 48) return `${horas} h`;
  return `${Math.floor(horas / 24)} días`;
}

export function evaluarAlertas(lanzamientos: EstadoLanzamientoActivo[], ahora: number = Date.now()): Alerta[] {
  const alertas: Alerta[] = [];
  for (const l of lanzamientos) {
    const lanzamiento = { id: l.id, name: l.name, cliente: l.cliente };
    // El primer día no se exige nada: puede que todavía no haya tráfico.
    const empezoHaceUnDia = !l.starts_on || ahora - Date.parse(`${l.starts_on}T03:00:00Z`) > 24 * HORA_MS;

    if (l.webhookFallidos > 0) {
      alertas.push({
        id: `${l.id}:webhook`,
        gravedad: "error",
        lanzamiento,
        titulo: `MailerLite: ${l.webhookFallidos} ${l.webhookFallidos === 1 ? "aviso falló" : "avisos fallaron"} en las últimas 24 h`,
        detalle: l.ultimoErrorWebhook
          ? `Último motivo: ${l.ultimoErrorWebhook}. Esos registros no se contaron.`
          : "Esos registros no se contaron.",
      });
    }

    for (const s of l.sitios) {
      const silencioso = !s.ultimoEvento || ahora - Date.parse(s.ultimoEvento) > SILENCIO_SITIO_HORAS * HORA_MS;
      if (silencioso && empezoHaceUnDia) {
        alertas.push({
          id: `${l.id}:sitio:${s.id}`,
          gravedad: "error",
          lanzamiento,
          titulo: `${s.name} no manda datos ${s.ultimoEvento ? `hace ${hace(s.ultimoEvento, ahora)}` : "nunca"}`,
          detalle:
            "Con el lanzamiento activo debería haber visitas todo el tiempo. Revisá que el último deploy tenga el kit y sus variables, y probá con Verificar landings.",
        });
      }
    }

    const sinRegistros = !l.ultimoRegistro || ahora - Date.parse(l.ultimoRegistro) > SIN_REGISTROS_HORAS * HORA_MS;
    if (sinRegistros && empezoHaceUnDia && (l.sitios.length > 0 || l.usaMailerlite)) {
      alertas.push({
        id: `${l.id}:registros`,
        gravedad: "aviso",
        lanzamiento,
        titulo: l.ultimoRegistro ? `Sin registros nuevos hace ${hace(l.ultimoRegistro, ahora)}` : "Todavía no entró ningún registro",
        detalle: "Puede ser falta de tráfico o un formulario roto: completá uno de prueba para descartar lo segundo.",
      });
    }
  }
  // Los errores primero.
  return alertas.sort((a, b) => (a.gravedad === b.gravedad ? 0 : a.gravedad === "error" ? -1 : 1));
}
