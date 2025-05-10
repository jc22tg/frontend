import { Observable } from 'rxjs';
import { MapConfig } from '../types/network.types';

/**
 * Interfaz para el servicio principal del mapa
 */
export interface IMapCoreService {
  /**
   * Inicializa el mapa con la configuración proporcionada
   * @param config Configuración del mapa
   */
  initializeMap(config: MapConfig): Promise<void>;

  /**
   * Limpia todos los elementos del mapa
   */
  clearMap(): void;

  /**
   * Actualiza el tamaño del mapa según el contenedor actual
   */
  refreshMapSize(): void;

  /**
   * Detiene la simulación física del mapa
   */
  stopSimulation(): void;

  /**
   * Obtiene el nivel de zoom actual
   */
  getCurrentZoom(): number;

  /**
   * Establece el nivel de zoom del mapa
   * @param zoomLevel Nivel de zoom (escala)
   * @param animate Si debe animarse la transición
   */
  setZoom(zoomLevel: number, animate?: boolean): void;

  /**
   * Centra el mapa en su posición original
   */
  centerMap(): void;

  /**
   * Centra el mapa en las coordenadas especificadas
   * @param coordinates Coordenadas donde centrar el mapa
   */
  centerOnCoordinates(coordinates: { x: number, y: number }): void;

  /**
   * Obtiene las coordenadas del centro actual del mapa
   */
  getMapCenter(): { x: number, y: number };

  /**
   * Ajusta la vista para mostrar todo el contenido
   */
  fitContentToScreen(): void;

  /**
   * Retorna un Observable que indica si el mapa está listo
   */
  isMapReady(): Observable<boolean>;
} 