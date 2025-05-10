/**
 * Modelos para el dashboard
 */

export interface StatCard {
  id: string;
  title: string;
  value: string;
  icon: string;
  color: string;
  trend: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  action: string;
  user: string;
  timestamp: Date;
  details?: string;
  deviceId?: string;
  deviceType?: string;
  location?: string;
}

export enum ActivityType {
  CONFIG = 'config',
  MONITOR = 'monitor',
  ALERT = 'alert',
  SYSTEM = 'system',
  MAINTENANCE = 'maintenance'
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: number;
  status: MetricStatus;
  timestamp: Date;
  history?: {
    value: number;
    timestamp: Date;
  }[];
}

export enum MetricStatus {
  NORMAL = 'ACTIVE',
  WARNING = 'WARNING',
  CRITICAL = 'FAULT',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
  PLANNED = 'PLANNED',
  UNKNOWN = 'UNKNOWN'
}

export interface SystemAlert {
  id: string;
  type: AlertSeverity;
  message: string;
  timestamp: Date;
  source: string;
  status: 'active' | 'resolved';
  deviceId?: string;
  deviceType?: string;
  location?: string;
  details?: string;
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface DashboardSummary {
  stats: StatCard[];
  recentActivities: FiberActivity[];
  performanceMetrics: FiberMetric[];
  alerts: FiberAlert[];
}

// Tipos específicos para red de fibra óptica
export interface FiberMetric extends PerformanceMetric {
  type: FiberMetricType;
  wavelength?: number; // en nm
  powerLevel?: number; // en dBm
  attenuation?: number; // en dB/km
  bandwidth?: number; // en Mbps
  elementType?: FiberDeviceType;
  elementId?: string;
  location?: string;
  connectionStatus?: string;
  signalQuality?: number; // en porcentaje
  bitErrorRate?: number;
}

export interface FiberAlert {
  id: string;
  type: AlertSeverity;
  message: string;
  timestamp: Date;
  source: string;
  status: 'active' | 'resolved';
  deviceId: string;
  elementType?: FiberDeviceType;
  elementId?: string;
  fiberSegment?: string;
  splicePoint?: string;
  distance?: number; // en km
  opticalPower?: number; // en dBm
  affectedElements?: string[];
  priority?: 'low' | 'medium' | 'high';
  resolution?: string;
  maintenanceSchedule?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  acknowledged: boolean;
  location?: string;
  deviceType?: string;
}

export interface FiberActivity extends Activity {
  fiberSegment?: string;
  splicePoint?: string;
  maintenanceType?: 'preventive' | 'corrective';
  affectedUsers?: number;
  elementType?: FiberDeviceType;
  elementId?: string;
  workOrderId?: string;
  technician?: string;
  estimatedDuration?: number; // en minutos
  completionStatus?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
}

// Enumeraciones específicas para fibra óptica
export enum FiberDeviceType {
  OLT = 'OLT',
  ONT = 'ONT',
  FDP = 'FDP',
  SPLITTER = 'SPLITTER',
  SWITCH = 'SWITCH',
  ROUTER = 'ROUTER',
  SERVER = 'SERVER',
  ANTENNA = 'ANTENNA',
  OTHER = 'OTHER'
}

export enum FiberMetricType {
  SIGNAL_STRENGTH = 'signal_strength',
  BANDWIDTH = 'bandwidth',
  LATENCY = 'latency',
  PACKET_LOSS = 'packet_loss',
  ERROR_RATE = 'error_rate',
  OPTICAL_POWER = 'optical_power',
  ATTENUATION = 'attenuation',
  SIGNAL_QUALITY = 'signal_quality'
}

export interface FiberDevice {
  id: string;
  name: string;
  type: FiberDeviceType;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'active' | 'inactive' | 'maintenance' | 'fault';
  properties: Record<string, any>;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface FiberSegment {
  id: string;
  name: string;
  startDeviceId: string;
  endDeviceId: string;
  length: number;
  type: 'FIBER' | 'COPPER' | 'WIRELESS';
  status: 'active' | 'inactive' | 'maintenance' | 'fault';
  properties: Record<string, any>;
}

export interface FiberConnection {
  id: string;
  name: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  type: 'FIBER' | 'COPPER' | 'WIRELESS';
  status: 'active' | 'inactive' | 'maintenance' | 'fault';
  properties: Record<string, any>;
}

export interface FiberNetwork {
  id: string;
  name: string;
  description: string;
  devices: FiberDevice[];
  segments: FiberSegment[];
  connections: FiberConnection[];
  properties: Record<string, any>;
} 