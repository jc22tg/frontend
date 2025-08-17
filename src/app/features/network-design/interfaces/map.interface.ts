import { Observable } from 'rxjs';
import { NetworkElement, NetworkConnection } from '../../../shared/types/network.types';
import { D3Node, D3LinkData, MapConfig } from '../services/map-types';
import { MapPosition } from '../services/map-position.service';

/**
 * Interfaz para el servicio de mapa
 */
export interface IMapService {
  /**
   * Inicializa el mapa D3 en el contenedor especificado
   */
  initializeMap(config: MapConfig): Promise<void>;
  
  /**
   * Actualiza los elementos del mapa
   * @deprecated Usar el método que acepta NetworkElement[] y NetworkConnection[] en su lugar
   */
  updateMapElements(nodes: D3Node[], links: D3LinkData[]): void;
  
  /**
   * Actualiza los elementos del mapa a partir de elementos y conexiones de red
   * @param elements Elementos de red a visualizar
   * @param connections Conexiones entre elementos
   */
  updateMapElements(elements: NetworkElement[], connections: NetworkConnection[]): void;
  
  /**
   * Obtiene los nodos D3 procesados
   * @returns Array de nodos D3
   */
  getNodesData(): D3Node[];

  /**
   * Obtiene los enlaces D3 procesados
   * @returns Array de enlaces D3
   */
  getLinksData(): D3LinkData[];
  
  /**
   * Limpia el mapa eliminando todos los elementos
   */
  clearMap(): void;
  
  /**
   * Detiene la simulación física
   */
  stopSimulation(): void;
  
  /**
   * Selecciona un elemento del mapa
   */
  selectElement(element: NetworkElement | null): void;
  
  /**
   * Añade un elemento en una posición específica
   */
  addElementAtPosition(element: NetworkElement, x: number, y: number): void;
  
  /**
   * Maneja la conexión entre dos elementos
   */
  handleConnection(source: NetworkElement, target: NetworkElement, status?: string): void;
  
  /**
   * Centra el mapa
   */
  centerMap(): void;
  
  /**
   * Centra el mapa en las coordenadas específicas
   */
  centerOnCoordinates(coordinates: { x: number, y: number }): void;
  
  /**
   * Obtiene las coordenadas del centro del mapa
   */
  getMapCenter(): { x: number, y: number };
  
  /**
   * Establece el nivel de zoom
   */
  setZoom(zoomLevel: number, animate?: boolean): void;
  
  /**
   * Cambia el modo oscuro/claro
   */
  setDarkMode(isDarkMode: boolean): void;
  
  /**
   * Establece la herramienta activa (pan, select, measure, etc.)
   */
  setTool(tool: string): void;
  
  /**
   * Ajusta el contenido para que se vea completamente en la pantalla
   */
  fitContentToScreen(): void;
  
  /**
   * Exporta el mapa en el formato especificado
   */
  exportMap(format: string): void;
  
  /**
   * Obtiene el zoom actual
   */
  getCurrentZoom(): number;
  
  /**
   * Limpia las mediciones activas
   */
  clearMeasurements(): void;
  
  /**
   * Actualiza el tamaño del mapa
   */
  refreshMapSize(): void;
  
  /**
   * Convierte un porcentaje a escala
   */
  convertPercentToScale(percentageZoom: number): number;
  
  /**
   * Convierte una escala a porcentaje
   */
  convertScaleToPercent(scaleZoom: number): number;
  
  /**
   * Envía la posición seleccionada al editor
   */
  sendPositionToEditor(lat: number, lng: number): void;
  
  /**
   * Obtiene la posición seleccionada
   */
  getSelectedPosition(): Observable<MapPosition | null>;
  
  /**
   * Previsualiza un elemento en el mapa
   */
  previewElement(element: NetworkElement): void;
  
  /**
   * Limpia la previsualización
   */
  clearPreview(): void;
  
  /**
   * Comprueba si el mapa está listo
   */
  isMapReady(): Observable<boolean>;
  
  /**
   * Habilita la selección de posición
   */
  enablePositionSelection(): void;
  
  /**
   * Deshabilita la selección de posición
   */
  disablePositionSelection(): void;
} 
