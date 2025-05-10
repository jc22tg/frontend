/**
 * Interfaces unificadas para el módulo de diseño de red
 * Estas interfaces representan los tipos y estructuras de datos comunes
 * utilizados en toda la aplicación.
 */

/**
 * Enumeración de tipos de elementos de red
 */
export enum ElementType {
  ODF = 'ODF', // Optical Distribution Frame / Fiber Distribution Point
  OLT = 'OLT', // Optical Line Terminal
  ONT = 'ONT', // Optical Network Terminal
  SPLITTER = 'SPLITTER', // Divisor óptico
  EDFA = 'EDFA', // Erbium Doped Fiber Amplifier
  MANGA = 'MANGA', // Manga de empalme
  TERMINAL_BOX = 'TERMINAL_BOX', // Caja terminal
  FIBER_THREAD = 'FIBER_THREAD', // Hilo de fibra
  DROP_CABLE = 'DROP_CABLE', // Cable de acometida
  DISTRIBUTION_CABLE = 'DISTRIBUTION_CABLE', // Cable de distribución
  FEEDER_CABLE = 'FEEDER_CABLE', // Cable alimentador
  BACKBONE_CABLE = 'BACKBONE_CABLE', // Cable troncal
  MSAN = 'MSAN', // Multi-Service Access Node
  ROUTER = 'ROUTER', // Router de cliente
  RACK = 'RACK', // Rack de equipamiento
  NETWORK_GRAPH = 'NETWORK_GRAPH', // Representación gráfica de una red completa
  WDM_FILTER = 'WDM_FILTER', // Filtro WDM para coexistencia de tecnologías PON
  COHERENT_TRANSPONDER = 'COHERENT_TRANSPONDER', 
  WAVELENGTH_ROUTER = 'WAVELENGTH_ROUTER',
  OPTICAL_SWITCH = 'OPTICAL_SWITCH',
  ROADM = 'ROADM',
  OPTICAL_AMPLIFIER = 'OPTICAL_AMPLIFIER',
  FIBER_CONNECTION = 'FIBER_CONNECTION',
  FIBER_SPLICE = 'FIBER_SPLICE',
  FIBER_CABLE = 'FIBER_CABLE',
  FIBER_STRAND = 'FIBER_STRAND',
  FDP = 'FDP'
}

/**
 * Enumeración de estados de elementos de red
 */
export enum ElementStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  FAULT = 'FAULT',
  PLANNED = 'PLANNED',
  BUILDING = 'BUILDING',
  RESERVED = 'RESERVED',
  DECOMMISSIONED = 'DECOMMISSIONED',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Estándares PON soportados en el sistema
 */
export enum PONStandard {
  GPON = 'GPON',           // Gigabit PON (ITU-T G.984)
  EPON = 'EPON',           // Ethernet PON (IEEE 802.3ah)
  XGS_PON = 'XGS_PON',     // 10 Gigabit Symmetric PON (ITU-T G.9807.1)
  XG_PON = 'XG_PON',       // 10 Gigabit PON (ITU-T G.987)
  TEN_EPON = '10G_EPON',   // 10 Gigabit EPON (IEEE 802.3av)
  TWENTYFIVE_GS_PON = '25GS_PON', // 25 Gigabit Symmetric PON (25GS-PON MSA)
  FIFTY_G_PON = '50G_PON', // 50 Gigabit PON (ITU-T G.9804 Higher Speed PON)
  HUNDRED_G_PON = '100G_PON' // 100 Gigabit PON / Coherent PON (Futura)
}

/**
 * Tipos de fibra óptica
 */
export enum FiberType {
  SINGLE_MODE = 'SINGLE_MODE', // Monomodo
  MULTI_MODE = 'MULTI_MODE', // Multimodo
  SINGLE_MODE_LOOSE_TUBE = 'SINGLE_MODE_LOOSE_TUBE', // Monomodo de tubo holgado
  SINGLE_MODE_RIBBON = 'SINGLE_MODE_RIBBON', // Monomodo en cinta
  MULTI_MODE_OM3 = 'MULTI_MODE_OM3', // Multimodo OM3
  MULTI_MODE_OM4 = 'MULTI_MODE_OM4' // Multimodo OM4
}

/**
 * Tipos de ODF (Optical Distribution Frame)
 */
export enum ODFType {
  PRIMARY = 'PRIMARY', // Primario
  SECONDARY = 'SECONDARY', // Secundario
  TERTIARY = 'TERTIARY' // Terciario
}

/**
 * Tipos de splitter
 */
export enum SplitterType {
  DISTRIBUTION = 'DISTRIBUTION', // Splitter de distribución
  TERMINAL = 'TERMINAL' // Splitter terminal
}

/**
 * Tipos de salida para splitters
 */
export enum SplitterOutputType {
  EQUAL = 'EQUAL', // Potencia de salida igual
  UNEQUAL = 'UNEQUAL', // Potencia de salida desigual
  BALANCED = 'BALANCED', // Potencia balanceada entre salidas
  UNBALANCED = 'UNBALANCED' // Potencia desbalanceada entre salidas
}

