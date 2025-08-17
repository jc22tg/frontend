# Documentación de Tipos para Redes de Fibra Óptica

Este documento detalla los tipos, interfaces y enumeraciones utilizados para modelar redes de fibra óptica en el sistema. Sirve como referencia técnica para desarrolladores y como documentación para el diseño del modelo de datos.

## Tabla de Contenidos

1. [Elementos de Red](#elementos-de-red)
2. [Estados y Tipos de Conexión](#estados-y-tipos-de-conexión)
3. [Estándares y Tecnologías](#estándares-y-tecnologías)
4. [Posicionamiento Geográfico](#posicionamiento-geográfico)
5. [Monitoreo y Alertas](#monitoreo-y-alertas)
6. [Interfaces de Usuario y Widgets](#interfaces-de-usuario-y-widgets)
7. [Interfaces de Servicio](#interfaces-de-servicio)

---

## Elementos de Red

### ElementType

Enumera todos los tipos de elementos que pueden existir en la red de fibra óptica.

```typescript
export enum ElementType {
  // Elementos básicos de red GPON/FTTH
  OLT = 'OLT',               // Terminal de Línea Óptica
  ONT = 'ONT',               // Terminal de Red Óptica
  SPLITTER = 'SPLITTER',     // Divisor Óptico
  ODF = 'ODF',               // Distribuidor de Fibra Óptica
  EDFA = 'EDFA',             // Amplificador de Fibra Dopada con Erbio
  MANGA = 'MANGA',           // Manga/Caja de Empalmes
  TERMINAL_BOX = 'TERMINAL_BOX', // Caja Terminal
  
  // Tipos de cable y conexiones
  FIBER_CONNECTION = 'FIBER_CONNECTION', // Conexión de Fibra Genérica
  SLACK_FIBER = 'SLACK_FIBER',      // Reserva de Fibra
  FIBER_THREAD = 'FIBER_THREAD',    // Hilo de Fibra
  FIBER_CABLE = 'FIBER_CABLE',      // Cable de Fibra
  DROP_CABLE = 'DROP_CABLE',        // Cable de Acometida
  DISTRIBUTION_CABLE = 'DISTRIBUTION_CABLE', // Cable de Distribución
  FEEDER_CABLE = 'FEEDER_CABLE',    // Cable Alimentador
  BACKBONE_CABLE = 'BACKBONE_CABLE', // Cable Troncal
  
  // Equipamiento avanzado
  ROADM = 'ROADM',                  // Multiplexor Óptico Reconfigurable
  COHERENT_TRANSPONDER = 'COHERENT_TRANSPONDER', // Transpondedor Coherente
  WAVELENGTH_ROUTER = 'WAVELENGTH_ROUTER',       // Router de Longitudes de Onda
  OPTICAL_SWITCH = 'OPTICAL_SWITCH',             // Conmutador Óptico
  WDM_FILTER = 'WDM_FILTER',                    // Filtro WDM
  
  // Infraestructura física
  POLE = 'POLE',                    // Poste
  CHAMBER = 'CHAMBER',              // Cámara/Pozo
  BUILDING = 'BUILDING',            // Edificio
  SITE = 'SITE',                    // Sitio/Local
  RACK = 'RACK',                    // Rack
  CABINET = 'CABINET',              // Gabinete
  
  // Otros elementos de red
  ROUTER = 'ROUTER',                // Router
  MSAN = 'MSAN',                    // Nodo de Acceso Multi-Servicio
  OPTICAL_AMPLIFIER = 'OPTICAL_AMPLIFIER', // Amplificador Óptico Genérico
  
  // Elementos adicionales
  FDP = 'FDP',                      // Punto de Distribución de Fibra (legacy)
  CUSTOM = 'CUSTOM'                 // Elemento Personalizado
  
  // ... otros tipos
}
```

### ElementStatus

Define los estados posibles de un elemento de red.

```typescript
export enum ElementStatus {
  ACTIVE = 'ACTIVE',             // Activo y funcionando
  INACTIVE = 'INACTIVE',         // Inactivo pero instalado
  MAINTENANCE = 'MAINTENANCE',   // En mantenimiento
  ERROR = 'ERROR',               // En estado de error
  PLANNING = 'PLANNING',         // En planificación
  FAULT = 'FAULT',               // Con falla
  PLANNED = 'PLANNED',           // Planificado para instalación
  BUILDING = 'BUILDING',         // En construcción
  RESERVED = 'RESERVED',         // Reservado
  DECOMMISSIONED = 'DECOMMISSIONED', // Fuera de servicio
  WARNING = 'WARNING',           // Funcionando con advertencias
  CRITICAL = 'CRITICAL',         // Estado crítico
  UNKNOWN = 'UNKNOWN'            // Estado desconocido
}
```

### NetworkElement

Interfaz base para todos los elementos de red.

```typescript
export interface NetworkElement {
  id?: string;                       // Identificador único
  name: string;                      // Nombre del elemento
  type: ElementType;                 // Tipo de elemento
  status: ElementStatus;             // Estado actual
  description?: string;              // Descripción
  position: GeographicPosition;      // Posición geográfica
  properties?: Record<string, any>;  // Propiedades adicionales
  createdAt?: Date;                  // Fecha de creación
  updatedAt?: Date;                  // Fecha de última actualización
  connections?: NetworkConnection[]; // Conexiones asociadas
  lastMaintenance?: Date;            // Fecha del último mantenimiento
  nextMaintenance?: Date;            // Fecha del próximo mantenimiento
  code?: string;                     // Código identificador adicional
}
```

### Interfaces Específicas de Elementos

Extienden NetworkElement para incluir propiedades específicas para cada tipo.

#### OLTElement

```typescript
export interface OLTElement extends NetworkElement {
  type: ElementType.OLT;
  vendor?: string;                  // Fabricante
  model?: string;                   // Modelo
  ponStandard: PONStandard;         // Estándar PON utilizado
  portCount: number;                // Número de puertos
  slots?: number;                   // Número de slots
  ipAddress?: string;               // Dirección IP para gestión
  managementUrl?: string;           // URL de administración
  odfIds?: string[];                // IDs de ODFs conectados
  authenticationMethod?: PONAuthenticationMethod; // Método de autenticación
  encryptionMethod?: PONEncryptionMethod;       // Método de cifrado
}
```

#### SplitterElement

```typescript
export interface SplitterElement extends NetworkElement {
  type: ElementType.SPLITTER;
  splitRatio: string;              // Relación de división (ej: "1:8", "1:32")
  inputPorts: number;              // Número de puertos de entrada
  outputPorts: number;             // Número de puertos de salida
  attenuationDb?: number;          // Atenuación en dB
  splitterType?: SplitterType;     // Tipo de splitter
  outputType?: SplitterOutputType; // Tipo de salida
}
```

## Estados y Tipos de Conexión

### ConnectionType

Tipos de conexiones físicas entre elementos.

```typescript
export enum ConnectionType {
  FIBER = 'FIBER',       // Conexión de fibra óptica
  COPPER = 'COPPER',     // Conexión de cobre
  WIRELESS = 'WIRELESS', // Conexión inalámbrica
  LOGICAL = 'LOGICAL'    // Conexión lógica
}
```

### ConnectionStatus

Estados posibles de una conexión.

```typescript
export enum ConnectionStatus {
  ACTIVE = 'ACTIVE',     // Activa y funcionando
  INACTIVE = 'INACTIVE', // Inactiva
  DEGRADED = 'DEGRADED', // Funcionando con degradación
  FAILED = 'FAILED',     // Fallida
  PLANNED = 'PLANNED'    // Planificada
}
```

### NetworkConnection

Interfaz base para todas las conexiones entre elementos.

```typescript
export interface NetworkConnection {
  id?: string;                     // Identificador único
  name: string;                    // Nombre de la conexión
  sourceId: string;                // ID del elemento origen
  targetId: string;                // ID del elemento destino
  type: ConnectionType;            // Tipo de conexión
  status: ConnectionStatus;        // Estado de la conexión
  properties?: Record<string, any>; // Propiedades adicionales
  points?: GeographicPosition[];    // Puntos geográficos (trazado)
  createdAt?: Date;                // Fecha de creación
  updatedAt?: Date;                // Fecha de última actualización
  capacity?: number;               // Capacidad en Gbps
  utilizationPercentage?: number;  // Porcentaje de utilización
  length?: number;                 // Longitud en metros
  description?: string;            // Descripción
}
```

### FiberConnection

Conexión específica de fibra óptica.

```typescript
export interface FiberConnection extends NetworkConnection {
  fiberType?: FiberType;          // Tipo de fibra
  attenuation?: number;           // Atenuación en dB
  connectorType?: ConnectorType;  // Tipo de conector
  cableType?: CableType;          // Tipo de instalación del cable
}
```

## Estándares y Tecnologías

### PONStandard

Estándares PON soportados.

```typescript
export enum PONStandard {
  GPON = 'GPON',                 // 2.5G downstream / 1.25G upstream
  EPON = 'EPON',                 // 1G simétrico
  XG_PON = 'XG-PON',             // 10G downstream / 2.5G upstream
  XGS_PON = 'XGS-PON',           // 10G simétrico
  NG_PON2 = 'NG-PON2',           // Múltiples longitudes de onda
  TEN_EPON = '10G_EPON',         // 10G EPON
  TWENTYFIVE_GS_PON = '25GS_PON', // 25G PON
  FIFTY_G_PON = '50G_PON',        // 50G PON
  HUNDRED_G_PON = '100G_PON'      // 100G PON / Coherent PON
}
```

### FiberType

Tipos de fibra óptica.

```typescript
export enum FiberType {
  SINGLE_MODE = 'SINGLE_MODE',           // Monomodo estándar (G.652)
  MULTI_MODE = 'MULTI_MODE',             // Multimodo genérico
  OM3 = 'OM3',                           // Multimodo OM3
  OM4 = 'OM4',                           // Multimodo OM4
  OM5 = 'OM5',                           // Multimodo OM5
  RIBBON = 'RIBBON',                     // Fibra en cinta
  SINGLE_MODE_LOOSE_TUBE = 'SINGLE_MODE_LOOSE_TUBE', // Monomodo tubo suelto
  SINGLE_MODE_RIBBON = 'SINGLE_MODE_RIBBON',  // Monomodo en cinta
}
```

### CableType

Tipos de instalación de cable.

```typescript
export enum CableType {
  AERIAL = 'aerial',               // Aéreo
  UNDERGROUND = 'underground',     // Subterráneo
  INDOOR = 'indoor',               // Interior
  DUCT = 'duct'                    // Ducto
}
```

## Posicionamiento Geográfico

### GeographicPosition

Interfaz para posiciones geográficas.

```typescript
export interface GeographicPosition {
  type?: string;                   // Tipo (ej: 'Point' para GeoJSON)
  lat: number;                     // Latitud
  lng: number;                     // Longitud
  coordinates?: [number, number];  // [longitud, latitud] para GeoJSON
  altitude?: number;               // Altitud en metros
}
```

### GeoPosition

Alias para mantener compatibilidad.

```typescript
export type GeoPosition = GeographicPosition;
```

## Monitoreo y Alertas

### NetworkAlert

Interfaz para alertas de red.

```typescript
export interface NetworkAlert {
  id: string;                     // Identificador único
  elementId: string;              // ID del elemento
  elementType: ElementType;       // Tipo de elemento
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';  // Severidad
  message: string;                // Mensaje
  timestamp: Date;                // Fecha y hora
  acknowledged: boolean;          // Reconocida
  acknowledgedBy?: string;        // Reconocida por
  acknowledgedAt?: Date;          // Fecha de reconocimiento
  details?: Record<string, any>;  // Detalles adicionales
  title?: string;                 // Título
  resolved?: boolean;             // Resuelta
  deviceType?: string;            // Tipo de dispositivo
}
```

### MonitoringData

Datos de monitorización de elementos.

```typescript
export interface MonitoringData {
  elementId: string;               // ID del elemento
  timestamp: Date;                 // Fecha y hora de la medición
  metrics: Record<string, number | string | boolean>;  // Métricas
  status: ElementStatus;           // Estado actual
  alerts?: NetworkAlert[];         // Alertas activas
  utilizationPercentage?: number;  // Porcentaje de utilización
}
```

### ElementMetrics

Métricas específicas de un elemento.

```typescript
export interface ElementMetrics {
  uptime?: number;                // Tiempo de actividad
  temperature?: number;           // Temperatura
  powerLevel?: number;            // Nivel de potencia
  signalQuality?: number;         // Calidad de señal
  bandwidth?: number;             // Ancho de banda
  alarms?: number;                // Número de alarmas
  timestamp?: Date;               // Fecha y hora
}
```

## Interfaces de Usuario y Widgets

### WidgetEvent

Eventos base para widgets en la interfaz.

```typescript
export interface WidgetEvent {
  source: string;                  // ID del widget origen
  type: string;                    // Tipo de evento
  timestamp: Date;                 // Fecha y hora
  payload?: WidgetPayload;         // Datos adicionales
}
```

### WidgetErrorEvent

Eventos de error para widgets.

```typescript
export interface WidgetErrorEvent extends WidgetEvent {
  error: {
    code: string;                  // Código de error
    message: string;               // Mensaje
    details?: WidgetErrorDetails;  // Detalles
  };
}
```

### MapViewMode

Modos de visualización del mapa.

```typescript
export enum MapViewMode {
  DEFAULT = 'DEFAULT',            // Modo normal
  EDIT = 'EDIT',                  // Modo edición
  SELECTION = 'SELECTION',        // Modo selección
  MEASUREMENT = 'MEASUREMENT',    // Modo medición
  CONNECTION = 'CONNECTION',      // Modo conexión
  DIAGNOSTIC = 'DIAGNOSTIC'       // Modo diagnóstico
}
```

### NetworkDesignState

Estado global del componente de diseño de red.

```typescript
export interface NetworkDesignState {
  mapViewMode: MapViewMode;                     // Modo de vista
  elementEditMode: ElementEditMode;             // Modo de edición
  selectedElement: NetworkElement | null;       // Elemento seleccionado
  selectedConnection: NetworkConnection | null; // Conexión seleccionada
  visibleLayers: CustomLayer[];                 // Capas visibles
  mapCenter: GeographicPosition;                // Centro del mapa
  mapZoom: number;                              // Nivel de zoom
  isLoading: boolean;                           // Cargando
  filters: Record<string, any>;                 // Filtros activos
  activeWidgets: NetworkWidgetConfig[];         // Widgets activos
  measurements: MapMeasurement[];               // Mediciones
  history: MapEvent[];                          // Historial de eventos
  elementTypeVisibility: Record<ElementType, boolean>; // Visibilidad por tipo
}
```

## Interfaces de Servicio

La aplicación utiliza interfaces de servicio para definir contratos claros entre componentes. Estas interfaces permiten una mejor separación de responsabilidades y facilitan las pruebas.

### IElementService

```typescript
export interface IElementService {
  /**
   * Obtiene el nombre del tipo de elemento en formato legible
   */
  getElementTypeName(type: ElementType): string;

  /**
   * Obtiene la clase CSS para el estado del elemento
   */
  getElementStatusClass(status: ElementStatus): string;

  /**
   * Obtiene una propiedad específica de un elemento según su tipo
   */
  getElementProperty<T extends NetworkElement, K extends keyof T>(element: T, property: K): T[K];

  /**
   * Verifica si un elemento es de tipo específico (Type Guards)
   */
  isOLT(element: NetworkElement): element is (NetworkElement & OLT);
  isONT(element: NetworkElement): element is (NetworkElement & ONT);
  isODF(element: NetworkElement): element is (NetworkElement & ODF);
  isEDFA(element: NetworkElement): element is (NetworkElement & EDFA);
  isSplitter(element: NetworkElement): element is (NetworkElement & Splitter);
  isManga(element: NetworkElement): element is (NetworkElement & Manga);
}
```

### IConnectionService

```typescript
export interface IConnectionService {
  /**
   * Obtiene todas las conexiones
   */
  getConnections(): Observable<NetworkConnection[]>;

  /**
   * Obtiene una conexión por su ID
   */
  getConnectionById(id: string): Observable<NetworkConnection | null>;

  /**
   * Obtiene las conexiones relacionadas con un elemento específico
   */
  getConnectionsByElementId(elementId: string): Observable<NetworkConnection[]>;

  /**
   * Añade una nueva conexión
   */
  addConnection(connection: NetworkConnection): Observable<NetworkConnection>;

  /**
   * Actualiza una conexión existente
   */
  updateConnection(connection: NetworkConnection): Observable<NetworkConnection>;

  /**
   * Elimina una conexión por su ID
   */
  removeConnection(connectionId: string): Observable<boolean>;
}
```

### IMapCoreService

```typescript
export interface IMapCoreService {
  /**
   * Inicializa el mapa con la configuración proporcionada
   */
  initializeMap(config: MapConfig): Promise<void>;

  /**
   * Limpia todos los elementos del mapa
   */
  clearMap(): void;

  /**
   * Actualiza el tamaño del mapa según el contenedor actual
   */
  refreshMapSize(): void;

  /**
   * Detiene la simulación física del mapa
   */
  stopSimulation(): void;

  /**
   * Obtiene el nivel de zoom actual
   */
  getCurrentZoom(): number;

  /**
   * Establece el nivel de zoom del mapa
   */
  setZoom(zoomLevel: number, animate?: boolean): void;

  /**
   * Centra el mapa en las coordenadas especificadas
   */
  centerOnCoordinates(coordinates: { x: number, y: number }): void;

  /**
   * Obtiene las coordenadas del centro actual del mapa
   */
  getMapCenter(): { x: number, y: number };

  /**
   * Retorna un Observable que indica si el mapa está listo
   */
  isMapReady(): Observable<boolean>;
}
```

### IMapService

```typescript
export interface IMapService extends IMapCoreService {
  /**
   * Actualiza los elementos del mapa
   */
  updateMapElements(elements: NetworkElement[], connections: NetworkConnection[]): void;
  
  /**
   * Selecciona un elemento del mapa
   */
  selectElement(element: NetworkElement | null): void;
  
  /**
   * Obtiene la posición seleccionada
   */
  getSelectedPosition(): Observable<MapPosition | null>;
  
  /**
   * Previsualiza un elemento en el mapa
   */
  previewElement(element: NetworkElement): void;
  
  /**
   * Limpia la previsualización
   */
  clearPreview(): void;
  
  /**
   * Habilita la selección de posición
   */
  enablePositionSelection(): void;
  
  /**
   * Deshabilita la selección de posición
   */
  disablePositionSelection(): void;
}
```

### IMapMeasurementService

```typescript
export interface IMapMeasurementService {
  /**
   * Inicializa el servicio de mediciones
   */
  initialize(svg: any, mainGroup: any): void;
  
  /**
   * Habilita el modo de medición
   */
  enableMeasurementMode(): void;
  
  /**
   * Deshabilita el modo de medición
   */
  disableMeasurementMode(): void;
  
  /**
   * Añade un punto de medición
   */
  addMeasurementPoint(x: number, y: number, element?: NetworkElement): void;
  
  /**
   * Limpia todas las mediciones
   */
  clearMeasurements(): void;
  
  /**
   * Obtiene la medición actual
   */
  getCurrentMeasurement(): Measurement | null;
  
  /**
   * Obtiene el historial de mediciones
   */
  getMeasurementHistory(): Measurement[];
}
```

### IMapInteractionService

```typescript
export interface IMapInteractionService {
  /**
   * Inicializa las interacciones del mapa
   */
  initializeInteractions(svg: any, mainGroup: any): void;
  
  /**
   * Establece la herramienta activa
   */
  setTool(tool: string): void;
  
  /**
   * Habilita el modo de panorámica (pan)
   */
  enablePanMode(): void;
  
  /**
   * Habilita el modo de selección
   */
  enableSelectMode(): void;
  
  /**
   * Habilita el modo de medición
   */
  enableMeasureMode(): void;
  
  /**
   * Habilita el modo de selección por área
   */
  enableAreaSelectMode(): void;
  
  /**
   * Selecciona un elemento
   */
  selectElement(element: NetworkElement | null): void;
  
  /**
   * Selecciona una conexión
   */
  selectConnection(connection: NetworkConnection): void;
  
  /**
   * Maneja la conexión entre dos elementos
   */
  handleConnection(source: NetworkElement, target: NetworkElement, status?: string): void;
  
  /**
   * Establece el modo oscuro
   */
  setDarkMode(isDarkMode: boolean): void;
  
  /**
   * Obtiene la herramienta actual
   */
  getCurrentTool(): string;
}
```

### IMapRenderService

```typescript
export interface IMapRenderService {
  /**
   * Inicializa los componentes de renderizado en el mapa
   */
  initializeRender(svg: any, mainGroup: any, width: number, height: number): void;
  
  /**
   * Actualiza los nodos en el mapa
   */
  updateNodes(nodes: D3Node[]): void;
  
  /**
   * Actualiza los enlaces en el mapa
   */
  updateLinks(links: D3LinkData[]): void;
  
  /**
   * Convierte elementos de red a nodos D3
   */
  convertToD3Nodes(elements: NetworkElement[]): D3Node[];
  
  /**
   * Convierte conexiones de red a enlaces D3
   */
  convertToD3Links(connections: NetworkConnection[], elements: NetworkElement[]): D3LinkData[];
  
  /**
   * Resalta el elemento seleccionado
   */
  highlightSelectedElement(elementId: string | null): void;
  
  /**
   * Obtiene el color para un tipo de elemento y estado
   */
  getElementColor(type: string, status?: string): string;
  
  /**
   * Limpia el mapa
   */
  clearRender(): void;
}
```

### IMapExportService

```typescript
export interface IMapExportService {
  /**
   * Inicializa el servicio de exportación
   */
  initialize(svg: any): void;
  
  /**
   * Exporta el mapa al formato especificado
   */
  exportMap(format: string): void;
  
  /**
   * Exporta el mapa como imagen PNG
   */
  exportToPNG(): void;
  
  /**
   * Exporta el mapa como SVG
   */
  exportToSVG(): void;
  
  /**
   * Exporta el mapa como JSON
   */
  exportToJSON(): void;
  
  /**
   * Exporta las mediciones actuales
   */
  exportMeasurements(): void;
}
```

### IMapPreviewService

```typescript
export interface IMapPreviewService {
  /**
   * Inicializa el servicio de vista previa
   */
  initialize(svg: any, mainGroup: any): void;
  
  /**
   * Muestra una vista previa de un elemento en el mapa
   */
  previewElement(element: NetworkElement): void;
  
  /**
   * Limpia la vista previa actual
   */
  clearPreview(): void;
  
  /**
   * Comprueba si hay una vista previa activa
   */
  hasActivePreview(): boolean;
  
  /**
   * Obtiene el elemento actualmente en vista previa
   */
  getPreviewElement(): NetworkElement | null;
}
```

## Funciones Utilitarias

### Funciones de Posicionamiento

```typescript
// Crear posición geográfica validada
export function createPosition(
  coordinates: [number, number],
  options: { type?: string } = {}
): GeographicPosition

// Calcular distancia entre dos puntos (fórmula Haversine)
export function calculateDistance(
  position1: GeographicPosition,
  position2: GeographicPosition
): number
```

### Funciones de Elementos

```typescript
// Obtener ícono para tipo de elemento
export function getElementIcon(type: ElementType): string

// Obtener nombre legible para el tipo de elemento
export function getElementTypeName(type: ElementType): string

// Obtener color de visualización
export function getElementTypeColor(type: ElementType): string

// Clasificar elementos por categoría
export function getElementCategory(type: ElementType): 'activo' | 'pasivo' | 'infraestructura' | 'conexión' | 'otro'
``` 