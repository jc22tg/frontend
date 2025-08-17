import { InjectionToken } from '@angular/core';
import { NetworkElement, ElementType, ElementStatus, NetworkConnection } from '../../../shared/types/network.types';
import { GeographicPosition } from '../../../shared/types/geo-position';
import { Observable } from 'rxjs';

// Tokens para servicios de mapa
export const MAP_SERVICE_TOKEN = new InjectionToken<IMapService>('MapService');
export const NETWORK_STATE_SERVICE_TOKEN = new InjectionToken<INetworkStateService>('NetworkStateService');
export const MAP_ELEMENT_SERVICE_TOKEN = new InjectionToken<IMapElementService>('MapElementService');
export const NETWORK_DESIGN_SERVICE_TOKEN = new InjectionToken<INetworkDesignService>('NetworkDesignService');

// Interfaces genéricas para servicios

/**
 * Interfaz para el servicio de mapa
 */
export interface IMapService {
  initializeMap(config: any): void;
  panTo(position: GeographicPosition): void;
  zoomTo(level: number): void;
  centerOnCoordinates(position: { x: number, y: number }): void;
  setTool(tool: string): void;
  getNodesData(): any[];
  getLinksData(): any[];
  fitContentToScreen(): void;
  isMapReady(): Observable<boolean>;
  clearMap(): void;
  
  // Métodos adicionales para corregir errores de TypeScript
  selectElement(element: NetworkElement | null): void;
  addElementAtPosition(element: NetworkElement, x: number, y: number): void;
  handleConnection(source: NetworkElement, target: NetworkElement, status?: string): void;
  updateMapElements(elements: NetworkElement[], connections: NetworkConnection[]): void;
}

/**
 * Interfaz para el servicio de estado de red
 */
export interface INetworkStateService {
  getCurrentState(): any;
  updateDarkMode(isDarkMode: boolean): void;
  setCurrentTool(currentTool: string): void;
  updateActiveLayers(activeLayers: Set<ElementType>): void;
  updateSelectedElement(selectedElement: NetworkElement | null): void;
  setLayerActive(layer: ElementType, active: boolean): void;
  isLayerActive(type: ElementType): boolean;
  getSelectedElement(): NetworkElement | null;
  getSelectedElementAsObservable(): Observable<NetworkElement | null>;
  
  // Métodos adicionales para corregir errores de TypeScript
  setSelectedElement(element: NetworkElement | null): void;
  getElementState(element: NetworkElement): ElementStatus;
  updateElementState(element: NetworkElement, newState: ElementStatus): void;
  updateMonitoringData(elementId: string, data: any): void;
}

/**
 * Interfaz para el servicio de elementos de mapa
 */
export interface IMapElementService {
  loadElements(): Observable<NetworkElement[]>;
  selectElement(element: NetworkElement): void;
  clearSelection(): void;
  handleElementSelection(element: NetworkElement): void;
  updateElementPosition(elementId: string, x: number, y: number): void;
  createElement(element: Partial<NetworkElement>): Observable<NetworkElement>;
  updateElementProperties(elementId: string, properties: Partial<NetworkElement>): Observable<NetworkElement>;
}

/**
 * Interfaz para el servicio de diseño de red
 */
export interface INetworkDesignService {
  getElementsByType(type: ElementType): Observable<NetworkElement[]>;
  updateElementStatus(elementId: string | undefined, status: ElementStatus): Observable<NetworkElement>;
  validatePosition(position: any): boolean;
  getMonitoringData(elementId: string | undefined, elementType: ElementType): Observable<any>;
  createElement(element: Partial<NetworkElement>): Observable<NetworkElement>;
  updateElement(elementId: string, updates: Partial<NetworkElement>): Observable<NetworkElement>;
} 
