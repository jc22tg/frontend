/**
 * Tipos unificados del frontend basados en common-definitions
 * Este archivo reemplaza todos los tipos locales problemáticos
 * Generado desde common-definitions para mantener consistencia
 */

// ============================================================================
// ENUMS PRINCIPALES - ALINEADOS CON COMMON-DEFINITIONS
// ============================================================================

/**
 * Tipos de elementos de red (desde common-definitions/enums/common.enums.ts)
 */
export enum ElementType {
  DEVICE = 'DEVICE',
  CABLE = 'CABLE',
  CONNECTOR = 'CONNECTOR',
  PORT = 'PORT',
  SPLITTER = 'SPLITTER',
  AMPLIFIER = 'AMPLIFIER',
  SWITCH = 'SWITCH',
  OPTICAL_SWITCH = 'OPTICAL_SWITCH',
  ROUTER = 'ROUTER',
  OLT = 'OLT',
  ONT = 'ONT',
  ONU = 'ONU',
  ODF = 'ODF',
  FDP = 'FDP',
  CHAMBER = 'CHAMBER',
  POLE = 'POLE',
  BUILDING = 'BUILDING',
  FIBER_CONNECTION = 'FIBER_CONNECTION',
  MANGA = 'MANGA',
  TERMINAL_BOX = 'TERMINAL_BOX',
  RACK = 'RACK',
  CUSTOM = 'CUSTOM',
  
  // Elementos CATV
  CATV_HEADEND = 'CATV_HEADEND',
  CATV_AMPLIFIER = 'CATV_AMPLIFIER',
  CATV_TAP = 'CATV_TAP',
  CATV_TERMINATOR = 'CATV_TERMINATOR',
  CATV_MODULATOR = 'CATV_MODULATOR',
  CATV_DEMODULATOR = 'CATV_DEMODULATOR',
  CATV_FILTER = 'CATV_FILTER',
  CATV_BOX = 'CATV_BOX',
  
  // Elementos de fibra óptica avanzados
  OPTICAL_AMPLIFIER = 'OPTICAL_AMPLIFIER',
  OPTICAL_ATTENUATOR = 'OPTICAL_ATTENUATOR',
  OPTICAL_CIRCULATOR = 'OPTICAL_CIRCULATOR',
  OPTICAL_COUPLER = 'OPTICAL_COUPLER',
  OPTICAL_FILTER = 'OPTICAL_FILTER',
  OPTICAL_ISOLATOR = 'OPTICAL_ISOLATOR',
  OPTICAL_TRANSCEIVER = 'OPTICAL_TRANSCEIVER',
  
  // Elementos de prueba y medición
  OPTICAL_POWER_METER = 'OPTICAL_POWER_METER',
  OPTICAL_TIME_DOMAIN_REFLECTOMETER = 'OPTICAL_TIME_DOMAIN_REFLECTOMETER',
  OPTICAL_SPECTRUM_ANALYZER = 'OPTICAL_SPECTRUM_ANALYZER',
  OPTICAL_FIBER_IDENTIFIER = 'OPTICAL_FIBER_IDENTIFIER',
  OPTICAL_FIBER_CLEAVER = 'OPTICAL_FIBER_CLEAVER',
  OPTICAL_FIBER_FUSION_SPLICER = 'OPTICAL_FIBER_FUSION_SPLICER',
  CATV_TEST_EQUIPMENT = 'CATV_TEST_EQUIPMENT',
  
