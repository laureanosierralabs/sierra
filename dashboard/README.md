# Dashboard

Vista e interacción con el contexto operativo y las finanzas. Lee y **escribe**
los archivos de `../contexto/` (Markdown) y `../finanzas/movimientos.json`.

## Correr

Doble clic en **`Abrir Sistema Operativo.bat`** (en la carpeta madre).
O a mano:

```bash
cd dashboard
pnpm dev --port 3737
```

Abre en http://localhost:3737

## Escritura desde la app

El dashboard escribe los mismos archivos que lee — **una sola fuente de verdad**,
sin base de datos. Se usa por la app o por la terminal indistintamente.

- **Finanzas** (`app/finanzas/acciones.ts`): crea, edita y borra movimientos
  en el JSON, vía Server Actions.
- **Contexto** (`app/contexto/acciones.ts`): edita el frontmatter y las secciones
  de párrafo de un proyecto, crea proyectos y clientes, cambia estado de cliente.

### Regla de oro de la escritura de Markdown

`lib/escritura.ts` nunca reescribe el archivo entero. Distingue:

- `actualizarFrontmatter` — cambia campos del YAML, deja el cuerpo intacto.
- `reemplazarSeccion` — reemplaza una sección de párrafo (Próximo paso, Estado actual).
- `anteponerEnSeccion` — **suma** una línea arriba (Bitácora), sin pisar lo anterior.

Bitácora, decisiones y notas escritas a mano **nunca** se sobrescriben desde
la app. Está testeado.

## Cómo funciona

`lib/contexto.ts` lee los `.md` de `../contexto/` en cada request
(`dynamic = "force-dynamic"`). Editás un Markdown, recargás el navegador,
ya está actualizado. No hay build ni sincronización.

## Estructura

| Ruta | Qué muestra |
| --- | --- |
| `/` | Inicio: qué necesita atención, activos, pausados |
| `/proyecto/[slug]` | Centro de control del proyecto |
| `/unidad/[slug]` | Proyectos y clientes de una unidad |

## Reglas de "necesita atención"

Un proyecto sube a esa sección si:
- tiene algo en `## Bloqueos`, o
- su `entrega:` cae dentro de los próximos 10 días (o ya venció)

Los `pausado` y `terminado` nunca aparecen ahí.

## Notas de implementación

- Next 16: `params` es una `Promise`, hay que await.
- YAML parsea `entrega: 2026-07-31` como `Date` UTC. En Argentina (UTC-3)
  formatearlo corre el día hacia atrás — `fechaISO()` lee componentes UTC.
- Fuentes vía `next/font/google` (self-hosted, sin request externo).
