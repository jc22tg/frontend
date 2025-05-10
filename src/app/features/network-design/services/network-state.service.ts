import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement, NetworkConnection, ElementStatus, ElementType, CustomLayer, GeographicPosition } from '../../../shared/types/network.types';

export interface NetworkState {
  selectedElement: NetworkElement | null;
  selectedConnection: NetworkConnection | null;
  activeLayers: Set<ElementType>;
  customLayers: CustomLayer[];
  activeCustomLayers: Set<string>;
  isDarkMode: boolean;
  showMiniMap: boolean;
  currentTool: string;
  hasUnsavedChanges: boolean;
  zoomLevel: number;
  connections: NetworkConnection[];
  historyItems?: HistoryItem[];
  searchResults?: NetworkElement[];
  elementPreview?: NetworkElement | null;
}

export interface HistoryItem {
  action: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkStateService {
  // Estado global de la aplicación de red
  private initialState: NetworkState = {
    selectedElement: null,
    selectedConnection: null,
    activeLayers: new Set<ElementType>(),
    customLayers: [],
    activeCustomLayers: new Set<string>(),
    isDarkMode: false,
    showMiniMap: true,
    currentTool: 'pan',
    hasUnsavedChanges: false,
    zoomLevel: 100,
    connections: [],
    historyItems: [],
    searchResults: [],
    elementPreview: null
  };
  
  private stateSubject = new BehaviorSubject<NetworkState>(this.initialState);
  
  // Observable público para suscribirse a cambios de estado
  state$ = this.stateSubject.asObservable();
  
  private selectedElementSubject = new BehaviorSubject<NetworkElement | null>(null);
  private editingElementSubject = new BehaviorSubject<NetworkElement | null>(null);
  private mapVisibilitySubject = new BehaviorSubject<boolean>(true);
  private isDirtySubject = new BehaviorSubject<boolean>(false);
  private currentViewModeSubject = new BehaviorSubject<'map' | 'editor' | 'details'>('map');
  private diagnosticModeSubject = new BehaviorSubject<boolean>(false);
  private positionSelectionActiveSubject = new BehaviorSubject<boolean>(false);
  private selectedPositionSubject = new BehaviorSubject<GeographicPosition | null>(null);
  private elementPreviewSubject = new BehaviorSubject<NetworkElement | null>(null);
  
  // Subjects para los widgets
  private _showSearchWidget = new BehaviorSubject<boolean>(true);
  private _showElementsPanel = new BehaviorSubject<boolean>(true);

  // Publicar como observables
  public readonly showSearchWidget = this._showSearchWidget.asObservable();
  public readonly showElementsPanel = this._showElementsPanel.asObservable();
  
  constructor(
    private logger: LoggerService
  ) {
    // Inicializar con todos los tipos de ElementType activos por defecto
    this.updateActiveLayers(new Set(Object.values(ElementType)));
    
    this.logger.debug('NetworkStateService inicializado');
  }
  
  /**
   * Obtiene el estado actual
   */
  public getCurrentState(): NetworkState {
    return this.stateSubject.getValue();
  }
  
  /**
   * Actualiza el elemento seleccionado
   */
  updateSelectedElement(selectedElement: NetworkElement | null): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      selectedElement
    });
    
    this.selectedElementSubject.next(selectedElement);
    this.logger.debug(`Elemento seleccionado actualizado: ${selectedElement?.id || 'ninguno'}`);
  }
  
  /**
   * Actualiza las capas activas
   */
  updateActiveLayers(activeLayers: Set<ElementType>): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      activeLayers
    });
  }

  /**
   * Actualiza el modo oscuro
   */
  updateDarkMode(isDarkMode: boolean): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      isDarkMode
    });
  }

  /**
   * Actualiza la herramienta actual
   */
  updateCurrentTool(currentTool: string): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      currentTool
    });
  }

  /**
   * Actualiza la visibilidad del minimapa
   */
  updateMiniMap(showMiniMap: boolean): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      showMiniMap
    });
  }

  /**
   * Actualiza el estado de cambios sin guardar
   */
  updateUnsavedChanges(hasUnsavedChanges: boolean): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      hasUnsavedChanges
    });
  }

  /**
   * Actualiza las conexiones
   */
  updateConnections(connections: NetworkConnection[]): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      connections
    });
  }

  /**
   * Actualiza las capas personalizadas
   */
  updateCustomLayers(customLayers: CustomLayer[]): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      customLayers
    });
  }

  /**
   * Actualiza las capas personalizadas activas
   */
  updateActiveCustomLayers(activeCustomLayers: Set<string>): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      activeCustomLayers
    });
  }

  /**
   * Actualiza la vista previa de un elemento
   * @param element Elemento a mostrar en vista previa
   * @param action Acción que se está realizando (create, update, etc.)
   */
  updateElementPreview(element: NetworkElement | null, action?: 'create' | 'update' | 'delete' | 'preview'): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      elementPreview: element
    });
    
    this.elementPreviewSubject.next(element);
    
    if (action) {
      this.logger.debug(`Vista previa de elemento actualizada. Acción: ${action}, ID: ${element?.id || 'nuevo'}`);
    }
  }
  
  /**
   * Establece el elemento seleccionado
   */
  setSelectedElement(element: NetworkElement | null): void {
    this.updateSelectedElement(element);
  }
  
  /**
   * Obtiene el elemento seleccionado
   */
  getSelectedElement(): NetworkElement | null {
    return this.getCurrentState().selectedElement;
  }
  
  /**
   * Obtiene el elemento seleccionado como Observable
   */
  getSelectedElementAsObservable(): Observable<NetworkElement | null> {
    return this.selectedElementSubject.asObservable();
  }
  
  /**
   * Comprueba si una capa está activa
   */
  isLayerActive(type: ElementType): boolean {
    return this.getCurrentState().activeLayers.has(type);
  }
  
  /**
   * Establece la conexión seleccionada
   */
  setSelectedConnection(connection: NetworkConnection | null): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      selectedConnection: connection
    });
    this.logger.debug(`Conexión seleccionada: ${connection?.id || 'ninguna'}`);
  }

  /**
   * Alterna la visibilidad de una capa
   */
  toggleLayer(type: ElementType): void {
    const currentState = this.getCurrentState();
    const activeLayers = new Set(currentState.activeLayers);
    
    if (activeLayers.has(type)) {
      activeLayers.delete(type);
    } else {
      activeLayers.add(type);
    }
    
    this.updateActiveLayers(activeLayers);
    this.logger.debug(`Capa ${type} alternada. Estado: ${activeLayers.has(type)}`);
  }

  /**
   * Alterna la visibilidad de una capa personalizada
   */
  toggleCustomLayer(layerId: string): void {
    const currentState = this.getCurrentState();
    const activeCustomLayers = new Set(currentState.activeCustomLayers);
    
    if (activeCustomLayers.has(layerId)) {
      activeCustomLayers.delete(layerId);
    } else {
      activeCustomLayers.add(layerId);
    }
    
    this.updateActiveCustomLayers(activeCustomLayers);
    this.logger.debug(`Capa personalizada ${layerId} alternada. Estado: ${activeCustomLayers.has(layerId)}`);
  }

  /**
   * Establece el nivel de zoom
   */
  setZoomLevel(zoomLevel: number): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      zoomLevel
    });
  }

  /**
   * Obtiene el nivel de zoom
   */
  getZoomLevel(): number {
    return this.getCurrentState().zoomLevel;
  }

  /**
   * Establece el elemento en edición
   */
  setEditingElement(element: NetworkElement | null): void {
    this.editingElementSubject.next(element);
  }

  /**
   * Obtiene el elemento en edición
   */
  getEditingElement(): Observable<NetworkElement | null> {
    return this.editingElementSubject.asObservable();
  }

  /**
   * Establece la visibilidad del mapa
   */
  setMapVisibility(visible: boolean): void {
    this.mapVisibilitySubject.next(visible);
  }

  /**
   * Obtiene la visibilidad del mapa
   */
  getMapVisibility(): Observable<boolean> {
    return this.mapVisibilitySubject.asObservable();
  }

  /**
   * Establece si hay cambios sin guardar
   */
  setIsDirty(isDirty: boolean): void {
    this.isDirtySubject.next(isDirty);
    
    // También actualizar el estado global
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      hasUnsavedChanges: isDirty
    });
    
    this.logger.debug(`Estado de cambios sin guardar: ${isDirty}`);
  }

  /**
   * Obtiene si hay cambios sin guardar
   */
  getIsDirty(): Observable<boolean> {
    return this.isDirtySubject.asObservable();
  }

  /**
   * Verifica si hay cambios sin guardar (valor actual)
   */
  hasDirtyChanges(): boolean {
    return this.isDirtySubject.getValue() || this.getCurrentState().hasUnsavedChanges;
  }

  /**
   * Establece el modo de vista actual
   */
  setCurrentViewMode(mode: 'map' | 'editor' | 'details'): void {
    this.currentViewModeSubject.next(mode);
  }

  /**
   * Obtiene el modo de vista actual
   */
  getCurrentViewMode(): Observable<'map' | 'editor' | 'details'> {
    return this.currentViewModeSubject.asObservable();
  }

  /**
   * Muestra un mensaje de notificación
   */
  showSnackbar(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.logger.info(`[Snackbar] ${message} (${type})`);
    // Nota: Se ha eliminado MatSnackBar ya que parece que no está importado correctamente.
    // Los componentes que necesiten mostrar notificaciones deberán usar su propio servicio.
  }

  /**
   * Añade un elemento al historial
   */
  addToHistory(item: HistoryItem): void {
    const currentState = this.getCurrentState();
    const historyItems = [...(currentState.historyItems || []), item];
    
    // Limitar a los últimos 50 elementos
    if (historyItems.length > 50) {
      historyItems.shift();
    }
    
    this.stateSubject.next({
      ...currentState,
      historyItems
    });
  }

  /**
   * Actualiza los resultados de búsqueda
   */
  updateSearchResults(elements: NetworkElement[]): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({
      ...currentState,
      searchResults: elements
    });
  }

  /**
   * Obtiene los resultados de búsqueda
   */
  getSearchResults(): NetworkElement[] {
    return this.getCurrentState().searchResults || [];
  }

  /**
   * Establece la visibilidad del widget de búsqueda
   */
  setShowSearchWidget(show: boolean): void {
    this._showSearchWidget.next(show);
  }

  /**
   * Establece la visibilidad del panel de elementos
   */
  setShowElementsPanel(show: boolean): void {
    this._showElementsPanel.next(show);
  }

  /**
   * Crea una capa personalizada
   */
  createCustomLayer(layer: Omit<CustomLayer, 'id' | 'createdAt'>): string {
    const id = `layer_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newLayer: CustomLayer = {
      ...layer,
      id,
      createdAt: new Date()
    };
    
    const currentState = this.getCurrentState();
    const customLayers = [...currentState.customLayers, newLayer];
    
    this.updateCustomLayers(customLayers);
    
    return id;
  }

  /**
   * Actualiza una capa personalizada
   */
  updateCustomLayer(layerId: string, updates: Partial<CustomLayer>): boolean {
    const currentState = this.getCurrentState();
    const layerIndex = currentState.customLayers.findIndex(layer => layer.id === layerId);
    
    if (layerIndex === -1) {
      return false;
    }
    
    const updatedLayers = [...currentState.customLayers];
    updatedLayers[layerIndex] = {
      ...updatedLayers[layerIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    this.updateCustomLayers(updatedLayers);
    return true;
  }

  /**
   * Elimina una capa personalizada
   */
  deleteCustomLayer(layerId: string): boolean {
    const currentState = this.getCurrentState();
    const layerIndex = currentState.customLayers.findIndex(layer => layer.id === layerId);
    
    if (layerIndex === -1) {
      return false;
    }
    
    const updatedLayers = currentState.customLayers.filter(layer => layer.id !== layerId);
    
    // También eliminar de las capas activas
    const activeCustomLayers = new Set(currentState.activeCustomLayers);
    if (activeCustomLayers.has(layerId)) {
      activeCustomLayers.delete(layerId);
    }
    
    this.stateSubject.next({
      ...currentState,
      customLayers: updatedLayers,
      activeCustomLayers
    });
    
    return true;
  }

  /**
   * Obtiene las capas personalizadas
   */
  getCustomLayers(): CustomLayer[] {
    return this.getCurrentState().customLayers;
  }

  /**
   * Obtiene las capas personalizadas activas
   */
  getActiveCustomLayers(): CustomLayer[] {
    const currentState = this.getCurrentState();
    return currentState.customLayers.filter(layer => 
      currentState.activeCustomLayers.has(layer.id)
    );
  }

  /**
   * Obtiene una capa personalizada por ID
   */
  getCustomLayerById(id: string): CustomLayer | undefined {
    return this.getCurrentState().customLayers.find(layer => layer.id === id);
  }

  /**
   * Añade elementos a una capa personalizada
   */
  addElementsToCustomLayer(layerId: string, elementIds: string[]): boolean {
    const currentState = this.getCurrentState();
    const layerIndex = currentState.customLayers.findIndex(layer => layer.id === layerId);
    
    if (layerIndex === -1) {
      return false;
    }
    
    const layer = currentState.customLayers[layerIndex];
    const updatedElementIds = Array.from(new Set([...layer.elementIds, ...elementIds]));
    
    const updatedLayers = [...currentState.customLayers];
    updatedLayers[layerIndex] = {
      ...layer,
      elementIds: updatedElementIds,
      updatedAt: new Date()
    };
    
    this.updateCustomLayers(updatedLayers);
    return true;
  }

  /**
   * Elimina elementos de una capa personalizada
   */
  removeElementsFromCustomLayer(layerId: string, elementIds: string[]): boolean {
    const currentState = this.getCurrentState();
    const layerIndex = currentState.customLayers.findIndex(layer => layer.id === layerId);
    
    if (layerIndex === -1) {
      return false;
    }
    
    const layer = currentState.customLayers[layerIndex];
    const updatedElementIds = layer.elementIds.filter(id => !elementIds.includes(id));
    
    const updatedLayers = [...currentState.customLayers];
    updatedLayers[layerIndex] = {
      ...layer,
      elementIds: updatedElementIds,
      updatedAt: new Date()
    };
    
    this.updateCustomLayers(updatedLayers);
    return true;
  }

  /**
   * Establece la herramienta actual
   */
  setCurrentTool(tool: string): void {
    this.updateCurrentTool(tool);
  }

  /**
   * Limpia la vista previa de elemento
   */
  clearElementPreview(): void {
    this.updateElementPreview(null);
    this.logger.debug('Vista previa de elemento limpiada');
  }

  /**
   * Establece el modo de diagnóstico
   */
  setDiagnosticMode(enabled: boolean): void {
    this.diagnosticModeSubject.next(enabled);
    this.logger.debug(`Modo de diagnóstico ${enabled ? 'activado' : 'desactivado'}`);
  }

  /**
   * Obtiene el estado del modo de diagnóstico
   */
  getDiagnosticMode(): Observable<boolean> {
    return this.diagnosticModeSubject.asObservable();
  }

  /**
   * Activa/desactiva la selección de posición
   */
  setPositionSelectionActive(active: boolean): void {
    this.positionSelectionActiveSubject.next(active);
    this.logger.debug(`Selección de posición ${active ? 'activada' : 'desactivada'}`);
  }

  /**
   * Obtiene el estado de selección de posición
   */
  getPositionSelectionActive(): Observable<boolean> {
    return this.positionSelectionActiveSubject.asObservable();
  }

  /**
   * Establece la posición seleccionada
   */
  setSelectedPosition(position: GeographicPosition): void {
    this.selectedPositionSubject.next(position);
    this.logger.debug(`Posición seleccionada: [${position.lat}, ${position.lng}]`);
  }

  /**
   * Obtiene la posición seleccionada
   */
  getSelectedPosition(): Observable<GeographicPosition | null> {
    return this.selectedPositionSubject.asObservable();
  }
}