  // Elementos faltantes desde el frontend legacy
  MSAN = 'MSAN',
  EDFA = 'EDFA',
  FIBER_CLOSURE = 'FIBER_CLOSURE',
  SPLICE_BOX = 'SPLICE_BOX',
  NAP = 'NAP',
  FAT = 'FAT',
  DISTRIBUTION_BOX = 'DISTRIBUTION_BOX',
  CABINET = 'CABINET',
  GATEWAY = 'GATEWAY',
  FIBER_THREAD = 'FIBER_THREAD',
  WDM_FILTER = 'WDM_FILTER',
  ATTENUATOR = 'ATTENUATOR',
  ROADM = 'ROADM',
  MULTIPLEXER = 'MULTIPLEXER',
  DEMULTIPLEXER = 'DEMULTIPLEXER',
  FIBER_SPLICE = 'FIBER_SPLICE',
  CROSS_CONNECT = 'CROSS_CONNECT',
  DROP_CABLE = 'DROP_CABLE',
  DISTRIBUTION_CABLE = 'DISTRIBUTION_CABLE',
  FEEDER_CABLE = 'FEEDER_CABLE',
  BACKBONE_CABLE = 'BACKBONE_CABLE',
  COHERENT_TRANSPONDER = 'COHERENT_TRANSPONDER',
  WAVELENGTH_ROUTER = 'WAVELENGTH_ROUTER',
  NETWORK_GRAPH = 'NETWORK_GRAPH',
  SITE = 'SITE',
  NODE = 'NODE',
  PATCH_PANEL = 'PATCH_PANEL',
  REPEATER = 'REPEATER',
  SUBSCRIBER = 'SUBSCRIBER',
  SERVICE_POINT = 'SERVICE_POINT',
  AGGREGATION_POINT = 'AGGREGATION_POINT',
  ACCESS_POINT = 'ACCESS_POINT',
  HUB = 'HUB',
  SLACK_FIBER = 'SLACK_FIBER',
  DUCT = 'DUCT',
  FIBER_CABLE = 'FIBER_CABLE',
  SERVICE_AREA = 'SERVICE_AREA',
  WSS = 'WSS',
  MONITORING_SYSTEM = 'MONITORING_SYSTEM',
  RF_OVERLAY_SYSTEM = 'RF_OVERLAY_SYSTEM',
  MDU_BUILDING = 'MDU_BUILDING',
  ROUTE = 'ROUTE',
  FIBER_STRAND = 'FIBER_STRAND'
}

/**
 * Estados de elementos (desde common-definitions/enums/network.enums.ts)
 */
export enum ElementStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  FAULT = 'FAULT',
  TESTING = 'TESTING',
  OPERATIONAL = 'OPERATIONAL',
  NON_OPERATIONAL = 'NON_OPERATIONAL',
  DEGRADED = 'DEGRADED',
  UNKNOWN = 'UNKNOWN',
  INSTALLATION = 'INSTALLATION',
  CONFIGURATION = 'CONFIGURATION',
  UPGRADE = 'UPGRADE',
  REPAIR = 'REPAIR',
  RESERVE = 'RESERVE',
  STANDBY = 'STANDBY',
  EMERGENCY = 'EMERGENCY',
  OFFLINE = 'OFFLINE',
  PENDING = 'PENDING',
  DECOMMISSIONED = 'DECOMMISSIONED',
  // Valores legacy del frontend
  ERROR = 'ERROR',
  PLANNING = 'PLANNING',
  // Valores adicionales requeridos por servicios
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  PLANNED = 'PLANNED',
  BUILDING = 'BUILDING'
}

/**
 * Tipos de fibra óptica (desde common-definitions)
 */
export enum FiberType {
  SINGLE_MODE = 'SINGLE_MODE',
  MULTI_MODE = 'MULTI_MODE',
  BEND_INSENSITIVE = 'BEND_INSENSITIVE',
  DISPERSION_SHIFTED = 'DISPERSION_SHIFTED',
  NON_ZERO_DISPERSION_SHIFTED = 'NON_ZERO_DISPERSION_SHIFTED',
  POLARIZATION_MAINTAINING = 'POLARIZATION_MAINTAINING'
}

/**
 * Tipos de cable (desde common-definitions)
 */
