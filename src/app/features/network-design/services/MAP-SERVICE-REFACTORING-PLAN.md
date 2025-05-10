# Plan de Refactorización para Map Service

## Problema
El servicio `map.service.ts` tiene aproximadamente 1682 líneas, lo cual es excesivo y dificulta su mantenimiento.

## Objetivo
Dividir el servicio actual en varios servicios más pequeños y enfocados, siguiendo el principio de responsabilidad única.

## Servicios Propuestos

### 1. MapCoreService
**Responsabilidad**: Inicialización y gestión básica del mapa.
**Métodos principales**:
- initializeMap
- clearMap
- refreshMapSize
- stopSimulation
- getCurrentZoom
- setZoom
- centerMap
- centerOnCoordinates
- getMapCenter
- fitContentToScreen
- isMapReady

### 2. MapRenderService
**Responsabilidad**: Renderizado de elementos en el mapa.
**Métodos principales**:
- updateMapElements
- updateNodes
- updateLinks
- updatePositions
- convertToD3Nodes
- convertToD3Links
- getNodesData
- getLinksData
- highlightSelectedElement
- getElementColor

### 3. MapInteractionService
**Responsabilidad**: Manejo de interacciones del usuario con el mapa.
**Métodos principales**:
- setTool
- setupZoom
- configureDrag
- enablePanMode
- enableSelectMode
- selectElement
- addElementAtPosition
- handleConnection

### 4. MapMeasurementService
**Responsabilidad**: Funcionalidades de medición en el mapa.
**Métodos principales**:
- enableMeasureMode
- addMeasurementPoint
- clearMeasurements
- updateMeasurementLine

### 5. MapSelectionService
**Responsabilidad**: Selección de áreas y elementos.
**Métodos principales**:
- enableAreaSelectMode
- disableAreaSelectMode
- updateSelectionRect
- selectElementsInArea

### 6. MapExportService
**Responsabilidad**: Exportación del mapa a diferentes formatos.
**Métodos principales**:
- exportMap
- exportToSVG
- exportToPNG
- exportToJSON
- downloadBlob

### 7. MapPositionService
**Responsabilidad**: Gestión de posiciones y coordenadas.
**Métodos principales**:
- pixelToCoordinates
- sendPositionToEditor
- getSelectedPosition
- enablePositionSelection
- disablePositionSelection
- showTemporaryMarker

### 8. MapPreviewService
**Responsabilidad**: Vista previa de elementos.
**Métodos principales**:
- previewElement
- clearPreview
- addPreviewElementToMap
- removePreviewFromMap

## Plan de Implementación

1. **Fase 1**: Crear los nuevos servicios vacíos con sus interfaces
2. **Fase 2**: Migrar las funcionalidades relacionadas a cada servicio uno por uno
3. **Fase 3**: Actualizar el servicio MapService principal para que delegue funcionalidades a los servicios especializados
4. **Fase 4**: Actualizar las referencias en los componentes y otros servicios
5. **Fase 5**: Pruebas y corrección de errores

## Relaciones entre Servicios

El nuevo `MapService` actuará como fachada y delegará las llamadas a los servicios especializados. Esto permitirá mantener la compatibilidad con el código existente mientras se mejora la estructura interna.

```typescript
@Injectable({
  providedIn: 'root'
})
export class MapService implements IMapService {
  constructor(
    private mapCoreService: MapCoreService,
    private mapRenderService: MapRenderService,
    private mapInteractionService: MapInteractionService,
    // etc.
  ) {}

  // Métodos que delegan a los servicios específicos...
}
```

## Beneficios Esperados

1. **Mejor mantenimiento**: Cada servicio tiene una responsabilidad clara
2. **Mejor testabilidad**: Pruebas unitarias más enfocadas
3. **Reutilización de código**: Posibilidad de reutilizar servicios específicos
4. **Escalabilidad**: Facilidad para extender funcionalidades específicas
5. **Comprensión**: Código más fácil de entender y documentar 