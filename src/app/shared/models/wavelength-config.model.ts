import { WavelengthType } from '../types/network.types'; // Asumiendo que WavelengthType está definido aquí

/**
 * Modelo para la configuración de una longitud de onda de un EDFA,
 * alineado con WavelengthConfigDto del backend.
 */
export interface WavelengthConfig {
  wavelength: WavelengthType;
  inputPowerDbm: number;
  outputPowerDbm: number;
  gainDb: number;
  noiseFactorDb: number;
} 
