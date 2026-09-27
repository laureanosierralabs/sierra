const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * Vive fuera del componente del filtro: ese archivo es "use client", y un
 * Server Component que importe de ahí arrastra el módulo entero al cliente.
 */
export function nombreMes(mes: string): string {
  const [anio, m] = mes.split("-");
  return `${MESES[Number(m) - 1]} ${anio}`;
}
