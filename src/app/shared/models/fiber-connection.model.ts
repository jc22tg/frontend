import { FiberStrand } from './fiber-strand.model';

export enum FiberType {
  SINGLE_MODE = 'SINGLE_MODE',
  MULTI_MODE = 'MULTI_MODE'
}

export enum FiberUsageType {
  BACKBONE = 'BACKBONE',           // Fibra troncal principal
  DISTRIBUTION = 'DISTRIBUTION',   // Fibra de distribución
  DROP = 'DROP',                   // Fibra de bajada
  JUMPER = 'JUMPER',               // Fibra de conexión
  PATCH = 'PATCH',                 // Fibra de parcheo
  FEEDER = 'FEEDER',               // Fibra alimentadora
  ACCESS = 'ACCESS',               // Fibra de acceso
  INTERCONNECTION = 'INTERCONNECTION' // Fibra de interconexión
}

export enum ConnectorType {
  SC = 'SC',
  LC = 'LC',
  FC = 'FC',
  ST = 'ST',
  MTP = 'MTP',
  MPO = 'MPO'
}

export enum FiberStandard {
  ITU_T_G_652 = 'ITU-T G.652',
  ITU_T_G_655 = 'ITU-T G.655',
  ITU_T_G_657 = 'ITU-T G.657',
  ISO_IEC_11801 = 'ISO/IEC 11801',
  TIA_568 = 'TIA-568'
}

export enum PolishingType {
  PC = 'PC',
  UPC = 'UPC',
  APC = 'APC'
}

export enum InstallationType {
  AERIAL = 'AERIAL',
  UNDERGROUND = 'UNDERGROUND',
  INDOOR = 'INDOOR'
}

export enum MaintenanceInspectionType {
  VISUAL = 'VISUAL',
  OTDR = 'OTDR',
  POWER_METER = 'POWER_METER'
}

export enum EmergencyPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum CriticalPointType {
  SPLICE = 'SPLICE',
  CONNECTOR = 'CONNECTOR',
  BEND = 'BEND'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface DistanceMetrics {
  totalLength: number;        // Longitud total en metros
  splicePoints: number;       // Número de empalmes
  maxSpliceLoss: number;      // Pérdida máxima por empalme
  totalLoss: number;          // Pérdida total del enlace
}

export interface InstallationInfo {
  date: Date;
  contractor: string;
  installationType: InstallationType;
  depth?: number;              // Para instalaciones subterráneas
  height?: number;             // Para instalaciones aéreas
  conduitInfo?: {
    type: string;
    size: number;
    material: string;
  };
  photos?: string[];          // URLs de fotos de la instalación
}

export interface MaintenanceInfo {
  lastInspection: Date;
  nextInspection: Date;
  inspectionType: MaintenanceInspectionType;
  criticalPoints: {
    location: string;
    type: CriticalPointType;
    risk: RiskLevel;
  }[];
}

export interface EmergencyInfo {
  priority: EmergencyPriority;
  backupRoute?: string;
  restorationTime: number;     // Tiempo estimado de restauración en minutos
  affectedServices: string[];  // Servicios afectados
  contactList: {
    name: string;
    role: string;
    phone: string;
    email: string;
  }[];
}

export interface FiberConnection {
  id: string;
  name: string;
  description?: string;
  
  // Tipo de uso en la red
  usageType: FiberUsageType;
  
  // Características físicas
  fiberType: FiberType;
  connectorType: ConnectorType;
  polishingType: PolishingType;
  standard: FiberStandard;
  
  // Especificaciones técnicas
  insertionLoss: number; // dB
  returnLoss: number; // dB
  wavelength: number; // nm
  bandwidth: number; // MHz*km
  
  // Dimensiones
  coreDiameter: number; // μm
  claddingDiameter: number; // μm
  outerDiameter: number; // mm
  
  // Características de rendimiento
  operatingTemperature: {
    min: number; // °C
    max: number; // °C
  };
  tensileStrength: number; // N
  
  // Información de fabricación
  manufacturer: string;
  modelNumber: string;
  manufacturingDate: Date;
  
  // Certificaciones
  certifications: string[];
  
  // Relación con hilos
  strands: {
    total: number;
    available: number;
    inUse: number;
    reserved: number;
    damaged: number;
  };
  
  // Configuración de hilos
  strandConfiguration: {
    totalStrands: number;
    strandsPerTube: number;
    tubesPerCable: number;
    bufferTubes: number;
    centralStrengthMember: boolean;
  };

  // Información de red
  networkInfo: {
    networkSegment?: string;
    networkLevel?: string;
    redundancy?: boolean;
    backupPath?: string;
    maxDistance?: number;
    installationType?: string;
    protectionLevel?: string;
    distanceMetrics?: DistanceMetrics;
  };
  
  installation?: InstallationInfo;
  maintenance?: MaintenanceInfo;
  emergency?: EmergencyInfo;
  
  // Metadatos adicionales
  metadata?: {
    color?: string;
    material?: string;
    fireRating?: string;
    waterResistance?: string;
    [key: string]: any;
  };
}

export interface FiberConnectionCreate {
  name: string;
  description?: string;
  usageType: FiberUsageType;
  fiberType: FiberType;
  connectorType: ConnectorType;
  polishingType: PolishingType;
  standard: FiberStandard;
  insertionLoss: number;
  returnLoss: number;
  wavelength: number;
  bandwidth: number;
  coreDiameter: number;
  claddingDiameter: number;
  outerDiameter: number;
  operatingTemperature: {
    min: number;
    max: number;
  };
  tensileStrength: number;
  manufacturer: string;
  modelNumber: string;
  strandConfiguration: {
    totalStrands: number;
    strandsPerTube: number;
    tubesPerCable: number;
    bufferTubes: number;
    centralStrengthMember: boolean;
  };
  strands?: {
    total: number;
    available: number;
    inUse: number;
    reserved: number;
    damaged: number;
  };
  networkInfo: {
    networkSegment?: string;
    networkLevel?: string;
    redundancy?: boolean;
    backupPath?: string;
    maxDistance?: number;
    installationType?: string;
    protectionLevel?: string;
    distanceMetrics?: DistanceMetrics;
  };
  installation?: InstallationInfo;
  maintenance?: MaintenanceInfo;
  emergency?: EmergencyInfo;
  certifications?: string[];
  metadata?: any;
}

export interface FiberConnectionUpdate {
  name?: string;
  description?: string;
  usageType?: FiberUsageType;
  insertionLoss?: number;
  returnLoss?: number;
  operatingTemperature?: {
    min: number;
    max: number;
  };
  networkInfo?: {
    networkSegment?: string;
    networkLevel?: string;
    redundancy?: boolean;
    backupPath?: string;
    maxDistance?: number;
    installationType?: string;
    protectionLevel?: string;
    distanceMetrics?: DistanceMetrics;
  };
  installation?: InstallationInfo;
  maintenance?: MaintenanceInfo;
  emergency?: EmergencyInfo;
  certifications?: string[];
  metadata?: any;
} 
