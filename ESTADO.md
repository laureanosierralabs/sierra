# Landing Pages — Estado del proyecto

Contexto para retomar el trabajo en una sesión nueva.
Última verificación contra infraestructura real: 2026-09-22.

---

## Qué es esto

`dashboard/` es una app Next.js que funciona como panel interno de Laureano.
Vive dentro del repo `5. Sistema Operativo`, que además guarda contexto
operativo en Markdown (`contexto/`, `finanzas/`).

El dashboard tiene dos partes bien distintas:

1. **Dashboard original** (preexistente) — lee los `.md` de `contexto/` con
   `gray-matter` y los muestra. Incluye Finanzas, Unidades y Proyectos. No usa
   base de datos.
2. **Módulo Landing Pages** (`/landing-pages/*`) — workspace operativo con
   Clerk + Supabase. Es lo que se construyó en las últimas sesiones.

Ambas conviven. El módulo nuevo NO reemplazó nada del original.

---

## Stack real (verificado en package.json)

| Capa | Elección |
| --- | --- |
| Framework | Next.js **16.2.11** (App Router, Turbopack por defecto) |
| React | 19.2.4 |
| Estilos | Tailwind CSS 4 con design tokens propios en `app/globals.css` |
| Auth | **Clerk** `@clerk/nextjs` 7.9.4 (**Core 3**) |
| Datos | **Supabase** `@supabase/supabase-js` 2.116.0 (solo PostgreSQL vía REST) |
| Iconos | lucide-react |
| Node | 20.19.3 · pnpm 9.15.9 |

**No hay** shadcn/ui, Zod, React Hook Form ni date-fns. Los formularios usan
Server Actions con validación manual. No agregar estas deps sin una razón real.

---

## Dos trampas de versión (esto rompe si se va de memoria)

`dashboard/AGENTS.md` lo advierte: *"This is NOT the Next.js you know"*.
Leer `node_modules/next/dist/docs/` antes de escribir código. Dos casos ya
encontrados en la práctica:

1. **Next 16 renombró `middleware.ts` → `proxy.ts`.**
   Escribir `middleware.ts` compila sin error y deja la app **sin auth**, en
   silencio. El build debe mostrar `ƒ Proxy (Middleware)` en la lista de rutas.

2. **Clerk 7.9.4 es Core 3: `<SignedIn>` explota en runtime.**
   Se exporta desde `@clerk/nextjs`, pasa el typecheck, y falla recién al
   prerenderizar. El reemplazo en Core 3 es `<Show>`. En Server Components
   donde el proxy ya garantiza sesión, no hace falta wrapper.

Moraleja: **typecheck no alcanza, hay que correr `pnpm build`.**

---

## Arquitectura

Estructura plana en la raíz de `dashboard/` (sin `src/`), que es la convención
que ya traía el proyecto:

```
app/
  landing-pages/
    layout.tsx          contenedor del módulo (max-w-6xl)
    page.tsx            Inicio
    projects/page.tsx   Proyectos
    tasks/page.tsx      Tareas
    acciones.ts         Server Actions (crear/editar/cambiar estado)
  sign-in/[[...sign-in]]/page.tsx
  sign-up/[[...sign-up]]/page.tsx
components/landing/
  nav.tsx               navegación del módulo en el sidebar global
  ui.tsx                pills de estado, prioridad, vencimiento, PageHeader
  dialogo-form.tsx      modal + inputs reutilizables
  proyecto-form.tsx     alta/edición de proyecto
  tarea-form.tsx        alta/edición de tarea
  estado-select.tsx     cambio de estado inline desde la tabla
lib/landing/
  tipos.ts              estados, prioridades, labels, tipos de dominio
  supabase.ts           cliente service-role (server-only)
  datos.ts              lecturas
  auth.ts               rol desde Clerk + listado de miembros
proxy.ts                protección de rutas (NO middleware.ts)
supabase/
  schema.sql
  migrations/20260922000000_landing_pages_v1.sql
```

---

## Seguridad — el modelo, y por qué