export enum CableType {
  FEEDER = 'FEEDER',
  DISTRIBUTION = 'DISTRIBUTION',
  DROP = 'DROP',
  BACKBONE = 'BACKBONE',
  PATCH = 'PATCH',
  INDOOR = 'INDOOR',
  OUTDOOR = 'OUTDOOR',
  AERIAL = 'AERIAL',
  UNDERGROUND = 'UNDERGROUND',
  SUBMARINE = 'SUBMARINE',
  // Valores extendidos del frontend
  AERIAL_SELF_SUPPORTING = 'AERIAL_SELF_SUPPORTING',
  AERIAL_LASHED = 'AERIAL_LASHED',
  UNDERGROUND_DIRECT_BURIED = 'UNDERGROUND_DIRECT_BURIED',
  UNDERGROUND_DUCT = 'UNDERGROUND_DUCT',
  UNDERWATER = 'UNDERWATER',
  INDOOR_OUTDOOR = 'INDOOR_OUTDOOR',
  INDOOR_RISER = 'INDOOR_RISER',
  INDOOR_PLENUM = 'INDOOR_PLENUM',
  DROP_FLAT = 'DROP_FLAT',
  DROP_ROUND = 'DROP_ROUND',
  ARMORED = 'ARMORED',
  RIBBON = 'RIBBON',
  MICRO_DUCT = 'MICRO_DUCT',
  CENTRAL_TUBE = 'CENTRAL_TUBE',
  LOOSE_TUBE = 'LOOSE_TUBE',
  MULTI_LOOSE_TUBE = 'MULTI_LOOSE_TUBE'
}

/**
 * Tipos de conectores (desde common-definitions)
 */
export enum ConnectorType {
  SC = 'SC',
  LC = 'LC',
  FC = 'FC',
  ST = 'ST',
  MTP = 'MTP',
  MPO = 'MPO',
  E2000 = 'E2000',
  MU = 'MU',
  DIN = 'DIN',
  SMA = 'SMA',
  BICONIC = 'BICONIC',
  FDDI = 'FDDI',
  ESCON = 'ESCON'
}

/**
 * Estándares PON (desde common-definitions/enums/gpon.enums.ts)
 */
export enum PONStandard {
  GPON = 'GPON',
  EPON = 'EPON',
  XG_PON = 'XG_PON',
  XGS_PON = 'XGS_PON',
  NG_PON2 = 'NG_PON2',
  TEN_EPON = 'TEN_EPON',  // 10G-EPON
  TWENTY_FIVE_G_PON = 'TWENTY_FIVE_G_PON',
  FIFTY_G_PON = 'FIFTY_G_PON',
  HUNDRED_G_PON = 'HUNDRED_G_PON'
}

/**
 * Métodos de autenticación PON
 */
export enum PONAuthenticationMethod {
  SERIAL_NUMBER = 'SERIAL_NUMBER',
  PASSWORD = 'PASSWORD',
  MAC_ADDRESS = 'MAC_ADDRESS',
  LOID = 'LOID',
  CERTIFICATE = 'CERTIFICATE',
  TOKEN = 'TOKEN',
  OUI = 'OUI',
  NONE = 'NONE'
}

/**
 * Métodos de encriptación PON
 */
export enum PONEncryptionMethod {
  AES = 'AES',
  DES = 'DES',
  TRIPLE_DES = 'TRIPLE_DES',
  AES_128 = 'AES_128',
  AES_256 = 'AES_256',
  CUSTOM = 'CUSTOM',
  NONE = 'NONE'
}

/**
 * Tipos de conexión
 */
export enum ConnectionType {
  FIBER = 'FIBER',
  ELECTRICAL = 'ELECTRICAL',
  WIRELESS = 'WIRELESS',
  VIRTUAL = 'VIRTUAL',
  LOGICAL = 'LOGICAL',
  COPPER = 'COPPER'
}

/**
 * Estados de conexión
 */
export enum ConnectionStatus {
  ACTIVE = 'ACTIVE',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  PARTIAL = 'PARTIAL',
  TESTING = 'TESTING',
  FAULT = 'FAULT',
  INACTIVE = 'INACTIVE',
  FAILED = 'FAILED',
  DEGRADED = 'DEGRADED',
  PLANNED = 'PLANNED'
}

// ============================================================================
// INTERFACES GEOGRÁFICAS UNIFICADAS
// ============================================================================

/**
 * Posición geográfica unificada
 * Combina formatos frontend (lat/lng) y backend (latitude/longitude + GeoJSON)
 */
export interface GeographicPosition {
  // Formato frontend compatible con Leaflet
  lat: number;
  lng: number;
  
  // Formato backend compatible con common-definitions
  latitude?: number;
  longitude?: number;
  altitude?: number;
  
