import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../../../../../core/services/logger.service';

/**
 * Tipos de herramientas disponibles en el mapa
 */
export type MapToolType = 
  | 'pan'       // Herramienta de navegación
  | 'select'    // Selección de elementos
  | 'measure'   // Medición de distancias
  | 'connect'   // Crear conexiones entre elementos
  | 'area'      // Selección por área
  | 'polygon'   // Selección por polígono
  | 'edit';     // Edición de elementos

/**
 * Estado del mapa
 */
export interface MapState {
  center: [number, number];
  zoom: number;
  bounds?: [[number, number], [number, number]];
  activeTool: MapToolType;
  selectedElementIds: string[];
  selectedConnectionIds: string[];
  isEditing: boolean;
  isMeasuring: boolean;
  isConnecting: boolean;
}

/**
 * Servicio para gestionar el estado global del mapa
 * 
 * Este servicio centraliza toda la información sobre el estado actual del mapa,
 * incluyendo posición, zoom, herramientas activas, selecciones, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class MapStateService {
  // Dependencias
  private logger = inject(LoggerService);
  
  // Estado inicial
  private initialState: MapState = {
    center: [0, 0],
    zoom: 5,
    activeTool: 'pan',
    selectedElementIds: [],
    selectedConnectionIds: [],
    isEditing: false,
    isMeasuring: false, 
    isConnecting: false
  };
  
  // Estado actual
  private state: MapState = { ...this.initialState };
  
  // BehaviorSubjects
  private mapStateSubject = new BehaviorSubject<MapState>(this.state);
  private centerSubject = new BehaviorSubject<[number, number]>(this.state.center);
  private zoomSubject = new BehaviorSubject<number>(this.state.zoom);
  private activeToolSubject = new BehaviorSubject<MapToolType>(this.state.activeTool);
  private selectedElementIdsSubject = new BehaviorSubject<string[]>(this.state.selectedElementIds);
  private selectedConnectionIdsSubject = new BehaviorSubject<string[]>(this.state.selectedConnectionIds);
  
  // Observables públicos
  readonly mapState$ = this.mapStateSubject.asObservable();
  readonly center$ = this.centerSubject.asObservable();
  readonly zoom$ = this.zoomSubject.asObservable();
  readonly activeTool$ = this.activeToolSubject.asObservable();
  readonly selectedElementIds$ = this.selectedElementIdsSubject.asObservable();
  readonly selectedConnectionIds$ = this.selectedConnectionIdsSubject.asObservable();
  
  constructor() {
    this.logger.debug('MapStateService inicializado');
  }
  
  /**
   * Obtiene el estado actual completo del mapa
   */
  getState(): MapState {
    return { ...this.state };
  }
  
  /**
   * Actualiza el estado completo del mapa
   * @param state Nuevo estado
   */
  setState(state: Partial<MapState>): void {
    this.state = { ...this.state, ...state };
    this.mapStateSubject.next(this.state);
    
    // Actualizar subjects individuales si cambiaron
    if (state.center !== undefined) this.centerSubject.next(state.center);
    if (state.zoom !== undefined) this.zoomSubject.next(state.zoom);
    if (state.activeTool !== undefined) this.activeToolSubject.next(state.activeTool);
    if (state.selectedElementIds !== undefined) this.selectedElementIdsSubject.next(state.selectedElementIds);
    if (state.selectedConnectionIds !== undefined) this.selectedConnectionIdsSubject.next(state.selectedConnectionIds);
    
    this.logger.debug('Estado del mapa actualizado', this.state);
  }
  
  /**
   * Restablece el estado del mapa a los valores iniciales
   */
  resetState(): void {
    this.setState(this.initialState);
    this.logger.debug('Estado del mapa restablecido a valores iniciales');
  }
  
  /**
   * Actualiza el centro del mapa
   * @param center Nuevas coordenadas del centro [lng, lat]
   */
  setCenter(center: [number, number]): void {
    this.setState({ center });
  }
  
  /**
   * Actualiza el nivel de zoom del mapa
   * @param zoom Nuevo nivel de zoom
   */
  setZoom(zoom: number): void {
    this.setState({ zoom });
  }
  
  /**
   * Actualiza los límites del mapa visible
   * @param bounds Límites [[minLng, minLat], [maxLng, maxLat]]
   */
  setBounds(bounds: [[number, number], [number, number]]): void {
    this.setState({ bounds });
  }
  
  /**
   * Cambia la herramienta activa
   * @param tool Tipo de herramienta
   */
  setActiveTool(tool: MapToolType): void {
    const isEditing = tool === 'edit';
    const isMeasuring = tool === 'measure';
    const isConnecting = tool === 'connect';
    
    this.setState({ 
      activeTool: tool,
      isEditing,
      isMeasuring,
      isConnecting
    });
    
    this.logger.debug(`Herramienta activa cambiada a: ${tool}`);
  }
  
  /**
   * Selecciona un elemento
   * @param elementId ID del elemento
   * @param clearPrevious Si debe limpiar la selección previa
   */
  selectElement(elementId: string, clearPrevious = true): void {
    const selectedElementIds = clearPrevious 
      ? [elementId] 
      : [...this.state.selectedElementIds, elementId];
    
    this.setState({ selectedElementIds });
    this.logger.debug(`Elemento seleccionado: ${elementId}`);
  }
  
  /**
   * Deselecciona un elemento
   * @param elementId ID del elemento a deseleccionar
   */
  deselectElement(elementId: string): void {
    const selectedElementIds = this.state.selectedElementIds.filter(id => id !== elementId);
    this.setState({ selectedElementIds });
    this.logger.debug(`Elemento deseleccionado: ${elementId}`);
  }
  
  /**
   * Selecciona varios elementos
   * @param elementIds IDs de los elementos
   * @param clearPrevious Si debe limpiar la selección previa
   */
  selectElements(elementIds: string[], clearPrevious = true): void {
    const selectedElementIds = clearPrevious 
      ? [...elementIds] 
      : [...this.state.selectedElementIds, ...elementIds];
    
    this.setState({ selectedElementIds });
    this.logger.debug(`${elementIds.length} elementos seleccionados`);
  }
  
  /**
   * Limpia la selección de elementos
   */
  clearElementSelection(): void {
    this.setState({ selectedElementIds: [] });
    this.logger.debug('Selección de elementos limpiada');
  }
  
  /**
   * Selecciona una conexión
   * @param connectionId ID de la conexión
   * @param clearPrevious Si debe limpiar la selección previa
   */
  selectConnection(connectionId: string, clearPrevious = true): void {
    const selectedConnectionIds = clearPrevious 
      ? [connectionId] 
      : [...this.state.selectedConnectionIds, connectionId];
    
    this.setState({ selectedConnectionIds });
    this.logger.debug(`Conexión seleccionada: ${connectionId}`);
  }
  
  /**
   * Deselecciona una conexión
   * @param connectionId ID de la conexión a deseleccionar
   */
  deselectConnection(connectionId: string): void {
    const selectedConnectionIds = this.state.selectedConnectionIds.filter(id => id !== connectionId);
    this.setState({ selectedConnectionIds });
    this.logger.debug(`Conexión deseleccionada: ${connectionId}`);
  }
  
  /**
   * Limpia la selección de conexiones
   */
  clearConnectionSelection(): void {
    this.setState({ selectedConnectionIds: [] });
    this.logger.debug('Selección de conexiones limpiada');
  }
  
  /**
   * Limpia todas las selecciones (elementos y conexiones)
   */
  clearAllSelections(): void {
    this.setState({ 
      selectedElementIds: [],
      selectedConnectionIds: []
    });
    this.logger.debug('Todas las selecciones limpiadas');
  }
} 