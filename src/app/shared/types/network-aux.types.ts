export interface QoSProfile {
  id: string;
  name: string;
  guaranteedBandwidth: number;
  maxBandwidth: number;
  priority: number;
  latency: number;
  jitter: number;
  packetLoss: number;
}

export interface AlarmThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

export interface SLATerms {
  id: string;
  name: string;
  uptime: number;
  responseTime: number;
  resolutionTime: number;
  bandwidth: {
    guaranteed: number;
    burst: number;
  };
  penalties: { amount: number; conditions: string[] }[];
}

export interface CustomerService {
  id: string;
  customerId: string;
  type: string;
  sla: SLATerms;
  startDate: Date;
  endDate: Date;
  status: string;
  incidents: any[];
  maintenanceHistory: any[];
}

export interface OpticalMeasurements {
  reflectance: number;
  chromaticDispersion: number;
  polarizationModeDispersion: number;
  bendingLoss: number;
  lastMeasurementDate: Date;
  measurementEquipment: string;
  technician: string;
  location: any;
  photos: string[];
}

export interface RedundancyConfig {
  isRedundant: boolean;
  primaryPath: string;
  backupPath: string;
  failoverTime: number;
  automaticFailover: boolean;
  lastFailoverTest: Date;
  failoverHistory: any[];
  powerBackup: {
    ups: boolean;
    generator: boolean;
    batteryRuntime: number;
    lastBatteryTest: Date;
    batteryStatus: number;
  };
}

export interface NetworkDocumentation {
  id: string;
  type: string;
  title: string;
  description: string;
  fileUrl: string;
  uploadDate: Date;
  uploadedBy: string;
  version: string;
  tags: string[];
  relatedElements: string[];
}

export interface MaintenanceRecord {
  id: string;
  date: Date;
  type: string;
  description: string;
  technician: string;
  technicianId: string;
  cost: number;
  parts: any[];
  beforeMetrics: any;
  afterMetrics: any;
  photos: string[];
  notes: string;
}

export interface NetworkCapacity {
  totalBandwidth: number;
  usedBandwidth: number;
  availableBandwidth: number;
  maxSubscribers: number;
  currentSubscribers: number;
}

export interface Accessibility {
  needsPermission: boolean;
  isLocked: boolean;
  hasRestrictedAccess: boolean;
  accessNotes: string;
} 