  // Formato GeoJSON estándar
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Alias para compatibilidad con código existente
 */
export type GeoPosition = GeographicPosition;

// ============================================================================
// INTERFACES DE ELEMENTOS DE RED
// ============================================================================

/**
 * Elemento base de red - Alineado con common-definitions
 */
export interface BaseNetworkElement {
  id: string;
  name: string;
  description?: string;
  type: ElementType;
  status: ElementStatus;
  position: GeographicPosition;
  
  // Metadatos básicos
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  installationDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  
  // Propiedades de auditoría
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  
  // Propiedades adicionales flexibles
  properties?: Record<string, any>;
  tags?: string[];
  notes?: string;
}

/**
 * Elemento de red completo
 */
export interface NetworkElement extends BaseNetworkElement {
  // Conexiones y puertos
  ports?: NetworkPort[];
  connections?: string[]; // IDs de conexiones
  
  // Información operacional
  isActive?: boolean;
  lastCommunication?: Date;
  signalLevel?: number;
  powerConsumption?: number;
  temperature?: number;
  
  // Capacidades específicas por tipo
  capabilities?: ElementCapabilities;
  
  // Configuración específica
  configuration?: ElementConfiguration;
  
  // Monitoreo y alertas
  monitoring?: MonitoringData;
  alerts?: NetworkAlert[];
  
  // Relaciones
  parentId?: string;
  childIds?: string[];
  groupId?: string;
  
  // Metadatos adicionales
  metadata?: Record<string, any>;
  
  // Información geográfica extendida
  address?: string;
  building?: string;
  floor?: string;
  room?: string;
  rack?: string;
  position_in_rack?: number;
}

/**
 * Puerto de red
 */
export interface NetworkPort {
  id: string;
  name: string;
  type: string;
  status: ElementStatus;
  direction: 'INPUT' | 'OUTPUT' | 'BIDIRECTIONAL';
  connectorType?: ConnectorType;
  maxCapacity?: number;
  currentUsage?: number;
  connectionId?: string;
  properties?: Record<string, any>;
}

/**
 * Capacidades de elemento
 */
export interface ElementCapabilities {
  // Capacidades de conectividad
  maxPorts?: number;
  supportedProtocols?: string[];
  maxBandwidth?: number;
  
  // Capacidades PON específicas
  ponStandards?: PONStandard[];
  maxONUs?: number;
  splittingRatio?: string;
  
  // Capacidades ópticas
  wavelengthRange?: [number, number];
  opticalPowerRange?: [number, number];
  insertionLoss?: number;
  returnLoss?: number;
  
  // Capacidades CATV
  frequencyRange?: [number, number];
  channelCapacity?: number;
  amplificationGain?: number;
  
  // Otras capacidades específicas
  customCapabilities?: Record<string, any>;
}

/**
 * Configuración de elemento
 */
export interface ElementConfiguration {
  // Configuración de red
  ipAddress?: string;
  macAddress?: string;
  vlanIds?: number[];
  
  // Configuración PON
  ponConfiguration?: {
    standard: PONStandard;
    authMethod: PONAuthenticationMethod;
    encryptionMethod: PONEncryptionMethod;
    allocId?: number;
    onuId?: number;
  };
  
  // Configuración óptica
  opticalConfiguration?: {
    wavelength?: number;
    power?: number;
    attenuation?: number;
  };
  
  // Configuración CATV
  catvConfiguration?: {
    frequency?: number;
    channels?: number[];
    gain?: number;
  };
  
  // Configuración personalizada
  customConfiguration?: Record<string, any>;
}

/**
 * Datos de monitoreo
 */
export interface MonitoringData {
  timestamp: Date;
  
  // Métricas básicas
  uptime?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  temperature?: number;
  powerConsumption?: number;
  
  // Métricas de red
  bandwidth?: {
    upload: number;
    download: number;
  };
  latency?: number;
  packetLoss?: number;
  utilizationPercentage?: number; // Porcentaje de utilización
  
  // Métricas ópticas
  opticalPower?: {
    tx: number;
    rx: number;
  };
  
  // Métricas CATV
  signalLevel?: number;
  noiseLevel?: number;
  ber?: number; // Bit Error Rate
  
