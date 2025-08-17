import { NetworkElement, ElementType, ElementStatus, ClosureType, SealingType, MountingType, SpliceType } from '../types/network.types';

export interface CableEntry {
  id: string;
  cableId?: string;
  direction: string; // Podría ser un enum: 'input' | 'output' | 'bidirectional'
  ductId?: string;
  isOccupied: boolean;
  sealingDiameter: number;
  notes?: string;
}

export interface SpliceTray {
  id: string;
  trayNumber: string;
  capacity: number;
  usedPositions?: number;
  spliceType: SpliceType; // Asegurarse que SpliceType esté en network.types.ts
  color?: string;
  notes?: string;
}

export interface EnvironmentalSpecs {
  temperatureRange?: {
    min: number;
    max: number;
  };
  ipRating?: string;
  uvResistant?: boolean;
}

export interface Manga extends NetworkElement {
  type: ElementType.MANGA;
  manufacturer: string;
  model: string;
  serialNumber: string;
  closureType: ClosureType;
  maxCableEntries: number;
  maxSpliceCapacity: number;
  isAerial: boolean; // Podría derivarse de mountingType si se prefiere ese enfoque
  ipRating: string; // También en environmentalSpecs. Unificar o decidir cuál usar.
  dimensions?: string; // e.g., "45x20x15 cm". Considerar un objeto { length, width, depth }
  material?: string;
  sealingType: SealingType; // El string 'sealType' de la interfaz anterior se reemplaza por este enum.
  hasSplitter: boolean;
  splitterIds?: string[];
  fedFdpIds?: string[];
  installationDate?: Date;
  locationDetails?: string;
  // notes?: string; // 'notes' ya está en NetworkElement. Decidir si se necesita uno específico para Manga.
  usedSplices: number;
  usedCableEntries: number;
  cableEntries?: CableEntry[];
  lastMaintenanceDate?: Date;
  maintenanceNotes?: string; // Diferente de 'notes' general.
  isWaterproof?: boolean; // Podría estar relacionado con ipRating.
  dimensionHeight?: number; // Para dimensiones más estructuradas
  dimensionWidth?: number;  // Para dimensiones más estructuradas
  dimensionDepth?: number;  // Para dimensiones más estructuradas
  environmentalSpecs?: EnvironmentalSpecs;
  nextMaintenanceDate?: Date;
  spliceConfiguration?: {
    trays: SpliceTray[];
  };
  spliceDetails?: any[]; // Dejar como 'any' por ahora, o definir una interfaz más específica si es posible.

  // Campos que estaban en la interfaz Manga de element.interface.ts y que podrían mapearse o eliminarse:
  // capacity: number; // Reemplazado por maxSpliceCapacity
  // usedCapacity: number; // Reemplazado por usedSplices
  // inputFiberThreadIds?: string[]; // Podría derivarse de cableEntries o spliceDetails
  // outputFiberThreadIds?: string[]; // Podría derivarse de cableEntries o spliceDetails
  // spliceType?: string; // Ahora está en SpliceTray. Si hay un spliceType general para la manga, añadirlo.
  mountingType?: MountingType; // Añadido para mayor claridad si isAerial no es suficiente
} 
