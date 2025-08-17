import { NetworkElement, NetworkConnection } from '../../../shared/types/network.types';

/**
 * Interfaz para el servicio de interacción del mapa
 */
export interface IMapInteractionService {
  /**
   * Inicializa las interacciones del mapa
   */
  initializeInteractions(svg: any, mainGroup: any): void;
  
  /**
   * Establece la herramienta activa
   */
  setTool(tool: string): void;
  
  /**
   * Habilita el modo de panorámica (pan)
   */
  enablePanMode(): void;
  
  /**
   * Habilita el modo de selección
   */
  enableSelectMode(): void;
  
  /**
   * Habilita el modo de medición
   */
  enableMeasureMode(): void;
  
  /**
   * Habilita el modo de selección por área
   */
  enableAreaSelectMode(): void;
  
  /**
   * Deshabilita el modo de selección por área
   */
  disableAreaSelectMode(): void;
  
  /**
   * Selecciona un elemento
   */
  selectElement(element: NetworkElement | null): void;
  
  /**
   * Selecciona una conexión
   */
  selectConnection(connection: NetworkConnection): void;
  
  /**
   * Añade un elemento en una posición específica
   */
  addElementAtPosition(element: NetworkElement, x: number, y: number): void;
  
  /**
   * Maneja la conexión entre dos elementos
   */
  handleConnection(source: NetworkElement, target: NetworkElement, status?: string): void;
  
  /**
   * Añade un punto de medición
   */
  addMeasurementPoint(x: number, y: number): void;
  
  /**
   * Limpia las mediciones
   */
  clearMeasurements(): void;
  
  /**
   * Actualiza el rectángulo de selección
   */
  updateSelectionRect(): void;
  
  /**
   * Selecciona elementos en el área definida
   */
  selectElementsInArea(): void;
  
  /**
   * Establece el modo oscuro
   */
  setDarkMode(isDarkMode: boolean): void;
  
  /**
   * Obtiene la herramienta actual
   */
  getCurrentTool(): string;
} 
