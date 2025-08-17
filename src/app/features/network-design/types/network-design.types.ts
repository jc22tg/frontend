/**
 * Tipos específicos para el módulo de diseño de red
 * Extiende los tipos base de la aplicación con tipos específicos para este módulo
 */

import { 
  ElementType,
  ElementStatus,
  NetworkElement,
  NetworkConnection,
  CustomLayer
} from '../../../shared/types/network.types';
import { GeographicPosition } from '../../../shared/types/geo-position';

/**
 * Modos de visualización del mapa
 */
export enum MapViewMode {
  DEFAULT = 'DEFAULT',
  EDIT = 'EDIT',
  SELECTION = 'SELECTION',
  MEASUREMENT = 'MEASUREMENT',
  CONNECTION = 'CONNECTION',
  DIAGNOSTIC = 'DIAGNOSTIC'
}

/**
 * Modos de edición de elementos
 */
export enum ElementEditMode {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  VIEW = 'VIEW',
  DELETE = 'DELETE',
  BATCH = 'BATCH'
}

/**
 * Tipos de acciones en el mapa
 */
export enum MapActionType {
  ZOOM_IN = 'ZOOM_IN',
  ZOOM_OUT = 'ZOOM_OUT',
  PAN = 'PAN',
  SELECT = 'SELECT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MEASURE = 'MEASURE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  REFRESH = 'REFRESH',
  RESET = 'RESET',
  FOCUS = 'FOCUS'
}

/**
 * Interfaz para eventos del mapa
 */
export interface MapEvent {
  type: MapActionType;
  timestamp: Date;
  data?: any;
  source?: string;
}

/**
 * Interfaz para mediciones en el mapa
 */
export interface MapMeasurement {
  id: string;
  type: 'DISTANCE' | 'AREA' | 'PERIMETER';
  points: GeographicPosition[];
  value: number;
  unit: string;
  color?: string;
  label?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Interfaz para cambios en el estado del mapa
 */
export interface MapStateChange {
  center?: GeographicPosition;
  zoom?: number;
  bounds?: {
    north: number;
    east: number;
    south: number;
    west: number;
  };
  visibleLayers?: string[];
  selectedElement?: string;
  visibleElements?: string[];
  editMode?: boolean;
  action?: MapActionType;
}

/**
 * Configuración de un widget de red
 */
export interface NetworkWidgetConfig {
  id: string;
  type: string;
  title: string;
  position?: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  isVisible?: boolean;
  isCollapsed?: boolean;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Interfaz para la selección de posición en el mapa
 */
export interface MapPositionSelection {
  position: GeographicPosition;
  address?: string;
  accuracy?: number;
  timestamp: Date;
  mode?: 'MANUAL' | 'SEARCH' | 'GPS';
}

/**
 * Interfaz para operaciones por lotes de elementos
 */
export interface BatchElementOperation {
  elements: string[];
  operation: 'UPDATE' | 'DELETE' | 'MOVE' | 'EXPORT';
  changes?: Partial<NetworkElement>;
  options?: Record<string, any>;
}

/**
 * Interfaz para elementos seleccionados en el mapa
 */
export interface ElementSelection {
  elements: NetworkElement[];
  connections: NetworkConnection[];
  groups?: Record<string, string[]>;
  timestamp: Date;
  source: 'MAP' | 'PANEL' | 'SEARCH' | 'API';
}

/**
 * Interfaz para exportación del mapa
 */
export interface MapExport {
  format: 'PNG' | 'PDF' | 'GeoJSON' | 'KML' | 'CSV';
  area?: {
    topLeft: GeographicPosition;
    bottomRight: GeographicPosition;
  };
  includeElements?: boolean;
  includeConnections?: boolean;
  includeBase?: boolean;
  filename?: string;
  quality?: number;
  options?: Record<string, any>;
}

/**
 * Configuración de visualización para tipos de elementos
 */
export interface ElementTypeVisualConfig {
  type: ElementType;
  icon: string;
  color: string;
  size: number;
  shape?: 'CIRCLE' | 'SQUARE' | 'TRIANGLE' | 'STAR' | 'CUSTOM';
  visible: boolean;
  labelVisible: boolean;
  zIndex?: number;
  minZoomVisibility?: number;
  customSvg?: string;
}

/**
 * Estado del componente principal de diseño de red
 */
export interface NetworkDesignState {
  mapViewMode: MapViewMode;
  elementEditMode: ElementEditMode;
  selectedElement: NetworkElement | null;
  selectedConnection: NetworkConnection | null;
  visibleLayers: CustomLayer[];
  mapCenter: GeographicPosition;
  mapZoom: number;
  isLoading: boolean;
  filters: Record<string, any>;
  activeWidgets: NetworkWidgetConfig[];
  measurements: MapMeasurement[];
  history: MapEvent[];
  elementTypeVisibility: Record<ElementType, boolean>;
} 
