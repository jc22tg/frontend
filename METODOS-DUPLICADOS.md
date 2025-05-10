# Métodos duplicados entre NetworkMapPageComponent y MapContainerComponent

A continuación se listan los métodos que están duplicados en ambos componentes:

## Métodos de gestión de eventos (handlers)

1. **Gestión de selección**
   - `handleElementSelected` / `onElementSelect`
   - `handleConnectionSelected` / `onConnectionSelect`

2. **Gestión de elementos**
   - `handleEditElementRequest` / `onEditElementRequest`
   - `handleDeleteElementRequest` / `onDeleteElementRequest`
   - `handleAddElementRequest` / `handleAddElement`

3. **Gestión de conexiones**
   - `handleCreateConnectionRequest` / `handleCreateConnection`
   - `handleConnectElementRequest` / `onConnectElementRequest`

4. **Gestión de cambios de zoom y vista**
   - `handleZoomChange` / `onZoomChange`
   - `handleLayerToggle` / `toggleLayer`

5. **Gestión de mediciones**
   - `handleMeasurementComplete` / `onMeasurementComplete`

6. **Gestión de capas y widgets**
   - `handleCreateLayerRequest` / `handleCreateLayer`
   - `handleToggleCustomLayer` / `handleCustomLayerToggle`
   
## Implementación de funcionalidad

1. **Manejo de zoom**
   - En ambos componentes:
     - métodos de zoom (zoomIn, zoomOut, resetZoom, fitToScreen)
   
2. **Gestión de diálogos**
   - Ambos componentes implementan funciones para abrir diálogos:
     - Propiedades de elementos
     - Selección de posición
     - Ayuda de atajos

3. **Funciones de utilidad**
   - Métodos auxiliares para mostrar/ocultar notificaciones
   - Operaciones con elementos como obtener nombres de tipos

## Observaciones

Esta duplicación genera varios problemas:

1. **Mantenimiento difícil**: Al hacer cambios, se deben actualizar ambos componentes
2. **Inconsistencias**: Los comportamientos pueden diferir ligeramente
3. **Aumento del tamaño del código**: El mismo código aparece en múltiples lugares
4. **Dificultad de seguimiento**: La lógica está dispersa en diferentes componentes

La solución implementada con MapFacadeService centraliza esta lógica compartida y mantiene la consistencia en todo el proyecto. 