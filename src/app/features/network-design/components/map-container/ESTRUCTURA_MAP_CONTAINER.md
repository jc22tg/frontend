# Estructura y Funcionalidad de MapContainer

## Descripción General

El componente `MapContainer` es un componente standalone que actúa como punto de entrada único para la visualización del mapa de red. Orquesta todos los componentes y servicios relacionados con el mapa, proporcionando una interfaz unificada para la interacción con el mapa y sus elementos.

## Estructura de Componentes

```
map-container/
├── map-container.component.ts           # Componente principal
├── map-container.component.html         # Template del contenedor
├── map-container.component.scss         # Estilos del contenedor
├── map-container.routes.ts              # Configuración de rutas
├── DESIGN.md                            # Documentación de diseño
├── MIGRACION_NETWORKMAP.md              # Guía de migración
└── components/                          # Componentes hijos
    ├── elements-panel/                  # Panel de elementos
    ├── layer-control/                   # Control de capas
    │   ├── layer-control.component.html
    │   ├── layer-control.component.scss
    │   └── layer-control.component.ts
    ├── map-view/                        # Vista principal del mapa
    │   ├── map-view.component.scss
    │   └── map-view.component.ts
    ├── map-widgets/                     # Widgets del mapa
    │   └── performance-widget/          # Widget de rendimiento
    │       ├── performance-widget.component.html
    │       ├── performance-widget.component.scss
    │       └── performance-widget.component.ts
    └── mini-map/                        # Mini mapa
        └── mini-map.component.ts
```

## Componente Principal: MapContainerComponent

### Características

- **Componente Standalone**: No depende de un NgModule, utiliza la API de importación directa.
- **Herencia**: Extiende de `BaseMapComponent` para reutilizar funcionalidad común.
- **Detección de Cambios**: Utiliza `ChangeDetectionStrategy.OnPush` para mejor rendimiento.
- **Modo Standalone/Legacy**: Soporta tanto componentes standalone modernos como implementación legacy.

### Propiedades Principales

- `@Input() initialZoom`: Nivel de zoom inicial (default: 16)
- `@Input() initialCenter`: Coordenadas centrales iniciales [lng, lat]
- `@Input() darkMode`: Activa/desactiva el tema oscuro
- `@Input() showControls`: Muestra/oculta controles del mapa
- `@Input() showMiniMap`: Muestra/oculta el mini mapa
- `@Input() showLayerControl`: Muestra/oculta el control de capas

### Servicios Inyectados

- `MapService`: Servicio principal del mapa (legacy)
- `MapToolsService`: Gestión de herramientas del mapa
- `MapStateService`: Gestión del estado del mapa
- `MapPerformanceService`: Métricas de rendimiento
- `StandaloneAdapterService`: Adaptador para componentes standalone
- `MapElementManagerAdapter`: Adaptador para gestión de elementos
- `MapStateManagerService`: Gestor de estado moderno

### Métodos Principales

- `initializeComponent()`: Inicializa el componente y configura suscripciones
- `onElementSelected(element)`: Maneja la selección de elementos
- `onMapLoaded()`: Maneja el evento de carga completa del mapa
- `setTool(tool)`: Cambia la herramienta activa
- `centerMap(coordinates)`: Centra el mapa en coordenadas específicas
- `setZoom(value)`: Cambia el nivel de zoom

## Componentes Hijos

### 1. MapViewComponent

**Funcionalidad**: Componente principal para la visualización del mapa. Maneja el renderizado de elementos, interacciones y eventos del mapa.

**Características**:
- Renderiza el mapa utilizando Leaflet o implementación personalizada
- Gestiona eventos de interacción (click, drag, zoom)
- Dibuja elementos y conexiones en el mapa
- Implementa herramientas como selección, medición, etc.

### 2. LayerControlComponent

**Funcionalidad**: Control para gestionar las capas visibles en el mapa.

**Características**:
- Lista de capas disponibles con toggles para activar/desactivar
- Soporte para capas base y superpuestas
- Ordenamiento de capas
- Configuración de opacidad y visibilidad

### 3. ElementsPanelComponent

**Funcionalidad**: Panel lateral para listar, filtrar y seleccionar elementos del mapa.

**Características**:
- Lista de elementos con filtrado y búsqueda
- Selección de elementos desde el panel
- Información básica de elementos
- Acciones rápidas sobre elementos

### 4. MiniMapComponent

**Funcionalidad**: Versión reducida del mapa que muestra la vista general y el área visible actual.

**Características**:
- Vista en miniatura del mapa completo
- Rectángulo que indica el área visible actual
- Navegación rápida haciendo clic en el mini mapa
- Sincronización bidireccional con el mapa principal

### 5. PerformanceWidgetComponent

**Funcionalidad**: Widget que muestra métricas de rendimiento del mapa.

**Características**:
- Muestra FPS (frames por segundo)
- Cuenta de elementos renderizados
- Uso de memoria
- Opciones de optimización de rendimiento

## Flujo de Datos y Comunicación

1. **Entrada de Datos**:
   - Configuración inicial vía `@Input()`
   - Datos de ruta vía `ActivatedRoute`
   - Estado global vía servicios inyectados

2. **Comunicación Padre-Hijo**:
   - Propiedades `@Input()` para pasar datos a componentes hijos
   - Eventos `@Output()` para notificar cambios desde componentes hijos
   - Servicios compartidos para estado global

3. **Gestión de Estado**:
   - `MapStateService` y `MapStateManagerService` para estado global
   - Observables para comunicación reactiva
   - Adaptadores para compatibilidad con componentes legacy

## Ciclo de Vida

1. **Inicialización**:
   - Constructor: inyección de dependencias
   - `ngOnInit`: configuración inicial y suscripciones
   - `initializeComponent`: inicialización específica del componente

2. **Renderizado**:
   - `ngAfterViewInit`: inicialización del mapa cuando la vista está lista
   - `onMapLoaded`: configuración post-carga del mapa

3. **Interacción**:
   - Eventos de mouse (click, doble click, etc.)
   - Cambios de herramienta
   - Selección de elementos

4. **Limpieza**:
   - `ngOnDestroy`: cancelación de suscripciones y limpieza de recursos

## Optimizaciones

1. **Rendimiento**:
   - Detección de cambios OnPush
   - Carga progresiva de elementos
   - Monitoreo de rendimiento vía `MapPerformanceService`

2. **Memoria**:
   - Gestión adecuada de suscripciones con `takeUntil`
   - Limpieza de recursos en `ngOnDestroy`

3. **UX**:
   - Indicadores de carga
   - Feedback visual de interacciones
   - Adaptación a diferentes tamaños de pantalla

## Migración desde NetworkMapComponent

El componente `MapContainer` es parte de una estrategia de migración desde el componente legacy `NetworkMapComponent`. La migración se realiza progresivamente, permitiendo la coexistencia de ambas implementaciones durante la transición.

La migración se enfoca en:
- Modularizar el código monolítico
- Mejorar la testabilidad
- Optimizar el rendimiento
- Seguir las mejores prácticas de Angular moderno

Para más detalles sobre la migración, consultar el archivo `MIGRACION_NETWORKMAP.md`.

## Conclusión

El componente `MapContainer` implementa una arquitectura moderna y modular para la visualización y gestión del mapa de red. Proporciona una base sólida para futuras mejoras y extensiones, siguiendo los principios SOLID y las mejores prácticas de Angular. 