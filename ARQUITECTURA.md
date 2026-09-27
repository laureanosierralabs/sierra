# Arquitectura — Sistema Operativo

Contexto para una IA que va a asistir con este código. Describe qué existe,
por qué está así, y qué decisiones no conviene revertir sin entender el
motivo.

---

## Qué es

Panel interno de un estudio de landing pages. Un solo usuario dueño
(*owner*) más colaboradores con acceso limitado. No es un SaaS multi-tenant:
no hay organizaciones, planes ni aislamiento entre cuentas.

El repo nació como un sistema de contexto operativo en Markdown y hoy la app
Next.js vive en la raíz. Quedan carpetas heredadas (`contexto/`,
`_plantillas/`) cuyo contenido se migró a Supabase.

---

## Stack

| Pieza | Versión | Nota |
| --- | --- | --- |
| Next.js | 16.2.11 | App Router + Turbopack |
| React | 19.2.4 | |
| Clerk | `@clerk/nextjs` ^7.9.4 | SDK Core 3 |
| Supabase | `@supabase/supabase-js` ^2.116 | Solo Postgres, sin Auth |
| Tailwind | 4 | Tokens propios en `app/globals.css` |
| FullCalendar | 6.1.21 | Fijado: v7 está en RC |
| dnd-kit | core 6.3.1 / sortable 10 | Kanban |
| lucide-react | ^1.26 | Sin íconos de marca |

No hay shadcn/ui ni librería de charts. Los componentes son propios
(`components/landing/`). **Recharts se instaló y se desinstaló**: los
gráficos se quitaron de la pantalla de Finanzas por decisión del usuario.

### Next 16 — leer antes de escribir código

`AGENTS.md` advierte que esta versión tiene breaking changes respecto de lo
que un modelo "recuerda". Los dos que más aparecen:

- El middleware es **`proxy.ts`** en la raíz, no `middleware.ts`.
- `params` y `searchParams` de una página son **Promises**: hay que
  `await`.

Ante la duda, leer `node_modules/next/dist/docs/`.

### Clerk Core 3 — trampa conocida

`sessionClaims.publicMetadata` **no viene en el token de sesión**. Los
claims traen solo `azp/exp/iss/sid/sub/v`. El rol y las unidades se leen con
`clerkClient().users.getUser(userId)`, tanto en `proxy.ts` como en
`accesoActual()`. Intentar sacarlos de los claims devuelve `undefined` en
silencio.

`<SignedIn>` tampoco existe en este SDK.

---

## Modelo de seguridad

```
Browser → Clerk (sesión) → Next.js Server → Supabase (service role)
```

El browser **nunca** habla con Supabase. Reglas que no hay que romper:

1. **RLS activo y sin políticas** en todas las tablas. Una key pública no lee
   ni escribe nada; solo entra la service role desde el servidor.
2. `lib/landing/supabase.ts` importa `server-only`. Si un Client Component lo
   importa, el build falla — es intencional.
3. **Toda Server Action empieza con `exigirSesion()`**, y las que tocan
   dinero o equipo con `exigirOwner()`. Ocultar una sección en la UI no
   alcanza: la acción se puede invocar igual.
4. Las contraseñas de accesos se cifran con AES-256-GCM
   (`lib/landing/cifrado.ts`). La clave vive en `CREDENTIALS_KEY`, nunca en
   la base. El texto cifrado no viaja al cliente: solo si existe o no.

### Roles

- **owner** — ve todo.
- **member** (se muestra como *Builder*) — Inicio, Proyectos, Tareas,
  Clientes. Cotizaciones, Finanzas y Equipo están reservadas.

`lib/unidades.ts` define las secciones; las marcadas `owner: true` no
aparecen en el sidebar y `proxy.ts` bloquea el acceso directo por URL.

`publicMetadata.units` limita a qué unidades entra un member. El owner ignora
esa lista.

---

## Estructura

```
app/
  landing-pages/          unidad principal (todo lo construido vive acá)
    page.tsx              inicio: calendario + proyectos activos
    projects/             lista y detalle
    tasks/                lista, detalle y SOPs
    clients/              lista, detalle y export .md
    quotes/               cotizaciones
    finanzas/             balance, ingresos, egresos, gastos
      acuerdo/[id]/       detalle de un acuerdo con el equipo
      exportar/route.ts   CSV, JSON e informe .md
    team/                 gestión de miembros vía Clerk
    @panel/(.)tasks/[id]  ruta interceptada: panel lateral de tarea
  finanzas/personal/      finanzas personales, aparte del negocio
  sign-in, sign-up        pantallas propias, no las alojadas por Clerk

lib/landing/
  auth.ts        accesoActual(), listarMiembros() — lee Clerk
  datos.ts       todas las lecturas de Supabase
  tipos.ts       tipos, labels y helpers de dominio
  balance.ts     motor de cálculo financiero
  exportar.ts    CSV, JSON, informe Markdown
  supabase.ts    cliente service-role (server-only)
  cifrado.ts     AES-256-GCM
  plantillas.ts  formularios de tarea
  meses.ts       nombreMes() — fuera del componente cliente a propósito

components/landing/   UI de la unidad
components/           UI transversal (sidebar, finanzas personales)
supabase/migrations/  SQL, se corre a mano en el editor de Supabase
```

