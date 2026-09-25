# Sistema Operativo Personal — Reglas

Este repositorio es el **cerebro operativo** de Laureano. Centraliza el contexto
necesario para tomar decisiones rápido y reducir el cambio de contexto entre negocios.

## Qué es fuente de verdad acá

**SÍ vive acá** (contexto operativo):
estado, próximo paso, bloqueos, decisiones, prioridades, dónde vive cada recurso.

**NO vive acá** (solo links):
código (GitHub), archivos (Drive), tareas de Wonder (Trello), deploys (Vercel),
sitios (WordPress), documentos de Marca Personal (Google Docs).

Criterio para decidir si algo entra:
> ¿Es un dato que necesito para DECIDIR, o es un artefacto que produzco?
> Si es un dato → vive acá. Si es un artefacto → vive en su herramienta, acá va el link.

## Estructura

```
contexto/
  <unidad>/
    _unidad.md          ← ficha de la unidad de negocio
    clientes/*.md       ← un archivo por cliente
    proyectos/*.md      ← un archivo por proyecto
INICIO.md               ← generado: qué necesita atención hoy
_plantillas/            ← plantillas para nuevos archivos
```

Unidades: `synous-ai`, `landing-pages`, `wonder-digital`, `marca-personal`.

## Mapa de proyectos

Todo cuelga de `d:\Laureano\Desktop\`. **Las carpetas de trabajo no se mueven.**
Este repo solo guarda contexto y punteros.

| Proyecto | Unidad | Cliente | Entrega | Carpeta / Repo |
| --- | --- | --- | --- | --- |
| Lead Magnet | Landing | Pilar Sousa | 25/07 | Clientes\Pilar Sousa · ejecuta Bruno |
| Página de Ventas | Landing | Pilar Sousa | 27/07 | Clientes\Pilar Sousa · ejecuta Bruno |
| Portfolio | Landing | Mariela Crapuzzi | — | ejecuta Cielo |
| CASC Plataforma | Wonder | CASC | 31/07 | `CASC` · casc-org-ar/CASC |
| Consciencia MCE | Synous | Santiago Gómez | 03/08 | `Consciencia MCE\MCE 2.0` · appconscienciamce/mce-2.0 |
| Software Synous (CRM) | Synous | Interno | — | `Synous AI\devduo\CRMDev` · jeremiasingla/CRMDev |
| Aura Studio AI | Synous | Interno | pausado | `Aura Studio™\Aura Studio App` · jeremiasingla/AuraStudio |
| Sitio Web Synous | Synous | Interno | pausado | no iniciado |
| Mantenimiento Web | Wonder | Ñuke, Wonder | — | WordPress · sin tareas |

Equipo: **Bruno** → landing pages (Pilar). **Cielo** → sitios web (Mariela).
**Jeremías** → software (Consciencia MCE). **Laureano** → dirección + todo.

Notas:
- `Consciencia MCE` tiene `MCE 1.0` y `MCE 2.0`. **Se trabaja la 2.0.**
- `Aura Studio™` lleva el símbolo ™ en el nombre — citar la ruta entre comillas.
- `Landing Pages\Negocio` es la operación propia de la unidad, no un cliente.
- Hay 11 carpetas de clientes en Landing Pages; solo Pilar Sousa y AIDA QUI
  tienen ficha. El resto está listado en `_unidad.md` como inventario.

## Cómo actualizar contexto (lo más importante)

Laureano escribe en lenguaje natural desde la terminal. Ejemplo:

> "terminé la home de Pilar, falta que me pase las fotos, reunión el jueves"

Tu trabajo es descomponerlo y escribirlo en el archivo correcto:
- avance → `## Bitácora` (línea nueva arriba, formato `AAAA-MM-DD — qué pasó`)
- dependencia externa → `## Bloqueos`
- lo que sigue → `## Próximo paso` (reemplaza el anterior, es una sola línea)
- cambio de rumbo → `## Decisiones` (formato `AAAA-MM-DD — decisión — por qué`)

Reglas al escribir:
1. **Actualizá `actualizado:` en el frontmatter** siempre que toques un archivo.
2. **Si un bloqueo se resuelve, borralo.** No lo tachés ni lo dejés como histórico —
   los bloqueos viejos son la principal fuente de datos podridos.
3. **`Próximo paso` es una sola línea.** Si hay tres cosas, es la primera.
4. **No inventes.** Si el mensaje no dice el estado, no lo cambies.
5. Si no está claro a qué proyecto se refiere, preguntá antes de escribir.
6. Después de escribir, regenerá `INICIO.md`.

## Estados

**Proyecto:**
`activo` — se trabaja ahora.
`por-empezar` — todavía no arrancó pero está en el radar (suele tener fecha).
`bloqueado` — hay algo en `## Bloqueos` que impide avanzar.
`pausado` — decisión consciente de no avanzar, sin fecha.
`terminado` — cerrado.

Diferencia clave: `pausado` es "decidí frenarlo"; `por-empezar` es "todavía
no lo toqué pero va a arrancar". Un `por-empezar` con entrega cercana SÍ
aparece en "necesita atención"; un `pausado` nunca.

**Cliente:**
`activo` — hay trabajo en curso.
`stand-by` — relación viva, sin trabajo ahora.
`inactivo` — ya no se trabaja con él.
`prospecto` — todavía no es cliente.

Prioridad: `alta` | `media` | `baja`.

Laureano cambia estos estados diciéndolo por la terminal
("Pilar pasa a stand by"). No los infieras vos.

## Bloqueo vs. trabajo pendiente

`## Bloqueos` es **solo** cuando dependés de un tercero: falta que el cliente
mande material, que aprueben un presupuesto, que llegue un acceso.

Tener tareas pendientes NO es un bloqueo. Si la pelota la tiene Laureano,
eso va en `## Próximo paso`, no en bloqueos.

Cuando el tercero responde, **borrá el bloqueo**.

## Nunca inventar datos

Fechas de entrega, estados, próximos pasos y decisiones salen **solo** de lo
que Laureano dice. No estimes fechas, no infieras estados, no completes
huecos con suposiciones. Un campo vacío es honesto; uno inventado miente.

## Alcance (no romper esto)

Fase 1 = contexto operativo. **Finanzas y dashboard son fase 2 y 3.**
Cliente y proyecto se definen UNA sola vez, acá. Fase 2 va a leer de estos archivos.

Antes de agregar cualquier cosa:
> ¿Esto elimina fricción o solo agrega complejidad?
> Si agrega complejidad, no se desarrolla.

## Dashboard (Next.js)

La app vive en la raíz del repo. Antes de tocar código leer `AGENTS.md`:
Next 16 tiene breaking changes respecto a lo que un modelo "recuerda".
