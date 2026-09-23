# Finanzas

Registro de ingresos y egresos. Vive en JSON (no Markdown) porque los números
se suman y filtran; vive en archivo (no base con servidor) porque el sistema
abre sin levantar nada.

## Dos ámbitos

- **negocio** — plata de la operación: ingresos de clientes, pagos al equipo, suscripciones.
- **personal** — plata personal, separada del negocio.

Cada movimiento declara su `ambito`. El dashboard los muestra en secciones distintas
(Finanzas Negocio / Finanzas Personales).

## Reglas de moneda

- Cada movimiento se guarda en **su** moneda (`ARS` o `USD`).
- **Nunca se convierte automáticamente.** Los totales se muestran separados:
  total en pesos, total en dólares.
- Un consolidado en una sola moneda requeriría guardar el tipo de cambio del día
  de cada movimiento. No está hecho todavía.

## Forma de un movimiento

```json
{
  "id": "2026-07-25-lead-magnet-bruno",
  "fecha": "2026-07-25",
  "ambito": "negocio",
  "tipo": "egreso",
  "monto": 50000,
  "moneda": "ARS",
  "categoria": "equipo",
  "concepto": "Pago a Bruno por Lead Magnet",
  "unidad": "landing-pages",
  "cliente": "Pilar Sousa",
  "proyecto": "pilar-lead-magnet",
  "persona": "Bruno",
  "estado": "pagado",
  "comprobante": "",
  "notas": ""
}
```

Campos:

| Campo | Obligatorio | Valores |
| --- | --- | --- |
| `fecha` | sí | `AAAA-MM-DD` |
| `ambito` | sí | `negocio` \| `personal` |
| `tipo` | sí | `ingreso` \| `egreso` |
| `monto` | sí | número, sin separadores |
| `moneda` | sí | `ARS` \| `USD` |
| `categoria` | sí | ver abajo |
| `concepto` | sí | descripción corta |
| `unidad` | no | slug de unidad (para enganchar al negocio) |
| `cliente` | no | nombre del cliente |
| `proyecto` | no | slug del proyecto (así sale la rentabilidad después) |
| `persona` | no | a quién se le pagó (Bruno, Cielo…) |
| `estado` | sí | `pagado` \| `pendiente` \| `cobrado` |
| `comprobante` | no | link o ruta |
| `notas` | no | libre |

## Categorías

**Egresos:** `equipo` (pagos a Bruno/Cielo), `suscripcion` (herramientas fijas),
`herramienta` (compras puntuales), `impuesto`, `otro`.

**Ingresos:** `cliente` (cobro de proyecto), `otro`.

## Cómo se carga

Por la terminal, como todo. "Le pagué 50 lucas a Bruno por el Lead Magnet"
→ se agrega el movimiento al JSON, enganchado al proyecto `pilar-lead-magnet`.
El pago por proyecto es lo que permite calcular rentabilidad más adelante.
