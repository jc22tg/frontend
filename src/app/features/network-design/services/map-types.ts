import { NetworkElement, NetworkConnection } from '../../../shared/types/network.types';

/**
 * Interfaces para el módulo de mapa y diseño de red
 */

/**
 * Nodo con propiedades de D3 para simulación de fuerzas
 */
export interface D3Node extends NetworkElement {
  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
  vx?: number;
  vy?: number;
}

/**
 * Enlaces con propiedades de D3 para simulación de fuerzas
 * D3 force simulation espera que source y target sean objetos D3Node o string
 */
export interface D3LinkData extends Omit<NetworkConnection, 'source' | 'target'> {
  source: D3Node | string;
  target: D3Node | string;
  sourceId: string;
  targetId: string;
  value: number;
}

/**
 * Interfaz para transformación de coordenadas geográficas
 */
export interface GeoTransform {
  originX: number;
  originY: number;
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Configuración del mapa
 */
export interface MapConfig {
  container: HTMLElement | string;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  isDarkMode?: boolean;
  geoTransform?: GeoTransform;
  onZoomChange?: (zoom: number) => void;
  onElementSelect?: (element: NetworkElement | null) => void;
  onElementDblClick?: (element: NetworkElement) => void;
  onConnectionSelect?: (connection: NetworkConnection | null) => void;
  onMeasurementComplete?: (measurement: {
    sourceElement: NetworkElement;
    targetElement: NetworkElement;
    distance: number;
  }) => void;
  onAreaSelectComplete?: (elements: NetworkElement[]) => void;
} 
