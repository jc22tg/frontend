# Guía de Migración: De `NetworkMapComponent` a `MapContainerComponent`

Esta guía te ayudará a migrar la lógica y la UI del componente legacy `NetworkMapComponent` a la arquitectura moderna basada en `MapContainerComponent` y subcomponentes reutilizables.

---

## 1. Analiza las funcionalidades actuales

Haz un inventario de las funcionalidades implementadas en `NetworkMapComponent`:
- Herramientas (pan, select, measure, connect, etc.)
- Gestión de capas y filtros
- Renderizado de elementos y conexiones
- Búsqueda y selección de elementos
- Métricas de rendimiento y estadísticas
- Eventos de usuario (zoom, click, doble click, etc.)
- Integraciones con otros módulos (widgets, paneles, etc.)

---

## 2. Mapea funcionalidades a la arquitectura moderna

| Funcionalidad Legacy (`NetworkMapComponent`) | Equivalente Moderno (`MapContainerComponent` y subcomponentes) |
|----------------------------------------------|---------------------------------------------------------------|
| Renderizado principal del mapa               | `MapViewComponent`                                            |
| Panel de elementos                          | `ElementsPanelComponent`                                      |
| Control de capas                            | `LayerControlComponent`                                       |
| Mini mapa                                   | `MiniMapComponent`                                            |
| Herramientas (pan, select, etc.)            | Inputs/outputs y servicios (`MapStateManagerService`)         |
| Métricas y rendimiento                      | Servicios y outputs de subcomponentes                         |
| Filtros y búsqueda                          | Subcomponentes o servicios compartidos                        |
| Eventos de usuario                          | Outputs y métodos en los subcomponentes                       |

---

## 3. Centraliza el estado y la lógica en servicios

- Usa `MapStateManagerService` para el estado global del mapa (herramienta activa, capas, zoom, etc.).
- Usa adaptadores y servicios para la gestión de elementos, conexiones y métricas.
- Evita lógica de estado local en el componente principal; delega en servicios y subcomponentes.

---

## 4. Migra el template y la UI

- Reemplaza el template monolítico por la composición de subcomponentes en `map-container.component.html`.
- Usa inputs y outputs para comunicar eventos y datos entre el contenedor y los subcomponentes.
- Elimina lógica de renderizado directo (SVG, Leaflet, etc.) del componente principal; delega en `MapViewComponent`.

---

## 5. Migra la lógica de eventos y métodos

- Los métodos como `setTool`, `zoomIn`, `zoomOut`, `selectElement`, etc., deben delegar en los servicios modernos.
- Los eventos de usuario (click, doble click, selección, etc.) deben ser manejados por outputs de los subcomponentes y servicios.

---

## 6. Prueba y refactoriza progresivamente

- Migra funcionalidad por bloques, probando cada feature en la nueva arquitectura.
- Usa logs y métricas para comparar rendimiento y detectar posibles regresiones.
- Cuando una feature esté estable en la nueva arquitectura, elimina la lógica duplicada del componente legacy.

---

## 7. Deprecación y limpieza

- Cuando todas las vistas y rutas usen la nueva arquitectura, elimina `NetworkMapComponent` y sus dependencias legacy.
- Actualiza la documentación y comunica el cambio al equipo.

---

## Ejemplo de migración de una herramienta

**Antes (legacy):**
```typescript
setTool(tool: string) {
  this.currentTool = tool;
  // lógica interna...
}
```

**Después (moderno):**
```typescript
setTool(tool: ToolType) {
  this.stateManager.setTool(tool);
}
```
Y el subcomponente `MapViewComponent` reacciona automáticamente al cambio de herramienta.

---

## Consejos adicionales

- Centraliza la lógica de estado, renderizado y eventos en servicios y subcomponentes reutilizables.
- Usa ChangeDetectionStrategy.OnPush para mejorar el rendimiento.
- Aprovecha los adaptadores y la arquitectura standalone para desacoplar dependencias.

---

¿Dudas o problemas durante la migración? Consulta al equipo o revisa la documentación de los servicios y subcomponentes modernos. 