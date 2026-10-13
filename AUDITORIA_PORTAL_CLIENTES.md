# Auditoría técnica — Portal de Clientes Sierra Labs

**Fecha:** 2026-10-13 · **Alcance:** lectura del repositorio `sierra` (deploy de `app.laureanosierra.com`), sin modificar código, base de datos ni configuración. No se abrieron archivos `.env*` ni se consultó la base de producción.

**Convención de evidencia:**
- **[V] verificado:** visto en el código, con ruta y línea.
- **[I] inferencia:** deducido del código, sin confirmación directa.
- **[NV] no verificable:** depende de un dashboard o de la base de producción, fuera del repo.

---

## 1. Resumen ejecutivo

1. **La plataforma es un panel interno de un solo espacio de trabajo, no un SaaS multi-tenant.** No hay organizaciones, membresías ni usuarios cliente [V: `ARQUITECTURA.md:11-13`; ausencia de `organization|tenant|membership` en migraciones y código]. El portal de cliente figura explícitamente como "fuera de alcance" [V: `ARQUITECTURA.md:353-356`].
2. **Toda la autorización vive en el código del servidor.** La base usa la service role, que saltea RLS. Hay RLS activo en todas las tablas pero **cero políticas** [V: `lib/landing/supabase.ts:6-12`; grep de `create policy` sin resultados]. Para un portal con datos de varios clientes, un solo error en una consulta filtraría datos entre clientes. Hoy no existe una segunda línea de defensa.
3. **Hay huecos de autorización que deben cerrarse antes de dar acceso a cualquier persona externa** (sección 5):
   - acciones de servidor sin ningún chequeo;
   - revelado de credenciales con solo tener sesión;
   - los "member" ven todos los clientes y proyectos.
4. **No existe ninguna integración externa de marketing ni de pagos.** No hay MailerLite, GoHighLevel, Stripe, Zoom, analítica, webhooks ni jobs [V]. Lo único público para clientes es la cotización por token `/q/[token]` [V]. Todo el módulo de métricas, QA e integraciones es construcción nueva.
5. **Recomendación:** opción **A**, el portal como rutas nuevas dentro de esta app (`/portal/*`, servible luego por un subdominio), sobre una **capa de datos propia del portal** que siempre filtra por organización, y **RLS real** como segunda defensa. Antes de escribir una línea del portal, la **fase 0** cierra los huecos de seguridad actuales.

---

## 2. Arquitectura actual

### Stack [V: `package.json`]

| Componente | Versión | Nota |
|---|---|---|
| Next.js (App Router) | 16.2.11 | Breaking changes respecto a versiones previas (`AGENTS.md`) |
| React | 19.2.4 | — |
| Clerk (`@clerk/nextjs`) | ^7.9.4 | Única autenticación; roles en `publicMetadata` |
| Supabase (`@supabase/supabase-js`) | ^2.116.0 | Solo PostgreSQL vía REST, con service role, server-only |
| Tailwind | ^4 | Tokens TailGrids en `app/css/*` |
| Zod | ^4.6.5 | Validación de formularios y del server |
| TanStack Table | ^8.21.3 | `components/common/data-table` |
| Recharts | ^3.10.1 | Gráficos |

- **Gestor y comandos:** pnpm 9.15.9. Scripts: `dev`, `build`, `start` y `lint`; no hay script `test` [V].
- **Deploy:** Vercel [I: `app/api/health/route.ts` lee `VERCEL_ENV`; el panel de Vercel muestra el proyecto `laureanosierra`]. No hay `vercel.json` ni CI [V].

### Estructura de rutas [V: `app/`]

| Área | Rutas | Estado |
|---|---|---|
| Inicio | `app/page.tsx` | Implementado, solo owner (`page.tsx:15`) |
| Finanzas personales | `app/finanzas/personal` | Implementado, solo owner (`lib/personal-finance-server.ts:8-13`) |
| Landing Pages | `app/landing-pages/{clients,quotes,projects,tasks,team,finanzas}` + detalles | Implementado |
| Equipo | `app/equipo`, `/equipo/nuevo`, `/equipo/[id]` | Implementado, solo owner (`lib/team.ts:7`) |
| Unidades genéricas | `app/unidad/[slug]`, `app/proyecto/[slug]` (Wonder, Marca personal) | Vistas genéricas [I: livianas comparadas con Landing Pages] |
| Synous AI | Sin ruta interna; link externo a `admin.synousai.com` | Solo link [V: `lib/unidades.ts:188-193`] |
| Marca personal | Sin módulo propio | Pendiente |
| Público | `/sign-in`, `/sign-up`, `/sin-acceso`, `/q/[token]`, `/api/health` | Implementado |
| Route handlers | `app/api/health`, `clients/[id]/export`, `finanzas/exportar` | Los únicos endpoints HTTP [V] |