```
Browser → Clerk (sesión) → Next.js server → Supabase (service role)
```

El browser **nunca** habla con Supabase. Decisión deliberada: evita tener que
integrar Clerk con RLS de Supabase, que es donde se complica.

Tres capas que lo sostienen:

- `lib/landing/supabase.ts` importa `server-only`: si alguien lo importa desde
  un Client Component, **el build falla**. La key no puede filtrarse.
- `proxy.ts` exige sesión de Clerk antes de que cualquier ruta se ejecute.
- Cada Server Action en `acciones.ts` revalida la sesión con `exigirSesion()`.
  No se confía solo en el proxy.

**RLS está activo en ambas tablas, sin políticas.** Eso hace que la key pública
no pueda leer ni escribir nada. Verificado con curl: la publishable key devuelve
`[]`, la secret key devuelve `200`.

### Roles

Viven en `publicMetadata.role` de Clerk. Sin rol explícito → `member`
(el acceso más restringido, que es el default seguro).

- `owner` → todo el dashboard
- `member` → solo `/landing-pages/*`; cualquier otra ruta lo redirige ahí

Para hacer a alguien owner: Clerk → usuario → Metadata → `publicMetadata` →
`{ "role": "owner" }`.

---

## Base de datos

Proyecto Supabase `rtvcjdrvoobdzpeovsga` (`Lavreano's Project`, us-east-1,
Postgres 17.6). CLI linkeado, migración aplicada y confirmada local↔remoto.

**`projects`** — id (uuid), name, client_name, status, responsible_user_id
(ID de Clerk), due_date, priority, notes, created_at, updated_at

**`tasks`** — id (uuid), project_id (FK → projects, on delete cascade), title,
description, status, assigned_to (ID de Clerk), priority, due_date,
created_at, updated_at

**`clients`** — id (uuid), name, company, email, phone, instagram, status,
notes, created_at, updated_at

**`quotes`** — id (uuid), client_id (FK → clients, on delete set null), title,
service, amount (numeric), currency, status, proposal_url, sent_at, notes,
created_at, updated_at

`projects` suma `client_id` y `quote_id` (ambos nullable, FK, on delete set
null). `client_name` se conserva como **fallback**: si hay `client_id` se
muestra el nombre desde `clients`, si no se usa `client_name`. El helper
`nombreCliente()` en `tipos.ts` resuelve esa precedencia — usarlo siempre en
vez de leer `client_name` directo.

Estados de proyecto: `por-iniciar`, `en-progreso`, `en-revision`,
`esperando-cliente`, `entregado`
Estados de tarea: `pendiente`, `en-progreso`, `en-revision`, `bloqueada`,
`completada`
Estados de cliente: `prospecto`, `cliente`, `inactivo`
Estados de cotización: `borrador`, `enviada`, `seguimiento`, `aprobada`,
`rechazada`
Prioridades: `alta`, `media`, `baja` · Monedas: `USD`, `ARS`, `EUR`

Los estados están como CHECK constraints en SQL **y** como union types en
`lib/landing/tipos.ts`. Si se agrega uno, hay que tocar los dos lados.

---

## Qué funciona hoy

| Ruta | Estado |
| --- | --- |
| `/landing-pages` | Inicio: vencidas/hoy, próximas, proyectos activos, cotizaciones en seguimiento |
| `/landing-pages/projects` | Tabla + crear + editar + estado inline + responsable + deadline |
| `/landing-pages/tasks` | Tabla + crear + editar + vínculo a proyecto + asignación |
| `/landing-pages/clients` | Base única de contactos (prospecto/cliente/inactivo) |
| `/landing-pages/clients/[id]` | Detalle + cotizaciones y proyectos del cliente |
| `/landing-pages/quotes` | Cotizaciones + "Crear proyecto" en las aprobadas |
| `/landing-pages/team` | Miembros desde Clerk + carga de trabajo |