  // Métricas personalizadas
  customMetrics?: Record<string, number>;
}

/**
 * Alerta de red - Con timestamp incluido
 */
export interface NetworkAlert {
  id: string;
  elementId: string;
  elementType?: ElementType; // Tipo del elemento asociado
  type: 'ERROR' | 'WARNING' | 'INFO' | 'CRITICAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: Date; // ✅ Propiedad incluida
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
  deviceType?: string; // Para monitoring service
  details?: Record<string, any>; // Para monitoring service
}

// ============================================================================
// INTERFACES DE CONEXIÓN
// ============================================================================

/**
 * Conexión de red
 */
export interface NetworkConnection {
  id: string;
  name: string;
  type: ConnectionType;
  status: ConnectionStatus;
  
  // Extremos de la conexión
  sourceElementId: string;
  sourcePortId?: string;
  targetElementId: string;
  targetPortId?: string;
  
  // Propiedades de la conexión
  bandwidth?: number;
  capacity?: number; // Para servicios de conexión legacy
  utilization?: number; // Para servicios de conexión legacy
  length?: number; // en metros
  signalLevel?: number;
  latency?: number;
  
  // Propiedades del cable/medio
  cableType?: CableType;
  fiberType?: FiberType;
  fiberCount?: number;
  
  // Metadatos
  installationDate?: Date;
  lastMaintenanceDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Ruta geográfica (para visualización en mapa)
  path?: GeographicPosition[];
  
  // Propiedades adicionales
  properties?: Record<string, any>;
  notes?: string;
  description?: string; // Descripción de la conexión
  
  // Propiedades legacy del frontend
  detailedFiberConnectionId?: string;
  metadata?: Record<string, any>;
  vertices?: GeographicPosition[]; // Vértices para el mapa
  points?: GeographicPosition[]; // Puntos de la ruta
  fiberDetails?: any; // Detalles de fibra óptica
}

// ============================================================================
// INTERFACES ESPECÍFICAS DE ELEMENTOS
// ============================================================================

/**
 * OLT (Optical Line Terminal)
 */
export interface OLT extends NetworkElement {
  type: ElementType.OLT;
  
  // Configuración específica OLT
  ponPorts: PONPort[];
  uplinkPorts: UplinkPort[];
  maxONUs: number;
  supportedStandards: PONStandard[];
  
  // Estadísticas operacionales
  onlineONUs: number;
  totalBandwidth: number;
  usedBandwidth: number;
}

/**
 * ONT/ONU (Optical Network Terminal/Unit)
 */
export interface ONT extends NetworkElement {
  type: ElementType.ONT | ElementType.ONU;
  
  // Conexión al OLT
  oltId: string;
  ponPortId: string;
  allocId: number;
  onuId: number;
  
  // Configuración PON
  ponStandard: PONStandard;
  authMethod: PONAuthenticationMethod;
  encryptionMethod: PONEncryptionMethod;
  
  // Puertos de cliente
  ethernetPorts: number;
  potsPorts: number;
  rfPorts: number;
  
  // Información del cliente
  customerId?: string;
  serviceProfile?: string;
  qosProfile?: string;
  
  // Métricas ópticas
  opticalPower: {
    tx: number;
    rx: number;
  };
}

/**
 * Splitter óptico
 */
export interface OpticalSplitter extends NetworkElement {
  type: ElementType.SPLITTER;
  
  // Configuración del splitter
  splitRatio: string; // e.g., "1:8", "1:16", "1:32"
  inputPorts: number;
  outputPorts: number;
  
  // Especificaciones ópticas
  insertionLoss: number;
  returnLoss: number;
  uniformity: number;
  wavelengthRange: [number, number];
  