**Lógica de negocio:** vive en server actions (`app/landing-pages/acciones.ts`, `equipo-acciones.ts`, `app/finanzas/**/actions.ts`, `app/contexto/acciones.ts`). La lectura de datos está en `lib/landing/datos.ts` (25 consultas con `supabaseAdmin()`, sin filtro por usuario) [V].

---

## 3. Inventario

### 3.1 Entidades y relaciones [V: `supabase/migrations/`, 33 archivos]

| Dominio | Tablas | Relaciones clave |
|---|---|---|
| Clientes | `clients`, `client_notes`, `client_resources` | Notas y recursos → `clients` (CASCADE) |
| Proyectos | `projects`, `project_resources`, `project_assignees` | `projects.client_id` → `clients` (SET NULL); asignados por Clerk id en texto, sin FK |
| Tareas | `tasks`, `task_assignees`, `task_attachments`, `processes`, `process_tasks` | `tasks.project_id` → `projects` (CASCADE) |
| Cotizaciones | `quotes`, `quote_items`, `quote_projects`, `quote_payments` | `quotes.client_id` → `clients` (SET NULL); ítems y pagos en CASCADE; `public_token` único parcial |
| Equipo | `team_members`, `team_agreements`, `agreement_projects`, `team_payments`, `fixed_expenses` | `team_members.project_ids` es `uuid[]` sin FK |
| Contexto | `context_units`, `context_projects`, `context_clients`, `movements`, `settings` | — |
| Finanzas personales | `finance_*` (accounts, categories, schedules, obligations, goals, milestones, contributions), `exchange_rates` | `owner_id` en todas las filas, FKs compuestas `(id, owner_id)` |

Otros datos de la base:
- **Funciones:**
  - `recalcular_amount_paid()` y `recalcular_team_amount_paid()`: triggers, `SECURITY DEFINER`.
  - `finance_mutate(p_owner, …)`: `SECURITY DEFINER`, solo service role.
  - `finance_seed_initial(p_owner)` [V].
- **Storage:**
  - Privados con URL firmada: `propuestas` (600 s) y `adjuntos` (300 s).
  - `portadas` se sirve con URL pública [V: `acciones.ts`].
  - Los buckets se crearon fuera del repo [NV].
- **`supabase/schema.sql` está desactualizado:** solo tiene `projects` y `tasks` [V].

### 3.2 Autenticación y roles [V]

- **Middleware** (`proxy.ts`):
  - Rutas públicas: `/sign-in`, `/sign-up`, `/sin-acceso`, `/q/(.*)` y `/api/health` (líneas 5-13).
  - Sin sesión, redirige a `/sign-in`.
  - Lee el rol y las unidades de `publicMetadata` del usuario de Clerk (40-59). Un member sin unidades declaradas recibe `landing-pages` por defecto (58).
- **Roles:** `owner` y `member`; la interfaz muestra "Builder" para member [V: `lib/landing/auth.ts:7-48`, `app/layout.tsx:57`].
- **Visibilidad por sección:** cotizaciones, finanzas y equipo de Landing Pages son solo owner [V: `lib/unidades.ts:163-180`].
- **Guards en las acciones:**
  - `exigirOwner` en cotizaciones, cobros y acuerdos.
  - `exigirSesion` (cualquier usuario logueado) en proyectos, tareas, clientes, recursos, adjuntos, documentos y `revelarCredencial` [V: `acciones.ts:45-60`, `1714-1718`].
- **Usuarios cliente o multi-tenant:** no existen. Los clientes son solo filas de `clients` [V].

### 3.3 Integraciones [V]