Verificado: `pnpm lint`, `npx tsc --noEmit` y `pnpm build` pasan los tres.
`curl` a `/landing-pages` sin sesión devuelve `307` hacia Clerk.

Inicio muestra solo esas tres listas. Sin charts ni métricas vanity —
decisión explícita del usuario.

---

## Diseño

El módulo reutiliza los design tokens del dashboard original
(`app/globals.css`). No se creó un sistema visual paralelo.

Tokens: `ground`, `surface`, `surface-2`, `line`, `line-strong`, `text`,
`text-2`, `text-3`, y semánticos `ok` / `warn` / `critical` / `idle` (cada uno
con su variante `-dim`).

Soporta claro y oscuro. El tema se aplica antes del primer paint con un script
en `app/layout.tsx`, y `components/theme-toggle.tsx` lo lee con
`useSyncExternalStore` (no con `useEffect` + `setState`, que disparaba un error
de lint por renders en cascada y **bloqueaba el build**).

Criterio visual: densidad alta, bordes sutiles, el color codifica urgencia y no
decora. Nada de cards gigantes tipo SaaS genérico.

---

## Decisiones tomadas (y por qué)

- **Clerk en vez de Supabase Auth** — para no tener que integrar Clerk con RLS.
  Auth y datos quedan desacoplados.
- **Sin `src/`** — el proyecto ya era plano; moverlo era churn sin beneficio.
- **Sin shadcn/Zod/RHF** — Server Actions con validación manual alcanzan para
  este tamaño. Agregar deps solo cuando duela no tenerlas.
- **Módulo adentro del dashboard existente** — se evaluó una app separada y se
  descartó: duplicaba layout, tokens y deploy.
- **Alcance recortado a Proyectos + Tareas** — el pedido original incluía
  Clientes, Cotizaciones, Equipo y Configuración; se sacaron para tener algo
  usable el mismo día.

---

## Pendientes

**Construir cuando haga falta:**
- Ruta `/settings` (hoy no existe)
- Finanzas — explícitamente fuera de alcance por ahora
- Invitaciones de usuarios dentro de la app: hoy las altas van por Clerk Dashboard
- Sidebar colapsable con tooltips y estado persistido
- `.env.example` — no se pudo crear: los `.env*` están bloqueados por permisos

**Higiene de credenciales:**
- Rotar el token `sbp_...` de Supabase y la `sk_live_` de Clerk: quedaron
  expuestos en el historial de chat
- Confirmar que `.env.local` usa keys de Clerk **Development** (`pk_test_` /
  `sk_test_`). Con las `live` el login redirige a
  `accounts.laureanosierra.com`, que es producción y suele fallar en localhost
- `.env*` ya está en `.gitignore`

**Ojo con esto:**
- `dashboard/` está **sin trackear en git**. El repo no tiene ningún commit.
- Puede haber un `next dev` viejo corriendo; Next bloquea un segundo servidor.
  Si pasa, el log dice qué PID matar.

---

## Comandos

```bash
cd dashboard
pnpm dev                 # dev server
pnpm lint                # ESLint
npx tsc --noEmit         # typecheck
pnpm build               # build — el único que cacha los errores de runtime
```

Supabase CLI (instalado con scoop, shim en `~/scoop/shims`):

```bash
supabase migration list  # comparar local vs remoto
supabase db push         # aplicar migraciones nuevas
```

---

## Cómo seguir

Antes de tocar código:

1. Leer `dashboard/AGENTS.md` y los docs en `node_modules/next/dist/docs/`.
   Next 16 y Clerk Core 3 difieren de lo que un modelo "recuerda".
2. Inspeccionar la estructura actual. Hay trabajo previo funcionando: el
   dashboard original (Finanzas, Unidades) no se toca sin pedirlo.
3. Terminar siempre con `pnpm build`, no solo typecheck.

Para agregar un módulo nuevo, el patrón ya está: tipos en `lib/landing/`,
lecturas en `datos.ts`, mutaciones en `acciones.ts` con `exigirSesion()`,
UI en `components/landing/`, ruta en `app/landing-pages/`.
