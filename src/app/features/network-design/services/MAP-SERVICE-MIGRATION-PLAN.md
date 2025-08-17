# Plan de Migración: Network-Map a Map-Container

## Objetivo
Completar la migración desde el componente monolítico `network-map` hacia la arquitectura modular basada en `map-container` y sus servicios especializados en `/services/map/`.

## Estado Actual
Actualmente la aplicación tiene dos implementaciones paralelas:
- `network-map`: Implementación monolítica original
- `map-container`: Nueva arquitectura modular con servicios especializados

## Plan de Migración en Fases

### Fase 1: Auditoría de Funcionalidades (Semana 1)

**Tarea 1.1: Inventariar funcionalidades de `network-map`**
- Identificar todos los métodos públicos utilizados externamente
- Documentar eventos (Outputs) utilizados por componentes padres
- Catalogar funcionalidades clave y su implementación actual

**Tarea 1.2: Análisis de cobertura actual en `map-container`**
- Evaluar qué servicios ya han sido implementados (MapStateManagerService, MapElementManagerService, etc.)
- Identificar funcionalidades faltantes o incompletas
- Priorizar funcionalidades para implementación

**Tarea 1.3: Definir una matriz de compatibilidad**
- Mapear cada método/evento en `network-map` a su equivalente en `map-container`
- Identificar incompatibilidades y cambios de API necesarios
- Documentar plan de adaptación

### Fase 2: Implementación de Servicios Pendientes (Semana 2-3)

**Tarea 2.1: Completar servicios de mapa existentes**
- Finalizar implementaciones faltantes en MapElementManagerService
- Completar MapInteractionService con todas las herramientas
- Mejorar MapRenderingService para soportar todos los tipos de renderizado

**Tarea 2.2: Crear MapPerformanceService**
- Implementar servicio especializado para optimizaciones de rendimiento
- Migrar lógica de clustering, virtualización y renderizado progresivo
- Incluir monitoreo de FPS y capacidades de auto-ajuste

**Tarea 2.3: Desarrollar MapShortcutsService**
- Migrar la gestión de atajos de teclado a un servicio dedicado
- Implementar registro dinámico de atajos según el contexto

**Tarea 2.4: Crear MapFacadeService**
- Desarrollar fachada que simplifique el uso de todos los servicios
- Proporcionar una API unificada para clientes externos
- Facilitar transición gradual desde implementación monolítica

### Fase 3: Adaptar Componentes UI (Semana 4)

**Tarea 3.1: Extraer componentes reutilizables de network-map**
- Separar el panel de búsqueda en componente independiente
- Extraer panel de filtros como componente reutilizable
- Crear componente para estadísticas y rendimiento

**Tarea 3.2: Actualizar map-container para usar nuevos componentes**
- Integrar componentes extraídos en map-container
- Asegurar consistencia visual y funcional
- Verificar que no haya duplicación de eventos o lógica

**Tarea 3.3: Implementar adaptadores para compatibilidad**
- Crear adaptadores para manejar diferencias en API
- Implementar wrappers para mantener compatibilidad con interfaces existentes
- Asegurar que eventos se propaguen correctamente

### Fase 4: Redireccionamiento y Pruebas (Semana 5)

**Tarea 4.1: Crear estrategia de redirección en rutas**
- Modificar rutas para usar map-container como componente predeterminado
- Implementar lógica de detección para redirigir solicitudes antiguas
- Documentar cambios para otros desarrolladores

**Tarea 4.2: Implementar pruebas exhaustivas**
- Crear pruebas unitarias para todos los nuevos servicios
- Desarrollar pruebas de integración para map-container y componentes
- Establecer pruebas de rendimiento para comparar ambas implementaciones

**Tarea 4.3: Realizar pruebas de usuario**
- Identificar usuarios clave para probar la nueva implementación
- Recopilar retroalimentación sobre usabilidad y rendimiento
- Ajustar implementación según necesidades detectadas

### Fase 5: Deprecación y Eliminación (Semana 6)

**Tarea 5.1: Marcar componentes como obsoletos**
- Añadir anotaciones @deprecated a network-map
- Documentar alternativas en comentarios y documentación
- Emitir advertencias en la consola al usar componentes obsoletos

**Tarea 5.2: Eliminar dependencias**
- Identificar y actualizar componentes que aún dependen de network-map
- Migrar a la nueva implementación
- Verificar que no queden referencias

**Tarea 5.3: Eliminar código obsoleto**
- Remover network-map y archivos relacionados
- Limpiar importaciones y referencias obsoletas
- Actualizar documentación para reflejar la nueva arquitectura

## Matriz de Compatibilidad (Ejemplo)

| Funcionalidad Network-Map | Equivalente Map-Container | Estado |
|---------------------------|---------------------------|--------|
| `selectElement()` | `interactionService.selectElement()` | Completo |
| `zoomIn()` | `stateManager.increaseZoomLevel()` | Completo |
| `toggleElementType()` | `stateManager.toggleLayer()` | Pendiente |
| `loadNetworkData()` | `elementManager.loadElementsProgressively()` | Completo |
| `performanceMetrics` | `renderingService.getPerformanceMetrics()` | Pendiente |

## Seguimiento de Progreso

Se actualizará semanalmente este documento con el progreso en cada fase:

- Fase 1: 🔄 En progreso
- Fase 2: ⏱️ Pendiente
- Fase 3: ⏱️ Pendiente
- Fase 4: ⏱️ Pendiente
- Fase 5: ⏱️ Pendiente

## Consideraciones Adicionales

1. **Retrocompatibilidad**: Durante la transición, se mantendrá compatibilidad hacia atrás para no afectar componentes existentes.

2. **Rendimiento**: Se realizarán pruebas comparativas para garantizar que la nueva implementación sea al menos tan eficiente como la original.

3. **Documentación**: Se actualizará la documentación a medida que se completen las fases para facilitar la adopción.

4. **Capacitación**: Se proporcionarán ejemplos y guías para que otros desarrolladores entiendan la nueva arquitectura.

## Autores y Responsables

- **Responsable técnico**: [Nombre]
- **Responsable de pruebas**: [Nombre]
- **Revisor de código**: [Nombre]
- **Fecha de inicio**: [Fecha]
- **Fecha estimada de finalización**: [Fecha] 