| Proveedor | Estado | Evidencia |
|---|---|---|
| Clerk | Implementado | `proxy.ts`, `lib/landing/auth.ts` |
| Supabase (DB + Storage) | Implementado, service role | `lib/landing/supabase.ts` |
| DolarAPI (tipo de cambio) | Implementado | `app/finanzas/personal/actions.ts:206` (timeout 8 s, mantiene la cotización previa si falla) |
| MailerLite, GoHighLevel, Stripe, Zoom | **Ausente** | Solo aparecen en textos y fichas de `contexto/` |
| Analítica (GA4, Clarity, Vercel Analytics, Meta Pixel) | **Ausente** | Sin dependencias ni scripts |
| Webhooks, cron, colas | **Ausente** | Sin handlers ni jobs |
| WhatsApp | Solo links `wa.me` | `lib/landing/tipos.ts:741-748`, `cotizacion-publica.tsx:13` |
| Pagos | Solo `quotes.payment_url` (texto libre) | Migración `20261013000000` |

### 3.4 Observabilidad, pruebas y entornos [V]

- **Logs:** solo `console.error` en `app/error.tsx` y en `proxy.ts`. No hay Sentry ni tabla de auditoría. Los errores se muestran como toast.
- **Reintentos:** no hay automáticos. Finanzas usa idempotencia por `request_id`.
- **Tests:** 4 archivos `scripts/*.test.mjs` con `node:test`. Dos usan `registerHooks` y necesitan Node 22+, pero la máquina de desarrollo tiene Node 20.19.3 [V: ejecutado en esta sesión]. No hay CI.
- **Entornos:**
  - Dev y prod se distinguen solo por el prefijo de las keys de Clerk (`pk_test_`/`pk_live_`).
  - Hay un solo proyecto de Supabase: no hay base de staging [I].
- **Migraciones:** se aplican a mano en el SQL Editor. No hay down-migrations ni scripts de backup. Los documentos se contradicen sobre el método (`ARQUITECTURA.md:292-303` vs `ESTADO.md:258-262`) [V].

### 3.5 UI reutilizable [V]

- **Primitivas** (`components/tailgrids/core/*`): botón, card, table, dialog, select, tabs, sheet y otras.
- **Comunes** (`components/common/*`): data-table, formularios con Zod (`use-zod-form`), empty y error states, page-header, kpi-card, charts.
- **Marca:**
  - Tokens `doc-*` (`app/css/default.css`, `theme.css`) pensados para piezas públicas que no cambian con el tema.
  - El documento público de cotización (`components/landing/cotizacion-publica.tsx`).
  - Logos en `public/logotipo-azul.png` y `public/brand/logotipo.svg`.
- **Patrón de link con token:** `app/q/[token]` + `generarLinkCotizacion` (18 bytes aleatorios, revocable).

---

## 4. Seguridad, roles y multi-tenancy

| Tema | Estado actual | Implicancia para el portal |
|---|---|---|
| Aislamiento por cliente | Inexistente: un solo espacio global [V] | Hay que crear el concepto de organización desde cero |
| Defensa en la base | RLS activo sin políticas + service role [V] | Un bug en una consulta del portal = datos de otro cliente expuestos |
| Autorización por acción | Mezcla de `exigirOwner`, `exigirSesion` y **nada** [V] | Las acciones existentes no sirven tal cual para usuarios externos |
| Visibilidad de member | Ve todos los clientes, proyectos y tareas [V: `lib/landing/datos.ts`, sin filtro] | Un ejecutor interno hoy ve todo; un cliente no puede heredar este modelo |
| Credenciales | Cifradas AES-256-GCM, pero las revela cualquier usuario con sesión [V: `acciones.ts:1714-1718`] | Riesgo alto si entra alguien no confiable |
| Registro de usuarios | `/sign-up` es ruta pública [V]; si Clerk permite registro abierto, **no se puede saber desde el repo** [NV] | Ver riesgo R1 |
| Rutas públicas | `/q/[token]` expone solo campos de presentación; `project_id` se anula [V: `lib/landing/datos.ts:292-318`]; noindex solo por meta tag [V] | Buen patrón base para documentos de cliente |
| `/api/health` | Público; informa qué variables de entorno existen y su largo, y si Clerk está en modo test o live (nunca valores) [V] | Divulgación menor de información |
| Datos personales | `clients` (mail, teléfono, Instagram), transcripciones en `client_notes`; nombres y UUIDs reales en migraciones versionadas [V esquema, NV contenido] | El portal sumaría datos de leads de terceros: necesita minimización y retención |

---

## 5. Riesgos críticos y deuda técnica

