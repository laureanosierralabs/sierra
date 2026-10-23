/** Tipos compartidos entre servidor y UI de las integraciones (sin dependencias). */

export interface ResultadoSync {
  /** Cuándo terminó esta corrida (ISO). */
  at: string;
  /** Por etiqueta: contactos encontrados y ventas nuevas importadas. */
  porEtiqueta: Record<string, { encontrados: number; nuevas: number }>;
  errores: string[];
  /** false = se cortó por tiempo y la próxima corrida retoma desde el cursor. */
  completo: boolean;
  /** Método que se usó para buscar contactos. */
  modo: "search" | "scan";
  cursor: CursorSync | null;
}

export interface CursorSync {
  modo: "search" | "scan";
  /** modo search: etiquetas ya terminadas y la que está en curso con su página. */
  hechas?: string[];
  tag?: string;
  page?: number;
  /** modo scan: paginación de GET /contacts/. */
  startAfter?: number | null;
  startAfterId?: string | null;
}

export interface MapeoUI {
  id: string;
  tag: string;
  page_id: string;
  amount: number | null;
  currency: string;
}

export interface IntegracionUI {
  id: string;
  location_id: string | null;
  tieneToken: boolean;
  last_sync_at: string | null;
  last_sync_result: ResultadoSync | null;
  mapeos: MapeoUI[];
}

export interface LandingOpcion {
  id: string;
  label: string;
}