  // Tipo de splitter
  splitterType: 'PLC' | 'FBT';
  packageType: 'BARE' | 'LGX' | 'RACK' | 'WALL_MOUNT';
}

// ============================================================================
// UTILIDADES Y HELPERS
// ============================================================================

/**
 * Crea una posición geográfica unificada
 */
export function createGeographicPosition(
  lat: number, 
  lng: number, 
  altitude?: number
): GeographicPosition {
  return {
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    altitude,
    type: 'Point',
    coordinates: [lng, lat]
  };
}

/**
 * Convierte lat/lng simple a posición geográfica completa
 */
export function latLngToGeographicPosition(
  latLng: { lat: number; lng: number }
): GeographicPosition {
  return createGeographicPosition(latLng.lat, latLng.lng);
}

/**
 * Convierte posición geográfica a formato simple lat/lng
 */
export function geographicPositionToLatLng(
  position: GeographicPosition
): { lat: number; lng: number } {
  return {
    lat: position.lat,
    lng: position.lng
  };
}

/**
 * Posiciones predefinidas para República Dominicana
 */
export const DefaultPositions = {
  origin: () => createGeographicPosition(0, 0),
  santoDomingo: () => createGeographicPosition(18.4821, -69.9312),
  santiago: () => createGeographicPosition(19.4516, -70.6977),
  laRomana: () => createGeographicPosition(18.4273, -68.9728),
  puertoPlata: () => createGeographicPosition(19.7892, -70.6929),
  barahona: () => createGeographicPosition(18.2085, -71.1009),
  sanPedro: () => createGeographicPosition(18.4539, -69.3087)
};

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Puerto PON
 */
export interface PONPort extends NetworkPort {
  standard: PONStandard;
  maxONUs: number;
  activeONUs: number;
  splitRatio?: string;
}

/**
 * Puerto de uplink
 */
export interface UplinkPort extends NetworkPort {
  speed: '1G' | '10G' | '25G' | '40G' | '100G';
  protocol: 'ETHERNET' | 'GPON' | 'SONET' | 'SDH';
}

/**
 * Cliente de red
 */
export interface Client {
  id: string;
  name: string;
  type: ClientType;
  ontId?: string;
  address: string;
  coordinates?: GeographicPosition;
  serviceProfile?: string;
  status: ElementStatus;
  installationDate?: Date;
  contractNumber?: string;
  notes?: string;
}

/**
 * Tipos de cliente
 */
export enum ClientType {
  RESIDENTIAL = 'RESIDENTIAL',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
  GOVERNMENT = 'GOVERNMENT',
  INDUSTRIAL = 'INDUSTRIAL'
}

/**
 * Programación de mantenimiento
 */
export interface MaintenanceSchedule {
  id: string;
  elementId: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'UPGRADE' | 'INSPECTION';
  scheduledDate: Date;
  estimatedDuration: number; // en horas
  description: string;
  assignedTo?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedDate?: Date;
  notes?: string;
}

/**
 * Archivo adjunto
 */
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

/**
 * Entrada de historial
 */
export interface ElementHistoryEntry {
  id: string;
  elementId: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED' | 'MAINTENANCE' | 'ALERT';
  timestamp: Date;
  userId: string;
  description: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

/**
 * Capa personalizada del mapa
 */
export interface CustomLayer {
  id: string;
  name: string;
  type: 'VECTOR' | 'RASTER' | 'TILE';
  url?: string;
  visible: boolean;
  opacity: number;
  zIndex: number;
  order?: number; // Orden de visualización
  properties?: Record<string, any>;
  createdAt?: Date; // Para layer service
  updatedAt?: Date; // Para layer service  
  color?: string; // Para layer service
  icon?: string; // Para layer service
  isSystem?: boolean; // Para componentes de capas
  isEditable?: boolean; // Para componentes de capas
  elements?: ElementType[]; // Tipos de elementos asociados a esta capa
  description?: string; // Descripción de la capa
}

// ============================================================================
// ALIASES DE COMPATIBILIDAD PARA EL FRONTEND LEGACY
// ============================================================================

export type OLTElement = OLT;
export type ONTElement = ONT;
export type SplitterElement = OpticalSplitter;
// Para elementos que aún no están definidos, usar NetworkElement como base
export type FDPElement = NetworkElement;
export type ODFElement = NetworkElement;
export type EDFAElement = NetworkElement;
export type MangaElement = NetworkElement;
export type TerminalBoxElement = NetworkElement;
export type FiberThreadElement = NetworkElement;

/**
 * Opciones de configuración del mapa
 */
export interface MapOptions {
  zoom?: number;
  center?: GeographicPosition;
  editable?: boolean; // Para map service
  [key: string]: any; // Permitir propiedades adicionales
}