| # | Severidad | Riesgo | Evidencia | Acción |
|---|---|---|---|---|
| R1 | ~~Crítico (a confirmar)~~ Resuelto: registro solo por invitación | Si el registro de Clerk está abierto, cualquiera que se registre entra como `member` con Landing Pages: ve todos los clientes y proyectos y puede revelar credenciales | `proxy.ts:58` (unidad por defecto), `/sign-up` público [V]; modo de registro de Clerk [NV] | Verificar **hoy** en el dashboard de Clerk que el registro esté en modo restringido o solo por invitación. A mediano plazo, que un usuario sin rol declarado no reciba acceso por defecto |
| R2 | Alto | `app/contexto/acciones.ts` (`editarProyecto`, `cambiarEstadoCliente`, `crearProyecto`, `crearCliente`) no verifica sesión ni rol | grep sin `auth`/`exigir` [V] | Agregar guard explícito en cada acción |
| R3 | Alto | `revelarCredencial` y la exportación de cliente (`clients/[id]/export`) solo exigen sesión | `acciones.ts:1718`, `export/route.ts:35-36` [V] | Restringir a owner o a quien esté asignado al proyecto |
| R4 | Alto | Sin RLS efectivo: toda la seguridad depende de que cada consulta filtre bien | `lib/landing/supabase.ts`, 0 políticas [V] | Capa de datos del portal con filtro obligatorio por organización + RLS con políticas para las tablas del portal |
| R5 | Medio | El middleware deja pasar la request si falla la lectura del usuario en Clerk ("fail-open") | `proxy.ts:47-52` [V] | Aceptable solo si cada página o acción revalida; R2 demuestra que no siempre pasa |
| R6 | Medio | Sin observabilidad: no hay logs estructurados, alertas ni auditoría de quién cambió qué | §3.4 [V] | Imprescindible antes de recibir webhooks de clientes |
| R7 | Medio | Migraciones manuales, sin staging, sin rollback documentado, `schema.sql` viejo | §3.4 [V] | Base de staging, procedimiento de backup y down-migration por cada cambio del portal |
| R8 | Medio | Tests no ejecutables con el Node instalado y sin CI | §3.4 [V] | Fijar Node 22 (`.nvmrc` + `engines`), script `test`, CI mínima |
| R9 | Bajo | `/api/health` público expone metadatos del entorno | §4 [V] | Restringir o reducir la respuesta |
| R10 | Bajo | Nombres y UUIDs reales hardcodeados en migraciones versionadas | `20260927160000`, `20261008020000` [V] | No repetir el patrón con datos de leads |

---

### Estado de la fase 0 (actualizado 2026-10-13)

| # | Estado | Detalle |
|---|---|---|
| R1 | **Resuelto (confirmado por el owner)** | El registro de Clerk es solo por invitación. No es verificable desde el repo; queda como chequeo manual si cambia el plan de Clerk |
| R2 | **Corregido** | `app/contexto/acciones.ts`: cada acción exige sesión y acceso a la unidad; la unidad se lee de la base, no del formulario |
| R3 | **Corregido** | `revelarCredencial`: owner, o member asignado al proyecto (o a algún proyecto del cliente, para credenciales del cliente). Export de la ficha de cliente: solo owner, y el botón se oculta a los members |
| R12 (nuevo) | **Corregido** | Subir, descargar y borrar el PDF de una cotización (`subirDocumento`, `urlDocumento`, `borrarDocumento`) y `guardarAjuste` (configuración global) solo exigían sesión. Ahora son solo del owner. Además, `revelarCredencial` ya no distingue una credencial inexistente de una ajena, y los errores de "ya existe" no muestran el mensaje crudo de Postgres |
| R11 (nuevo) | **Corregido** | La ficha del cliente mostraba sus cotizaciones (títulos y montos) a los members, aunque Cotizaciones es una sección solo del owner. Ahora no se cargan ni se muestran |
| R8 | **Corregido en parte** | Scripts `test` y `typecheck`, `.nvmrc` con Node 22, CI en GitHub Actions (lint, tipos, tests). Se actualizaron 3 tests que habían quedado desactualizados con la migración de UI. **Falta:** Node 22 en la máquina local |
| R4, R5, R6, R7, R9, R10 | Pendientes | R4 se resuelve en las fases 1-2. Staging y backups (R7) dependen de accesos a Supabase |

**Efecto a tener en cuenta (R3):** un member que hoy no figura como asignado a un proyecto deja de poder ver sus credenciales. Hay que revisar las asignaciones del equipo antes del deploy.

