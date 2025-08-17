import {
  ElementStatus,
  ElementType,
  PortStatus,
  WavelengthType,
  AmplifierType,
  NetworkHierarchy,
} from '../types/network.types'; // Asumiendo que estos enums están definidos aquí
import { GeographicPosition } from '../types/geo-position'; // IMPORTAR GeographicPosition
import { WavelengthConfig } from './wavelength-config.model'; // Importar el modelo local

/**
 * Modelo para representar un EDFA en el sistema, alineado con EdfaResponseDto del backend.
 */
export interface EDFA {
  id: string;
  code: string;
  name: string;
  type: ElementType; // Debería ser ElementType.EDFA
  position: GeographicPosition;
  status: ElementStatus;
  notes?: string;
  projectId?: string;
  model: string;
  manufacturer: string;
  amplifierType: AmplifierType;
  supportedWavelengths: WavelengthType[];
  wavelengthConfigs: WavelengthConfig[]; // Usa la interfaz local
  gainDb: number;
  noiseFactorDb: number;
  maxOutputPowerDbm: number;
  opticalBandwidthNm?: number;
  gainFlatnessDb?: number;
  returnLossDb?: number;
  pmdPs?: number;
  portStatus: Record<number, PortStatus>;
  inputPort?: number;
  outputPort?: number;
  hierarchyLevel: NetworkHierarchy;
  serialNumber?: string;
  inputPowerDbm?: number;
  outputPowerDbm?: number;
  operatingTemperature?: number;
  hasCatv?: boolean;
  catvPowerDbm?: number;
  monitoringConfig?: {
    alarmThresholds: {
      minInputPower?: number;
      maxInputPower?: number;
      minOutputPower?: number;
      maxOutputPower?: number;
      maxNoiseFactorDb?: number;
      maxTemperature?: number;
      maxPumpCurrent?: number;
    };
    monitoringInterval: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
} 