/**
 * Enumeración de tipos de clientes
 */
export enum ClientType {
  RESIDENTIAL = 'RESIDENTIAL',
  BUSINESS = 'BUSINESS',
  CORPORATE = 'CORPORATE',
  GOVERNMENT = 'GOVERNMENT',
  WHOLESALE = 'WHOLESALE'
}

/**
 * Interfaz para información de accesibilidad de elementos
 */
export interface Accessibility {
  needsPermission: boolean; // Requiere permiso para acceder
  isLocked: boolean; // Está bajo llave
  hasRestrictedAccess: boolean; // Tiene acceso restringido
  accessNotes?: string; // Notas sobre el acceso
}

/**
 * Interfaz para posición geográfica
 */
export interface GeographicPosition {
  coordinates: [number, number]; // [longitud, latitud]
  lat: number; // Latitud
  lng: number; // Longitud
  altitude?: number; // Altitud en metros
  accuracy?: number; // Precisión en metros
  type?: string; // Tipo de geometría (Point para GeoJSON)
}

/**
 * Interfaz base para todos los elementos de red
 */
export interface NetworkElement {
  id: string;
  code: string;
  name: string;
  type: ElementType;
  status: ElementStatus;
  position: GeographicPosition;
  description?: string;
  notes?: string;
  projectId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  metadata?: Record<string, any>;
  connections?: NetworkConnection[];
  selected?: boolean;
  accessibility?: Accessibility;
}

/**
 * Tipo para representar una conexión de red entre elementos
 */
export interface NetworkConnection {
  id: string;
  name?: string;
  sourceId: string;
  targetId: string;
  source?: string;
  target?: string;
  type?: string;
  status: ElementStatus;
  distance?: number;
  label?: string;
  length?: number;
  capacity?: number;
  description?: string;
  metadata?: Record<string, any>;
  lastUpdated?: string | Date;
  fiberType?: FiberType;
}

/**
 * Interfaz para capas personalizadas
 */
export interface CustomLayer {
  id: string;
  name: string;
  description?: string;
  color: string;
  visible: boolean;
  elementIds: string[];
  icon?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  isEditable: boolean;
  isSystem: boolean;
  priority: number;
  metadata?: Record<string, any>;
}

/**
 * Interfaz para conexiones de fibra
 */
export interface FiberConnection extends NetworkConnection {
  fiberType?: FiberType;
  length?: number;
  attenuationDb?: number;
  bandwidthGbps?: number;
}

/**
 * Interfaz para datos de monitoreo
 */
export interface MonitoringData {
  elementId: string;
  timestamp: number | Date;
  metrics: {
    temperature?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    signalPower?: number;
    bitErrorRate?: number;
    packetLoss?: number;
    latency?: number;
    bandwidth?: {
      up: number;
      down: number;
    };
  };
  status: ElementStatus;
  utilizationPercentage?: number;
}

/**
 * Interfaz para alertas de red
 */
export interface NetworkAlert {
  id: string;
  elementId: string;
  elementType: ElementType;
  timestamp: Date | number;
  severity: 'critical' | 'major' | 'minor' | 'warning' | 'info';
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  title?: string;
  resolvedBy?: string;
  resolved?: boolean;
  deviceType?: string;
}

/**
 * Interfaz para programación de mantenimiento
 */