## 6. Qué reutilizar, qué extender y qué construir

| Reutilizar tal cual | Extender | Construir nuevo |
|---|---|---|
| Clerk como proveedor de identidad | `clients` con vínculo a la organización del portal | Organizaciones y membresías de clientes |
| Patrón de link público con token (`/q/[token]`) | `proxy.ts`: rutas `/portal/*` con reglas propias | Capa de datos `lib/portal/*` con filtro obligatorio por organización |
| Tokens `doc-*`, logos y documento público de cotización | `quotes` visibles en el portal (solo campos públicos) | Lanzamientos, landings y variantes, mapeo de URLs |
| Primitivas TailGrids, data-table, formularios con Zod | `projects` (ya tiene `site_url`) como landing de un lanzamiento | Checklist de QA con evidencias, incidencias |
| Tareas y asignados internos | `tasks` vinculadas a solicitudes del cliente | Solicitudes, aprobaciones, informes de cierre |
| Storage privado con URL firmada | — | Webhooks entrantes (MailerLite, Stripe) con verificación, idempotencia y log |

---

## 7. Alternativas de arquitectura

| Criterio | A. Rutas nuevas en esta app | B. Frontend separado, mismo backend/DB | C. App independiente vía APIs |
|---|---|---|---|
| Tiempo de implementación | **Menor**: reutiliza auth, UI, datos y deploy | Medio: duplica UI base y auth | Mayor: contrato de API, dos deploys |
| Complejidad | Baja-media | Media | Alta |
| Seguridad / aislamiento | Riesgo de mezclar contextos: se mitiga con capa de datos propia + RLS + segmento de rutas aislado | Similar a A: la DB y la service role siguen compartidas | El mejor aislamiento, solo si la API es la única puerta |
| Costo operativo | Un deploy, un proyecto | Dos deploys | Dos deploys + API + versionado |
| Reutilización | Total (componentes, tokens, Clerk, Supabase) | Parcial (habría que extraer un paquete compartido) | Baja |
| Riesgo para Finanzas y Synous | Medio si no se aísla; bajo con las fases 0-1 | Bajo-medio | Bajo |

**Recomendación: A**, con estas condiciones:
1. **Segmento propio** `app/portal/*` con su layout, sin el `AppShell` interno. El patrón ya existe: el layout excluye `/q/` del shell [V: `app/layout.tsx`].
2. **Capa de datos exclusiva** (`lib/portal/*`): cada función recibe el `orgId` de la sesión y filtra por él. El portal nunca importa `lib/landing/datos.ts`.
3. **Defensa en profundidad:** las consultas del portal usan un cliente de Supabase autenticado con el token de Clerk (integración de terceros de Supabase) y **políticas RLS por organización** en las tablas del portal. La service role queda solo para el panel interno y los webhooks. *(Validar la integración Clerk ↔ Supabase en staging antes de adoptarla.)*
4. **Dominio:** empezar en `app.laureanosierra.com/portal`. Si la marca lo requiere, sumar un subdominio (por ejemplo `portal.sierralabs.com`) apuntando al mismo deploy, con un rewrite por host en `proxy.ts`. No hace falta una segunda app para eso.
5. **Plan B:** si el portal crece a muchos clientes o equipo propio, la capa `lib/portal/*` ya aislada permite extraerlo a B sin reescribir.

---

## 8. Modelo de datos propuesto para el MVP

*Propuesta, no ejecutada. Todas las tablas del portal llevan `client_id not null` (la clave de tenant), índice por esa columna y RLS con políticas.*

