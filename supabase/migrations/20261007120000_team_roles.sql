-- Editable role content supplied by the owner; no schema or account changes.
-- Source: contexto/equipo.md. Only update existing profiles matching the snapshot.
-- Replays and later edits cannot be overwritten: changed fields no longer match before.
begin;

with payload as (
  select value as profile
  from jsonb_array_elements($team_roles$
[
  {
    "id": "laureano",
    "before": {
      "role": "Dirección / Growth / Producto",
      "does": "Ventas\nOferta\nPricing\nDirección estratégica\nProducto\nContratación\nDecisiones financieras\nRelaciones importantes con clientes\nDirección de proyectos importantes\nContenido donde necesito aparecer yo",
      "delegates": "Diseño\nDesarrollo\nImplementación\nResponsive\nEdición\nProducción de contenido\nTareas operativas repetitivas\nQA inicial",
      "approves": "Dirección visual importante\nEntregables clave\nCambios de alcance\nLanzamientos finales\nDecisiones sensibles de cliente",
      "monitors": "Deadlines\nEstado de proyectos\nEquipo\nCostos\nMargen\nCobros\nBloqueos",
      "responsibilities": ""
    },
    "after": {
      "role": "Founder / Dirección Comercial, Growth y Producto",
      "does": "- Ventas.\n- Oferta.\n- Pricing.\n- Dirección estratégica.\n- Producto.\n- Growth.\n- Marketing.\n- Contratación.\n- Decisiones financieras.\n- Relaciones importantes con clientes.\n- Dirección de proyectos clave.\n- Contenido donde Laureano tenga que aparecer.\n- Definición de prioridades.",
      "delegates": "- Diseño web.\n- Desarrollo.\n- Implementación.\n- Responsive.\n- Mantenimiento.\n- Edición de video.\n- Diseño de carruseles.\n- Producción de contenido.\n- Gestión de equipo creativo.\n- QA inicial.\n- Tareas repetitivas.\n- Modificaciones técnicas operativas.",
      "approves": "- Dirección visual importante.\n- Entregables clave.\n- Cambios de alcance.\n- Lanzamientos finales.\n- Decisiones sensibles con clientes.\n- Cambios de producto importantes.\n- Decisiones que afecten posicionamiento.\n- Compromisos de dinero o deadlines relevantes.",
      "monitors": "- Deadlines.\n- Estado de proyectos.\n- Equipo.\n- Costos.\n- Margen.\n- Cobros.\n- Bloqueos.\n- Leads.\n- Propuestas.\n- Cierres.\n- Facturación.",
      "responsibilities": "## Misión\nHacer crecer los negocios, generar oportunidades comerciales, cerrar proyectos y dirigir la visión general, construyendo un equipo capaz de entregar los servicios sin depender de su ejecución diaria.\n\n## Responsabilidades principales\n\n### Comercial / Ventas\n- Generar oportunidades.\n- Prospectar.\n- Hacer follow-ups.\n- Llevar llamadas comerciales.\n- Crear propuestas.\n- Negociar.\n- Cerrar proyectos.\n- Definir pricing.\n- Detectar oportunidades de upsell y recurrencia.\n\n### Marketing / Growth\n- Dirigir estrategia de adquisición.\n- Definir dirección de marca personal.\n- Definir mensajes, posicionamiento y narrativa.\n- Crear contenido cuando su presencia sea necesaria.\n- Diseñar funnels.\n- Detectar nuevos canales de captación.\n- Analizar qué contenido/canal genera leads y ventas.\n\n### Oferta / Producto\n- Mejorar la oferta de Landing Pages.\n- Definir qué se vende en Synous.\n- Detectar nuevas oportunidades de producto.\n- Entender necesidades del mercado.\n- Definir alcance de proyectos.\n- Decidir qué construir y qué no.\n- Mejorar la propuesta de valor.\n\n### Dirección\n- Definir prioridades.\n- Asignar responsables.\n- Dar dirección inicial a proyectos.\n- Definir resultados esperados.\n- Establecer checkpoints.\n- Resolver bloqueos importantes.\n- Tomar decisiones sobre alcance, dinero, tiempos y clientes.\n\n### Equipo\n- Elegir personas.\n- Definir roles.\n- Delegar responsabilidades.\n- Aumentar autonomía del equipo.\n- Dar feedback.\n- Revisar performance.\n- Asegurar que cada área tenga un responsable.\n\n### Finanzas / Negocio\n- Conocer facturación.\n- Conocer costos.\n- Conocer margen por proyecto.\n- Revisar caja.\n- Definir pricing.\n- Definir objetivos financieros.\n- Decidir reinversión.\n- Controlar cuánto queda para Laureano.\n\n## NO debería hacer recurrentemente\n- Diseñar landings.\n- Programar landings.\n- Resolver responsive.\n- Mantener sitios.\n- Editar reels.\n- Diseñar carruseles.\n- Perseguir entregas del equipo.\n- Resolver tickets pequeños.\n- Cargar contenido.\n- Hacer QA inicial.\n- Decir constantemente cuál es la siguiente tarea de cada persona.\n\n## Resultado esperado\nLaureano concentra su tiempo en crecimiento, ventas, estrategia, producto y dirección, mientras el equipo ejecuta y entrega sin depender de su operación diaria.\n\n# EQUIPO — ESTRUCTURA ACTUAL\n\nEste documento define quién hace qué dentro de la operación actual, qué nivel de autonomía tiene cada persona y qué cosas siguen dependiendo de Laureano.\n\nLa intención es evitar superposición de tareas, dependencia innecesaria y falta de claridad.\n\n# ESTRUCTURA GENERAL\n\n## Landing Pages / Web\n**Laureano**\nDirección / Comercial / Growth / Producto\n\n↓\n\n**Bruno**\nResponsable Operativo Web\n\n↓\n\n**Ulises**\nPotencial Operador Web Junior\n\n---\n\n## Marca Personal\n**Laureano**\nDirección / Identidad / Mensaje\n\n↓\n\n**Cielo**\nResponsable de Marca Personal y Contenido\n\n↓\n\n**Equipo creativo**\n- Editor/es.\n- Diseñador/es.\n- Colaboradores.\n\n---\n\n## Synous\n**Laureano**\nComercial / Marketing / Producto\n\n↔\n\n**Jeremías**\nTecnología / Delivery / Desarrollo\n\n↓\n\n**Developers**\n\n# REGLA GENERAL DE DELEGACIÓN\n\nCada tarea nueva debe pasar por estas preguntas:\n\n1. ¿Necesita realmente que la haga Laureano?\n2. ¿Puede delegarse?\n3. ¿Solo requiere aprobación?\n4. ¿Solo requiere monitoreo?\n5. ¿Puede automatizarse?\n6. ¿Realmente hace falta hacerla?\n\nLaureano debe intentar permanecer principalmente en:\n\n- crecimiento,\n- ventas,\n- marketing,\n- estrategia,\n- producto,\n- dirección.\n\n# FORMATO MÍNIMO PARA DELEGAR\n\nToda tarea delegada debería incluir:\n\n## QUÉ\nResultado esperado.\n\n## POR QUÉ\nPor qué importa.\n\n## DONE\nCómo sabemos que está terminada.\n\n## CUÁNDO\nDeadline o checkpoint.\n\n## AUTONOMÍA\nQué puede decidir la persona sin consultar.\n\n# PRINCIPIO OPERATIVO\n\nLa meta no es que Laureano haga más tareas.\n\nLa meta es:\n\n**que más cosas sucedan correctamente sin necesitar que Laureano las ejecute personalmente.**"
    }
  },
  {
    "id": "bruno",
    "before": {
      "role": "Responsable Operativo Web",
      "autonomous_decisions": "",
      "approval_required": "",
      "responsibilities": ""
    },
    "after": {
      "role": "Responsable Operativo Web",
      "autonomous_decisions": "- Cómo implementar técnicamente una solución.\n- Estructura interna del código.\n- Responsive.\n- Componentes.\n- Ajustes visuales menores.\n- Resolución de bugs.\n- Correcciones técnicas.\n- Orden operativo de sus tareas.\n- Soluciones que no modifiquen alcance ni promesa al cliente.",
      "approval_required": "- Cambios importantes de dirección visual.\n- Cambios grandes de UX.\n- Agregar o eliminar secciones.\n- Cambios de alcance.\n- Cambios que afecten precio.\n- Cambios que afecten deadline.\n- Cambios que modifiquen lo prometido al cliente.\n- Problemas sensibles con clientes.\n- Decisiones que impliquen rehacer partes importantes.",
      "responsibilities": "## Misión\nAbsorber la ejecución operativa de los proyectos web para liberar a Laureano de tareas técnicas y operativas.\n\n## Responsabilidades\n- Ejecutar Landing Pages de punta a punta.\n- Ejecutar sitios web.\n- Ejecutar rediseños.\n- Mantener clientes de Wonder Digital Agency.\n- Ejecutar proyectos como Tango Porteño.\n- Resolver modificaciones técnicas puntuales.\n- Implementar cambios de código.\n- Responsive.\n- Integraciones simples.\n- Correcciones.\n- QA inicial.\n- Publicación.\n- Registrar horas cuando corresponda.\n- Avisar bloqueos a tiempo.\n\n## Nivel actual\n- Criterio: medio/alto.\n- Ejecución: medio/alto.\n- Autonomía: medio/bajo.\n\n## Prioridad de desarrollo\nAumentar autonomía.\n\n## Resultado esperado\nLaureano puede darle un proyecto, definir dirección y checkpoints, y Bruno lo lleva adelante sin necesitar instrucciones constantes.\n\n## Evolución del rol\nHoy:\n**Responsable Operativo Web**\n\nFuturo:\n**Responsable de Proyectos Web / Lead Operativo Landing Pages**"
    }
  },
  {
    "id": "cielo",
    "before": {
      "role": "Operaciones Marca Personal",
      "autonomous_decisions": "",
      "approval_required": "",
      "responsibilities": ""
    },
    "after": {
      "role": "Responsable de Marca Personal y Contenido",
      "autonomous_decisions": "- Organización del calendario.\n- Deadlines internos.\n- Qué diseñador/editor hace cada pieza.\n- Seguimiento al equipo.\n- Organización de materiales.\n- Distribución de producción.\n- Búsqueda de referencias.\n- Preparar primeras versiones de guiones.\n- Proponer ideas.\n- Resolver cuestiones operativas.",
      "approval_required": "- Mensaje central.\n- Posicionamiento.\n- Opiniones fuertes.\n- Narrativa personal.\n- Historias personales.\n- Contenido sensible.\n- Oferta.\n- Promesas comerciales.\n- Guiones importantes.\n- Contenido que defina la identidad pública de Laureano.",
      "responsibilities": "## Misión\nDirigir y operar el ecosistema de contenido de la marca personal de Laureano para que exista producción constante sin que Laureano tenga que gestionar diseñadores, editores ni calendario.\n\n## Responsabilidades\n- Buscar ideas.\n- Buscar referencias.\n- Proponer ángulos de contenido.\n- Crear y estructurar guiones.\n- Ayudar en grabación.\n- Coordinar creación de contenido.\n- Gestionar editores.\n- Gestionar diseñador de carruseles.\n- Organizar calendario editorial.\n- Gestionar entregas.\n- Gestionar revisiones.\n- Organizar reels.\n- Organizar historias.\n- Organizar carruseles.\n- Mantener coherencia estética.\n- Mantener coherencia narrativa.\n- Detectar faltantes de contenido.\n- Asegurar que haya contenido disponible todas las semanas.\n\n## Nivel actual\n- Criterio: medio.\n- Ejecución: medio.\n- Autonomía: alta.\n\n## Prioridad de desarrollo\nAumentar criterio estratégico y dirección de contenido.\n\n## Resultado esperado\nLa marca personal tiene contenido constante todas las semanas sin que Laureano tenga que perseguir al equipo.\n\nAdemás:\nEl contenido genera crecimiento, posicionamiento, conversaciones y oportunidades comerciales.\n\n## Evolución del rol\nHoy:\n**Responsable de Marca Personal y Contenido**\n\nFuturo:\n**Brand / Content Lead**"
    }
  },
  {
    "id": "jeremias",
    "before": {
      "role": "Dirección Técnica Synous",
      "autonomous_decisions": "",
      "approval_required": "",
      "responsibilities": ""
    },
    "after": {
      "role": "Socio / Responsable Técnico y Delivery de Synous",
      "autonomous_decisions": "- Arquitectura técnica.\n- Soluciones técnicas.\n- Stack y herramientas.\n- Organización del código.\n- Distribución de tareas.\n- Decisiones técnicas internas.\n- Refactors.\n- Resolución de bugs.\n- Prioridades técnicas dentro de un alcance definido.\n- Qué tareas delegar a otros developers.",
      "approval_required": "## Necesita decidir con Laureano\n\n- Cambios de alcance.\n- Nuevas features no contempladas.\n- Cambios importantes de producto.\n- Decisiones que afecten presupuesto.\n- Decisiones que afecten deadline.\n- Nuevos compromisos con clientes.\n- Costos importantes.\n- Contratación relevante.\n- Cambios que afecten oferta.\n- Cambios que afecten experiencia de usuario.\n- Decisiones que modifiquen la promesa comercial.",
      "responsibilities": "## Misión\nSer responsable de que todo lo vendido por Synous se construya, funcione y se entregue correctamente sin que Laureano tenga que intervenir en la ejecución técnica diaria.\n\n## Responsabilidades\n- Liderar la entrega técnica de Synous.\n- Traducir lo vendido a solución técnica.\n- Desarrollar aplicaciones.\n- Dirigir desarrolladores.\n- Mantener y evolucionar la base reutilizable de Synous.\n- Definir arquitectura técnica.\n- Organizar tareas técnicas.\n- Coordinar developers.\n- Hacer seguimiento del desarrollo.\n- Resolver bloqueos técnicos.\n- Hacer QA técnico.\n- Garantizar que el producto corresponda con lo vendido.\n- Documentar decisiones técnicas importantes.\n- Estimar esfuerzo y tiempos.\n- Detectar necesidades de recursos.\n- Evolucionar el producto y CRM interno de Synous.\n\n## División con Laureano\n\n### Laureano\n- Mercado.\n- Ventas.\n- Marketing.\n- Oferta.\n- Posicionamiento.\n- Funnel.\n- Pricing.\n- Dirección de producto.\n- Experiencia cliente.\n- Dirección comercial.\n\n### Jeremías\n- Tecnología.\n- Delivery.\n- Desarrollo.\n- Arquitectura.\n- Equipo técnico.\n- QA técnico.\n- Implementación.\n- Estimaciones.\n- Evolución tecnológica.\n\n### Compartido\n**Producto**\n\nLaureano aporta:\n- necesidad de mercado,\n- necesidad de cliente,\n- experiencia,\n- negocio.\n\nJeremías aporta:\n- viabilidad,\n- arquitectura,\n- tiempos,\n- costos,\n- reutilización.\n\n## Disponibilidad\nPart-time.\n\nTiene un trabajo externo de aproximadamente 9 horas diarias y puede dedicar alrededor de 4 horas adicionales a Synous.\n\n## Resultado esperado\nCada solución vendida por Synous pasa de definición a producto funcional y entregado sin depender de Laureano para la operación técnica diaria.\n\nAdemás:\nLa base tecnológica de Synous evoluciona y cada nuevo proyecto reutiliza más de lo construido anteriormente.\n\n## Evolución del rol\nHoy:\n**Socio técnico / Developer principal**\n\nFuturo:\n**Technical Lead / Head of Delivery**\n\nMás adelante:\n**CTO / Responsable Técnico de Synous**"
    }
  },
  {
    "id": "ulises",
    "before": {
      "role": "Operador Web",
      "responsibilities": ""
    },
    "after": {
      "role": "Operador Web Junior — Potencial incorporación / Stand by",
      "responsibilities": "## Estado\n**Potencial incorporación / Stand by**\n\nActualmente no forma parte activa del equipo.\n\n## Posible rol futuro\n**Operador Web Junior**\n\n## Posible función\nApoyar en:\n- desarrollo,\n- landings,\n- modificaciones,\n- responsive,\n- componentes,\n- tareas operativas web.\n\n## Condición antes de incorporarlo formalmente\nEvaluar:\n- calidad,\n- velocidad,\n- comunicación,\n- autonomía,\n- criterio,\n- responsabilidad.\n\n## Onboarding recomendado\n1. Tarea pequeña.\n2. Parte acotada de un proyecto.\n3. Landing simple.\n4. Evaluación.\n5. Definir nivel de autonomía.\n\nEn una primera etapa conviene que trabaje bajo Bruno:\n\n**Laureano → Bruno → Ulises**\n\npara evitar generar una nueva dependencia directa hacia Laureano."
    }
  }
]
$team_roles$::jsonb)
)
update team_members as member
set
  role = coalesce(payload.profile->'after'->>'role', member.role),
  responsibilities = coalesce(payload.profile->'after'->>'responsibilities', member.responsibilities),
  autonomous_decisions = coalesce(payload.profile->'after'->>'autonomous_decisions', member.autonomous_decisions),
  approval_required = coalesce(payload.profile->'after'->>'approval_required', member.approval_required),
  does = coalesce(payload.profile->'after'->>'does', member.does),
  delegates = coalesce(payload.profile->'after'->>'delegates', member.delegates),
  approves = coalesce(payload.profile->'after'->>'approves', member.approves),
  monitors = coalesce(payload.profile->'after'->>'monitors', member.monitors),
  updated_at = now()
from payload
where member.id = payload.profile->>'id'
  and to_jsonb(member) @> (payload.profile->'before');

commit;