Las Server Actions están en `app/landing-pages/acciones.ts` (~1200 líneas) y
`equipo-acciones.ts`.

---

## Modelo de datos

### Proyectos y tareas

```
projects ──< tasks
   │           └─ steps (jsonb), template, content (jsonb)
   ├──< project_assignees (user_id de Clerk, texto libre)
   └──< project_resources / client_resources (credenciales cifradas)

processes ──< process_tasks     SOPs: wordpress | codigo
```

- `projects.kind` (`wordpress` | `codigo`) define qué SOP se copia al crear.
- Las tareas del SOP **se copian, no se referencian**: editar un proceso
  después no altera proyectos en curso.
- `projects.start_date` + `due_date` dibujan la barra del calendario.
  `start_date` se exige al crear pero no al editar — los proyectos viejos no
  lo tienen y exigirlo impediría editarles cualquier otra cosa.
- `tasks.template` decide si la tarea muestra un formulario. En ambos SOPs
  solo *Reunión de briefing* lo tiene; el resto usa `steps` (checklist).

### Cotizaciones (ingresos)

```
quotes ──< quote_projects >── projects
   └──< quote_payments
```

Una cotización puede cubrir **varios proyectos** y un proyecto acumular
varias cotizaciones (ampliación de alcance). De ahí la tabla puente.

- `commercial_status`: `draft | sent | approved | rejected | cancelled`
- `payment_status`: `not_applicable | pending | partial | paid` — **derivado**
- `amount_paid` — **derivado**: lo mantiene un trigger sumando
  `quote_payments`. No escribirlo a mano.
- `numero` → código legible `COT-0001`.
- `quote_projects.allocated_amount` — cuánto de la cotización corresponde a
  cada proyecto. **Nullable a propósito**: si es null, la rentabilidad del
  proyecto queda "sin asignar". Nunca repartir el total por promedio.

### Costos de equipo (egresos)

Espejo exacto de cotizaciones:

```
team_agreements ──< agreement_projects >── projects
        └──< team_payments
```

- `amount_paid` y `payment_status` también los mantiene un trigger.
- Un acuerdo **sin proyectos vinculados** es trabajo por horas. Las horas no
  se registran acá — siguen en la planilla de quien las trabaja — solo el
  monto pagado.
- `numero` → `PAG-0001`.

### Gastos operativos

`fixed_expenses` con `period`: `monthly | yearly | once`.

- Anual se prorratea (÷12) para poder compararlo con uno mensual.
- `once` **no** se prorratea ni entra en el gasto fijo mensual: pesa entero en
  su mes.
- Dar de baja es poner `active_until`, no borrar: borrar perdería los meses en
  que sí estuvo vigente.

### Tablas heredadas

`movements` (finanzas personales) y `settings` siguen en uso. `context_*`
quedaron de la migración desde Markdown.

---

## Motor financiero (`lib/landing/balance.ts`)

`cargarFinanzas(mes?)` devuelve todo de una pasada y alimenta tanto la
pantalla como los tres exports — así no pueden contradecirse.

### Reglas que definen cada número

| Indicador | Cálculo |
| --- | --- |
| Cobrado | Suma de `quote_payments` |
| Por cobrar | Cotizaciones `approved` con saldo |
| Previsión | `draft` + `sent` (todavía sin aprobar) |
| Por pagar equipo | Acuerdos con saldo |
| Gasto fijo mensual | Mensuales + anuales÷12 (los `once` no cuentan) |
| **Resultado real** | Cobrado − pagado equipo − gastos |
| Resultado proyectado | Real + por cobrar − por pagar |

Invariantes que hay que preservar:

1. **Una cotización de N proyectos suma una sola vez.** El importe vive en la
   cotización, no en cada proyecto.
2. **Un borrador no es una cuenta por cobrar.** Contarlo infla el número y
   lleva a decidir sobre plata que nadie se comprometió a pagar.
3. **El balance mensual usa fechas de pago efectivo** (`paid_on`), no
   `created_at`, que es cuándo se cargó el dato. Un cobro con la fecha
   equivocada lo manda al mes equivocado — pasó al migrar y hubo que
   corregirlo a mano.
4. **No hay movimientos espejo.** Finanzas lee `quotes` y `team_agreements`
   directamente. Existió un `RegistrarCobro` que copiaba el importe a
   `movements` y se eliminó: contaba el mismo dinero dos veces.
5. **Las monedas no se convierten.** `PorMoneda` acumula USD, ARS y EUR por
   separado.

`resultadoProyectado` y los márgenes se calculan pero **no se muestran**:
alargaban la página y, con proyectos sin costo cargado, un margen del 100%
se leía como excelente cuando solo significaba que faltaba el dato. Se
conservan para el informe `.md`, donde van con su contexto escrito al lado.