| Entidad | Campos mínimos | Relación |
|---|---|---|
| `client_orgs` | `client_id` (PK/FK → `clients`), `clerk_org_id` único | Une la organización de Clerk con el cliente existente |
| Membresías y roles | En Clerk Organizations (`org:admin`, `org:member`) | Roles internos (`owner`, ejecutor) siguen en `publicMetadata` |
| `launches` | `id`, `client_id`, `nombre`, `estado`, `fecha_inicio`, `fecha_fin`, `meta_registros` | → `clients` |
| `launch_pages` | `id`, `launch_id`, `project_id?`, `variante` (a/b/c), `url`, `url_gracias`, `url_whatsapp`, `url_checkout`, `destino_leads` (mailerlite/ghl + grupo/lista) | → `launches`, opcional → `projects` |
| `launch_integrations` | `id`, `launch_id`, `proveedor`, `referencia` (grupo/lista/producto), `estado_verificacion`, `verificado_at` | Sin secretos: las API keys van cifradas en una tabla aparte, solo para el server |
| `funnel_events` | `id`, `launch_id`, `page_id?`, `tipo` (visita/registro/pago), `fuente`, `utm_*`, `occurred_at`, `external_id` único (idempotencia), `lead_ref` (hash, no el mail) | Inmutables; base para las métricas |
| `metric_snapshots` | `launch_id`, `page_id`, `fecha`, `visitas`, `registros`, `fuente`, `sincronizado_at` | Agregados diarios; el portal muestra fuente y última sincronización |
| `qa_checks` | `id`, `launch_id`, `item`, `estado` (sin probar/ok/falla), `probado_por`, `probado_at`, `evidencia_url` | Nada figura "saludable" sin una prueba registrada |
| `incidents` | `id`, `launch_id`, `descripcion`, `severidad`, `estado`, `abierta_at`, `cerrada_at` | → `launches` |
| `requests` | `id`, `client_id`, `launch_id?`, `titulo`, `detalle`, `prioridad`, `estado`, `responsable_user_id`, `vence_at` | Opcional → `tasks` internas |
| `approvals` | `id`, `request_id` o `launch_page_id`, `aprobado_por`, `aprobado_at`, `comentario` | Registro de quién aprobó qué |
| `launch_reports` | `id`, `launch_id`, `contenido`, `publicado_at` | Manual en V1 |
| `webhook_log` | `id`, `proveedor`, `recibido_at`, `firma_ok`, `procesado`, `error`, `payload` (sin datos personales innecesarios, con retención) | Auditoría e investigación de "no llegó el registro" |

- **Fuentes de verdad:** las plataformas del cliente (MailerLite, GHL, Stripe) siguen siendo dueñas de sus datos. El portal guarda eventos verificados y agregados, con la fuente y la fecha de sincronización a la vista.
- **Datos personales de leads:** en V1 solo agregados y `lead_ref` hasheado. Si hace falta la tabla nominal de registros (como la que pide hoy el growth operator), va en una tabla separada, con retención definida y solo para roles autorizados. Revisar el encuadre legal (Ley 25.326 en Argentina; RGPD si hay clientes o leads en la UE) [NV].
- **Migración:** todo es aditivo, sin tocar tablas existentes salvo para agregar vínculos. Cada migración del portal lleva su down-migration documentada.

---

## 9. Alcance del MVP

**Pantallas del cliente** (`/portal`):
1. **Mis lanzamientos:** lista con estado y fechas.
2. **Launch Control:** detalle del lanzamiento con landings y variantes, URLs, página de gracias, link de WhatsApp, checkout, destino de los leads y responsables.
3. **Funnel Health:** el checklist de QA con el estado de cada prueba y su evidencia.
4. **Funnel Analytics:** registros por landing y variante, conversión, UTMs y exportación CSV. Solo con fuentes conectadas, mostrando fuente y última sincronización.
5. **Operations Desk:** crear solicitudes, ver su estado y responsable, aprobar entregables.
6. **Cotizaciones del cliente:** reusar el documento público existente.
7. **Informe de cierre:** manual en V1.

**Pantallas internas:** alta de organización y vínculo con el cliente, gestión de lanzamientos, carga de QA, bandeja de solicitudes y log de webhooks.

**Flujo de datos de V1:** el webhook de MailerLite (`subscriber.created`) entra con verificación de firma, se guarda en `webhook_log` y genera un `funnel_event`. Las visitas, solo si hay una fuente conectada (script propio o analítica); si no, el panel muestra "sin fuente".

**Fuera del MVP:**
- CRM propio.
- Atribución de ventas.
- Recuperación de carritos.
- Membresía individual de WhatsApp (sin API oficial).
- Datos de inversión en anuncios.
- IA.
- Edición de automatizaciones de terceros.
- Cualquier escritura en las plataformas del cliente.

---

## 10. Roadmap

