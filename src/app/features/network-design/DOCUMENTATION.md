# Documentación del Módulo Network Design

Este documento centraliza toda la documentación del módulo Network Design para facilitar su mantenimiento y consulta.

## Índice

1. [Arquitectura](#arquitectura)
2. [Componentes](#componentes)
3. [Servicios](#servicios)
4. [Interfaces](#interfaces)
5. [Flujos de trabajo](#flujos-de-trabajo)
6. [Guía de estilo](#guía-de-estilo)
7. [Referencias a documentación específica](#referencias-a-documentación-específica)

## Arquitectura

El módulo Network Design sigue una arquitectura por capas claramente definida:

### Capas del Módulo

1. **Presentación (Components)**
   - Componentes reutilizables
   - Páginas principales
   - Widgets específicos

2. **Lógica de Negocio (Services)**
   - Servicios principales
   - Facades para estado
   - Repositorios para datos

3. **Datos (Repositories)**
   - Acceso a API
   - Transformación de datos
   - Caché local

### Patrones de Diseño Implementados

1. **Facade Pattern**
   - Simplificación de interacciones complejas
   - Centralización de lógica de estado
   - Mejor testabilidad

2. **Repository Pattern**
   - Abstracción de acceso a datos
   - Caché y optimización
   - Manejo de errores

3. **Component Pattern**
   - Componentes pequeños y enfocados
   - Reutilización de código
   - Mejor mantenibilidad

## Componentes

Los componentes principales del módulo son:

1. **Network Map Component**
   - Visualización del mapa de red
   - Gestión de elementos
   - Interacción con el mapa

2. **Element Details Component**
   - Visualización de detalles
   - Edición de elementos
   - Monitoreo en tiempo real

3. **Connection Editor Component**
   - Creación y edición de conexiones
   - Visualización de rutas
   - Validación de compatibilidad

4. **Batch Element Editor**
   - Edición masiva de elementos
   - Aplicación de cambios en lote
   - Importación/exportación de datos

5. **Alert Management Widget**
   - Visualización de alertas
   - Configuración de notificaciones
   - Respuesta a eventos

## Servicios

Los servicios están organizados según su función:

1. **Servicios de Mapa**
   - `map.service.ts`: Gestión principal del mapa
   - `map-element.service.ts`: Elementos en el mapa
   - `map-position.service.ts`: Posicionamiento
   - `layer.service.ts`: Gestión de capas

2. **Servicios de Elementos**
   - `element.service.ts`: CRUD de elementos
   - `element-editor.service.ts`: Edición de elementos
   - `element-management.service.ts`: Gestión de selección

3. **Servicios de Conexiones**
   - `connection.service.ts`: CRUD de conexiones
   - `map-connection.service.ts`: Visualización en mapa
   - `connection-compatibility.service.ts`: Validación

4. **Servicios de Estado**
   - `network-state.service.ts`: Estado global
   - `network.facade.ts`: Fachada de acciones

5. **Servicios de Monitoreo**
   - `monitoring.service.ts`: Monitoreo de la red
   - `metrics.service.ts`: Métricas y estadísticas

6. **Servicios de Utilidad**
   - `help-dialog.service.ts`: Ayuda contextual
   - `error-handling.service.ts`: Manejo de errores
   - `map-utils.service.ts`: Utilidades del mapa

## Interfaces

Las interfaces están organizadas en tres categorías principales:

1. **Interfaces de Elementos**
   - NetworkElement
   - ElementType
   - ElementStatus

2. **Interfaces de Conexiones**
   - NetworkConnection
   - ConnectionType
   - ConnectionStatus

3. **Interfaces de Mapa**
   - MapConfig
   - LayerConfig
   - MapEvent

Para más detalles, consulte el archivo [INTERFACES.md](./components/INTERFACES.md).

## Flujos de trabajo

### 1. Desarrollo de Características
1. Crear estructura de directorios
2. Definir interfaces
3. Implementar servicios
4. Desarrollar componentes
5. Escribir pruebas
6. Documentar cambios

### 2. Mantenimiento
1. Revisar código
2. Identificar mejoras
3. Implementar cambios
4. Actualizar documentación
5. Ejecutar pruebas

### 3. Control de Calidad
1. Revisión de código
2. Pruebas unitarias
3. Pruebas de integración
4. Pruebas de rendimiento
5. Documentación actualizada

## Guía de estilo

Para mantener la coherencia en el código, se deben seguir las siguientes pautas:

### Variables globales de estilo
```scss
:root {
  // Colores
  --color-primary: #1976d2;
  --color-secondary: #424242;
  --color-success: #4caf50;
  --color-warning: #ff9800;
  --color-danger: #f44336;
  --color-info: #2196f3;

  // Espaciado
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  // Tipografía
  --font-family: 'Roboto', sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
}
```

### Convenciones de código
- Nombres de componentes: PascalCase (ElementEditorComponent)
- Nombres de servicios: camelCase (mapService)
- Nombres de interfaces: PascalCase (NetworkElement)
- Nombres de enums: PascalCase (ElementType)
- Nombres de variables: camelCase (selectedElement)
- Nombres de constantes: UPPER_SNAKE_CASE (DEFAULT_ZOOM_LEVEL)

## Referencias a documentación específica

Para información más detallada sobre aspectos específicos, consulte los siguientes documentos:

- [README principal](./README.md) - Visión general del módulo
- [Documentación de Connection Editor](./components/DOCUMENTACION-CONNECTION-EDITOR.md)
- [Documentación de Batch Editor](./components/DOCUMENTACION-BATCH-EDITOR.md)
- [Documentación de Alertas](./components/DOCUMENTACION-ALERTAS.md)
- [Diagrama de Interacción](./components/DIAGRAMA-INTERACCION.md)
- [Documentación de Componentes](./components/DOCUMENTACION.md)
- [Documentación de Servicios](./services/README.md)
- [Interfaces](./components/INTERFACES.md) 