---

## Sistema visual

Tokens en `app/globals.css`, expuestos a Tailwind vía `@theme inline`.

- **Semánticos** (`ok`, `warn`, `critical`, `idle`) + su variante `-dim` para
  fondos. Comunican estado y urgencia.
- **Categóricos** (`cat-azul`, `cat-violeta`, `cat-rosa`, `cat-ambar`,
  `cat-teal`, `cat-lima`). Identifican qué *es* algo, no su estado. Color fijo
  por categoría para reconocerla sin leer.
- **Elevación**: `shadow-e1/e2/e3`.
- **Utilidades**: `.vidrio` (blur + saturación), `.fila-hover`,
  `.card-interactiva`, `.filtro-select`.

Soporta claro/oscuro por `prefers-color-scheme` y override manual con
`data-theme`.

Cuidado con Tailwind: **las clases construidas por interpolación no se
generan**. Tailwind escanea el fuente buscando literales, así que
`` `bg-${base}-dim` `` produce una clase que no existe. Hay que escribirlas
completas.

### Tablas

`components/landing/tabla.tsx` (`Tabla` + `TablaHead`) centraliza el
contenedor: scroll interno a partir de 10 filas, scroll horizontal con
`min-w-200`, header sticky con vidrio. Las 11 tablas lo usan. En
`clientes-tabla.tsx` se importa como `Contenedor` porque ahí ya existe una
función `Tabla` local.

---

## Frontera cliente/servidor

Un error que ya ocurrió y conviene no repetir: **importar cualquier cosa de un
módulo `"use client"` arrastra el módulo entero al cliente**. Un Server
Component que importaba una función pura desde el archivo del filtro rompía el
render en producción con un error genérico y sin stack útil.

La regla: las funciones puras que usan ambos lados van a `lib/`, sin
directiva. Por eso existe `lib/landing/meses.ts`.

`useSearchParams()` necesita su propio `<Suspense>`, no alcanza con uno que
envuelva a un componente que suspende por otros motivos.

---

## Migraciones

Están en `supabase/migrations/` y **se corren a mano** en el SQL Editor de
Supabase. No hay runner automático ni CI que las aplique.

Consecuencia práctica: el código puede estar pusheado y la migración sin
correr. Si una página falla con "column does not exist", es eso. Al momento
de escribir esto todas están aplicadas.

Al escribir una migración de datos: `on conflict do nothing` **no protege**
cuando la PK es un uuid generado. Correrla dos veces duplica todo — pasó con
los cobros migrados. Usar `not exists`.

---

## Deuda técnica conocida

### Clientes vs. contactos

`clients.name` guarda una **persona** y `clients.company` la **cuenta
comercial**. Hay empresas con dos contactos, cada uno como fila separada, así
que su facturación aparece partida:

```
Volver al Origen      ← Pilar Sousa, Ismael El Haddar
Wonder Digital Agency ← Rodrigo Descalzo, Victoria Cercone
```

La separación correcta sería una tabla `accounts` con `clients` como
contactos que apuntan a ella. Mientras tanto, la rentabilidad por cliente
agrupa por `company`, que da el número correcto sin migrar nada. Está
documentado como `comment on column` en la migración.

### Otros

- `allocated_amount` está vacío en los 11 vínculos multi-proyecto: esos
  proyectos muestran "sin asignar" en rentabilidad.
- `projects.responsible_user_id` y `tasks.assigned_to` quedaron en la tabla
  tras migrar a las tablas puente. Ya no se escriben.
- `projects.cover_url` y `subirPortada` siguen en el código pero no se
  ofrecen: las portadas usan un patrón visual común.
- El remoto `origin` apunta a un repo borrado. El bueno es `sierra`.

---

## Convenciones

- **Identificadores y UI en español.** Es deliberado y consistente.
- **Comentarios solo cuando el *por qué* no es obvio.** Si el código ya se
  explica, no se comenta.
- **Validación manual en Server Actions**, sin librería de esquemas.
  Helpers: `texto()`, `opcional()`, `varios()`, `fecha()`, `monto()`,
  `unaDe()`, `url()`.
- **Nada de `setState` dentro de `useEffect`** para sincronizar: se usa
  `useSyncExternalStore` o se deriva durante el render. El lint lo marca.
- **Borrado con confirmación** vía `BorrarBoton`.
- Antes de cerrar un cambio: `pnpm lint`, `pnpm exec tsc --noEmit`,
  `pnpm build`.

---

## Fuera de alcance

Se excluyó a propósito, no por falta de tiempo: analytics, automatizaciones,
IA, comentarios, chat, portal de cliente, time tracking, CRM avanzado,
notificaciones, integraciones externas, facturación fiscal, conciliación
bancaria, conversión de monedas, payroll y forecasting.

El criterio del proyecto: *¿esto elimina fricción o solo agrega
complejidad?* Si agrega complejidad, no se desarrolla.
