# Migración de Servicios de Rendimiento de Mapa

Este documento describe la migración y consolidación de los servicios relacionados con el rendimiento del mapa.

## Servicios Consolidados

Los siguientes servicios se han consolidado en un único servicio:

- `MapPerformanceService` (servicio original)
- `MapRenderingService` (eliminado)

## Estado Actual

Se ha creado un servicio unificado `MapPerformanceService` en `src/app/features/network-design/services/map/map-performance.service.ts` que incluye todas las funcionalidades de ambos servicios.

El componente `PerformanceWidgetComponent` se ha movido a la ubicación correcta en `src/app/features/network-design/components/widgets/monitoring/performance-widget/`.

## Cambios Pendientes

Para completar la migración, es necesario actualizar los siguientes componentes:

### 1. Componente de Diagnóstico

Archivo: `src/app/features/network-design/components/map-diagnostic/map-diagnostic.component.ts`

Cambios necesarios:
- Actualizar referencias a métodos obsoletos:
  - `getPerformanceMetrics()` → `getMetrics()`
  - `getMapStatistics()` → `getMapStatistics()`
  - `clearMemoizationCache()` → (no existe, eliminar)

### 2. Componente de Vista de Mapa

Archivo: `src/app/features/network-design/components/map-container/components/map-view/map-view.component.ts`

Cambios necesarios:
- Actualizar la llamada a `registerFrame()` (por ahora se comentó)
- Implementar una lógica equivalente para actualizar las métricas

### 3. Componentes que usan el servicio obsoleto

Es necesario revisar todos los componentes que utilicen directamente:
- `MapRenderingService`
- `PerformanceMetrics` (desde el servicio eliminado)
- `MapStatistics` (desde el servicio eliminado)

## Tabla de Equivalencias de Métodos

| Método Antiguo | Método Nuevo |
|----------------|--------------|
| `startPerformanceTracking()` | `startMonitoring()` |
| `trackFrame(count)` | `registerFrame(renderTime, count)` |
| `getPerformanceMetrics()` | `getMetrics()` |
| `calculatePerformanceScore()` | `calculatePerformanceScore()` |
| `clearMemoizationCache()` | Eliminado (funcionalidad no necesaria) |
| `optimizeForPerformance()` | Implementado internamente |

## Interfaz de Servicio Unificado

La nueva API del servicio `MapPerformanceService` incluye:

```typescript
// Observables principales
getMetrics(): Observable<PerformanceMetrics>
getMapStatistics(): Observable<MapStatistics>
getOptimizationOptions(): Observable<OptimizationOptions>
getPerformanceLevel(): Observable<PerformanceLevel>

// Métodos para medir rendimiento
startMonitoring(): void
stopMonitoring(): void
registerFrame(renderTime: number, elementCount: number): void

// Métodos de optimización
updateOptimizationOptions(options: Partial<OptimizationOptions>): void
runDiagnostic(): Promise<any>
calculatePerformanceScore(): number
```

## Próximos Pasos

1. Reemplazar todas las importaciones de interfaces desde `map-rendering.service.ts` a `map-performance.service.ts`
2. Adaptar todas las llamadas a los métodos equivalentes en la nueva API
3. Resolver errores de compilación en archivos que aún hagan referencia al servicio obsoleto
4. Ejecutar pruebas para verificar que todo sigue funcionando correctamente

## Notas

- Si un método antiguo no tiene un equivalente directo, considerar si realmente es necesario
- No hay necesidad de mantener compatibilidad con la API antigua
- Para consultas sobre la migración, contactar al equipo de desarrollo 