export interface MaintenanceSchedule {
  id: string;
  elementIds: string[];
  startDate: Date;
  endDate: Date;
  description: string;
  technician: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

/**
 * Interfaz para archivos adjuntos
 */
export interface Attachment {
  id: string;
  elementId: string;
  type: 'image' | 'document' | 'video';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  uploadedBy?: string;
  description?: string;
}

/**
 * Interfaz para clientes
 */
export interface Client {
  id: string;
  name: string;
  type: ClientType;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  associatedElementIds?: string[];
}

/**
 * Función para crear una posición geográfica desde coordenadas
 */
export function createPosition(coordinates: [number, number], options: Partial<Omit<GeographicPosition, 'coordinates' | 'lat' | 'lng'>> = {}): GeographicPosition {
  return {
    coordinates,
    lat: coordinates[1], // La latitud es el segundo valor
    lng: coordinates[0], // La longitud es el primer valor
    ...options
  };
}

/**
 * Interfaces para tipos específicos de elementos de red
 */

export interface OLT extends NetworkElement {
  type: ElementType.OLT;
  manufacturer?: string;
  model?: string;
  ponPorts?: number;
  ponStandard?: PONStandard;
  temperature?: number;
  utilization?: number;
  rackmountHeight?: number;
  powerConsumption?: number;
  portCount?: number;
  serialNumber?: string;
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion?: string;
  properties?: {
    model: string;
    manufacturer: string;
    ponPorts: number;
    ponStandard: PONStandard;
    temperature?: number;
    utilization?: number;
    rackmountHeight?: number;
    powerConsumption?: number;
  };
}

export interface ONT extends NetworkElement {
  type: ElementType.ONT;
  manufacturer?: string;
  model?: string;
  ponStandard?: PONStandard;
  macAddress?: string;
  serialNumber?: string;
  signal?: number;
  txPower?: number;
  rxPower?: number;
  clientId?: string;
  ipAddress?: string;
  oltId?: string;
  properties?: {
    model: string;
    manufacturer: string;
    ponStandard: PONStandard;
    macAddress?: string;
    serialNumber?: string;
    signal?: number;
    txPower?: number;
    rxPower?: number;
  };
}

export interface ODF extends NetworkElement {
  type: ElementType.ODF;
  capacity?: number;
  manufacturer?: string;
  model?: string;
  odfType?: ODFType;
  rackPosition?: string;
  usedPorts?: number;
  totalPortCapacity?: number;
  properties?: {
    capacity: number;
    manufacturer?: string;
    model?: string;
    odfType: ODFType;
    rackPosition?: string;
    usedPorts?: number;
  };
}

export interface FDP extends NetworkElement {
  type: ElementType.FDP;
  capacity?: number;
  usedPorts?: number;
  manufacturer?: string;
  model?: string;
  installationType?: string;
  isWaterproof?: boolean;
  connectionType?: string;
  properties?: {
    capacity: number;
    usedPorts: number;
    manufacturer?: string;
    model?: string;
    installationType?: string;
    isWaterproof?: boolean;
    connectionType?: string;
  };
}

export interface EDFA extends NetworkElement {
  type: ElementType.EDFA;
  model?: string;
  manufacturer?: string;
  gainDb?: number;
  wavelength?: number;
  inputPowerRange?: {
    min: number;
    max: number;
  };
  outputPowerRange?: {
    min: number;
    max: number;
  };
  serialNumber?: string;
  installationDate?: Date;
  properties?: {
    model: string;
    manufacturer: string;
    gainDb: number;
    wavelength: number;
    inputPowerRange: {
      min: number;
      max: number;
    };
    outputPowerRange: {
      min: number;
      max: number;
    };
  };
}

export interface Splitter extends NetworkElement {
  type: ElementType.SPLITTER;
  ratio?: string; // Formato: "1:N" (ej: "1:8", "1:16")
  splitterType?: SplitterType;
  outputType?: SplitterOutputType;
  attenuationDb?: number;
  connector?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  splitRatio?: string;
  insertionLoss?: number;
  properties?: {
    ratio: string; // Formato: "1:N" (ej: "1:8", "1:16")
    splitterType: SplitterType;
    outputType: SplitterOutputType;
    attenuationDb?: number;
    connector?: string;
    manufacturer?: string;
    model?: string;
  };
}

export interface Manga extends NetworkElement {
  type: ElementType.MANGA;
  capacity?: number;
  model?: string;
  manufacturer?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: string;
  };
  installationType?: string;
  usedCapacity?: number;
  serialNumber?: string;
  installationDate?: Date;
  sealType?: string;
  properties?: {
    capacity: number;
    model?: string;
    manufacturer?: string;
    dimensions?: {
      width: number;
      height: number;
      depth: number;
      unit: string;
    };
    type?: string;
    installationType?: string;
  };
}

export interface TerminalBox extends NetworkElement {
  type: ElementType.TERMINAL_BOX;
  capacity?: number;
  model?: string;
  manufacturer?: string;
  installationType?: string;
  isWaterproof?: boolean;
  mountingType?: string;
  portCapacity?: number;
  usedPorts?: number;
  serialNumber?: string;
  installationDate?: Date;
  properties?: {
    capacity: number;
    model?: string;
    manufacturer?: string;
    installationType?: string;
    isWaterproof?: boolean;
    mountingType?: string;
  };
}

export interface FiberThread extends NetworkElement {
  type: ElementType.FIBER_THREAD;
  fiberType?: FiberType;
  length?: number;
  attenuationDb?: number;
  color?: string;
  cableId?: string;
  bufferColor?: string;
  coreNumber?: number;
  properties?: {
    fiberType: FiberType;
    length: number;
    attenuationDb?: number;
    color?: string;
    cableId?: string;
    bufferColor?: string;
  };
}

export interface MSAN extends NetworkElement {
  type: ElementType.MSAN;
  properties: {
    model: string;
    manufacturer: string;
    serviceCapacity: number;
    supportedServices: string[];
    rackmountHeight?: number;
    powerConsumption?: number;
  };
}

export interface WDMFilter extends NetworkElement {
  type: ElementType.WDM_FILTER;
  properties: {
    filterType: string;
    wavelengths: number[];
    insertionLoss?: number;
    manufacturer?: string;
    model?: string;
  };
}

export interface Router extends NetworkElement {
  type: ElementType.ROUTER;
  properties: {
    model: string;
    manufacturer: string;
    ipAddress?: string;
    macAddress?: string;
    interfaces?: {
      name: string;
      type: string;
      speed: number;
    }[];
  };
}

export interface Rack extends NetworkElement {
  type: ElementType.RACK;
  properties: {
    height: number; // En unidades de rack (U)
    width: number;
    depth: number;
    manufacturer?: string;
    model?: string;
    maxWeight?: number;
    powerCapacity?: number;
  };
}