| Fase | Contenido | Depende de | Complejidad |
|---|---|---|---|
| 0. Seguridad base | R1 (Clerk), R2, R3; un usuario sin rol no recibe acceso por defecto; Node 22 + script `test` + CI mínima; staging de Supabase y procedimiento de backup | — | **S-M** |
| 1. Identidad y tenancy | Clerk Organizations, `client_orgs`, segmento `/portal` aislado, roles internos vs cliente | 0 | M |
| 2. Datos y APIs | Capa `lib/portal/*`, RLS por organización (validar Clerk ↔ Supabase), tests de aislamiento | 1 | M-L |
| 3. UX/UI | Layout del portal con marca Sierra Labs (tokens `doc-*`), navegación, estados vacíos | 1 | M |
| 4. Campañas y QA | `launches`, `launch_pages`, `qa_checks`, `incidents`; Launch Control y Funnel Health | 2, 3 | M |
| 5. Métricas | Webhooks con firma, idempotencia y `webhook_log`; `funnel_events` y `metric_snapshots`; Funnel Analytics + CSV | 4 | L |
| 6. Solicitudes | `requests`, `approvals`, vínculo a tareas; Operations Desk | 2, 3 | M |
| 7. Piloto MailerLite | Primer cliente real (ver flujo seguro abajo) | 4, 5 | M |
| 8. Segundo cliente GHL | Adaptador de GHL sobre el mismo modelo de eventos | 7 | M |

**Flujo seguro para el primer cliente (sin romper un embudo con tráfico):**
1. El portal **solo escucha**: el formulario sigue enviando a MailerLite como hoy, y el webhook es un efecto lateral. Si el portal falla, no se pierde ningún registro.
2. Se configura el webhook **antes** de prender los anuncios y se valida con un registro de prueba registrado en `qa_checks`.
3. Los cambios en las landings (campos ocultos de UTM) se publican y se prueban de punta a punta antes del lanzamiento, nunca con tráfico activo.
4. Durante el lanzamiento, nada de código nuevo en el camino del registro (congelamiento).
5. Al cierre, comparar los conteos del portal contra MailerLite para medir la confiabilidad.

---

## 11. Criterios de aceptación y pruebas mínimas

- **Aislamiento:** un usuario de la organización A no puede leer ni escribir nada de la B, ni por página, ni por server action, ni por API, ni por consulta directa con su token. Test automatizado por cada tabla del portal.
- **Roles:**
  - Un usuario cliente no accede a `/landing-pages`, `/finanzas`, `/equipo` ni `/`.
  - Un member interno no accede a finanzas ni a credenciales que no le correspondan.
  - Test de cada server action con cada rol.
- **Webhooks:**
  - Una firma inválida se rechaza.
  - Un evento repetido no se duplica (idempotencia por `external_id`).
  - Un error queda en `webhook_log` y no rompe el envío del proveedor.
- **Funnel Health:** ningún ítem figura "ok" sin una prueba registrada con fecha y responsable.
- **Métricas:** cada número muestra su fuente y su última sincronización. Un conteo sin fuente se muestra como "sin fuente", no como 0.
- **Rutas públicas:** no exponen IDs internos, notas, cobros ni datos de leads (test de snapshot de la respuesta).
- **Operación:** migración y rollback probados en staging; build, lint, typecheck y tests en CI antes de cada deploy.

---

## 12. Preguntas abiertas y accesos necesarios

1. **Clerk:** ¿el registro está abierto, restringido o solo por invitación? ¿Está habilitado Organizations en el plan? (Define R1 y la fase 1.)
2. **Supabase:** ¿hay backups o point-in-time recovery activos? ¿Se puede crear un proyecto de staging?
3. **Dominio del portal:** ¿`app.laureanosierra.com/portal` o un subdominio de Sierra Labs? ¿Quién controla el DNS?
4. **MailerLite:** ¿la cuenta es del cliente o de Sierra Labs? ¿Quién genera la API key? ¿El webhook trae los campos personalizados (UTMs) o hay que consultarlos aparte? (La documentación oficial no lo aclara.)
5. **Visitas:** ¿qué fuente se acepta en V1 (script propio, GA4, Clarity)? ¿Las landings están en código propio, en MailerLite o en GHL?
6. **Zoom:** ¿el webinar exige registro? Sin eso no se puede cruzar la asistencia por email.
7. **Datos personales:** ¿qué datos de leads necesita ver el cliente en el portal y por cuánto tiempo?
8. **Usuarios cliente:** ¿quién recibe acceso por organización (growth operator, la marca, la persona de email)?
9. **Accesos requeridos para avanzar:** dashboard de Clerk, dashboard de Supabase (solo lectura de configuración), proyecto de Vercel y cuenta de MailerLite del cliente piloto.
