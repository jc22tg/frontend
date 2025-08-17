import { NetworkElement } from '../../../shared/types/network.types';

/**
 * Interfaz para mediciones en el mapa
 */
export interface Measurement {
  sourceElement: NetworkElement | null;
  targetElement: NetworkElement | null;
  distance: number;
  unit: string;
  points: { x: number, y: number }[];
}

/**
 * Interfaz para el servicio de medición del mapa
 */
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
  
  /**
   * Exporta las mediciones actuales
   */
  exportMeasurements(format: string): void;
  
  /**
   * Actualiza la configuración del modo oscuro
   */
  setDarkMode(isDarkMode: boolean): void;
} 
