import { NetworkElement, NetworkConnection } from '../../../shared/types/network.types';
import { D3Node, D3LinkData } from '../services/map-types';
import { LeafletMouseEvent } from 'leaflet';

/**
 * Interfaz para el servicio de renderizado del mapa
 */
export interface IMapRenderService {
  /**
   * Inicializa los componentes de renderizado en el mapa
   */
  initializeRender(svg: any, mainGroup: any, width: number, height: number): void;
  
  /**
   * Actualiza los nodos en el mapa
   */
  updateNodes(nodes: D3Node[]): void;
  
  /**
   * Actualiza los enlaces en el mapa
   */
  updateLinks(links: D3LinkData[]): void;
  
  /**
   * Actualiza las posiciones de todos los elementos
   */
  updatePositions(): void;
  
  /**
   * Convierte elementos de red a nodos D3
   */
  convertToD3Nodes(elements: NetworkElement[]): D3Node[];
  
  /**
   * Convierte conexiones de red a enlaces D3
   */
  convertToD3Links(connections: NetworkConnection[], elements: NetworkElement[]): D3LinkData[];
  
  /**
   * Obtiene la fuerza de enlace para una conexión específica
   */
  getLinkStrength(connection: NetworkConnection): number;
  
  /**
   * Resalta el elemento seleccionado
   */
  highlightSelectedElement(elementId: string | null): void;
  
  /**
   * Obtiene el color para un tipo de elemento y estado
   */
  getElementColor(type: string, status?: string): string;
  
  /**
   * Limpia el mapa
   */
  clearRender(): void;
  
  /**
   * Actualiza el tamaño del mapa
   */
  refreshRenderSize(width: number, height: number): void;
} 
