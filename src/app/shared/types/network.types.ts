/**
 * Interfaces unificadas para el módulo de diseño de red
 * MIGRADO: Ahora usa tipos unificados desde unified-network-types.ts
 * Este archivo mantiene compatibilidad con código existente
 */

// ===== IMPORTAR TODOS LOS TIPOS DESDE EL ARCHIVO UNIFICADO =====
export * from './unified-network-types';

// ===== MANTENER TIPOS ESPECÍFICOS PARA COMPATIBILIDAD =====

// Re-exportar GeographicPosition local para compatibilidad
export type { GeographicPosition } from './geo-position';

// Re-exportar tipo de conexión de fibra específico
export type { FiberConnection as DetailedFiberConnection } from '../models/fiber-connection.model';

// ===== TIPOS LEGACY PARA COMPATIBILIDAD =====

// Tipos de puerto y amplificador
export enum PortStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAULT = 'FAULT',
  MAINTENANCE = 'MAINTENANCE'
}

export enum WavelengthType {
  C_BAND = 'C_BAND',
  L_BAND = 'L_BAND',
  O_BAND = 'O_BAND'
}

export enum AmplifierType {
  EDFA = 'EDFA',
  RAMAN = 'RAMAN',
  SOA = 'SOA'
}

export enum NetworkHierarchy {
  CORE = 'CORE',
  DISTRIBUTION = 'DISTRIBUTION',
  ACCESS = 'ACCESS'
}

// Tipos de manga y cierre
export enum ClosureType {
  AERIAL = 'AERIAL',
  UNDERGROUND = 'UNDERGROUND',
  BUILDING = 'BUILDING'
}

export enum SealingType {
  MECHANICAL = 'MECHANICAL',
  HEAT_SHRINK = 'HEAT_SHRINK',
  REENTERABLE = 'REENTERABLE'
}

export enum MountingType {
  POLE = 'POLE',
  WALL = 'WALL',
  UNDERGROUND = 'UNDERGROUND'
}

export enum SpliceType {
  FUSION = 'FUSION',
  MECHANICAL = 'MECHANICAL'
}

// Importar NetworkElement para elementos legacy
import { NetworkElement } from './unified-network-types';

// Elementos específicos para compatibilidad
export interface ElementDetailView extends NetworkElement {
  connections?: string[]; // Para compatibilidad con componentes legacy
  
  // Propiedades específicas de OLT
  portCount?: number;
  ponPorts?: number;
  distributionPorts?: number;
  uplinkPorts?: number;
  odfIds?: string[];
  
  // Propiedades específicas de ONT
  ponStandard?: any; // PONStandard
  signalStrength?: number;
  oltId?: string;
  
  // Propiedades específicas de Splitter
  splitRatio?: string;
  outputPorts?: number;
  
  // Propiedades específicas de ODF/FDP
  totalPortCapacity?: number;
  usedPorts?: number;
  
  // Propiedades generales adicionales
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

// Elementos legacy
export type MSANElement = NetworkElement;
export type RouterElement = NetworkElement;
export type WDMFilterElement = NetworkElement;
export type SlackFiberElement = NetworkElement;
