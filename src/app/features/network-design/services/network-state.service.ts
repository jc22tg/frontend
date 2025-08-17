import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement, NetworkConnection, ElementStatus, ElementType, CustomLayer } from '../../../shared/types/network.types';
import { GeoPosition, createGeographicPosition } from '../../../shared/types/geo-position';
import { LayerService } from './layer.service';
import { 
  MapViewMode, 
  ElementEditMode, 
  NetworkWidgetConfig
} from '../types/network-design.types';

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

/**
 * Tipos de vista disponibles en el diseño de red
 */
export type ViewMode = 'map' | 'details' | 'editor' | 'list';

/**
 * Servicio para gestionar el estado global de la red
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkStateService implements OnDestroy {
  private destroy$ = new Subject<void>();

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
  private currentViewModeSubject = new BehaviorSubject<ViewMode>('map');
  private diagnosticModeSubject = new BehaviorSubject<boolean>(false);
  private positionSelectionActiveSubject = new BehaviorSubject<boolean>(false);
  private selectedPositionSubject = new BehaviorSubject<GeoPosition | null>(null);
  private elementPreviewSubject = new BehaviorSubject<NetworkElement | null>(null);
  
  // Subjects para los widgets
  private _showSearchWidget = new BehaviorSubject<boolean>(true);
  private _showElementsPanel = new BehaviorSubject<boolean>(true);

  // Publicar como observables
  public readonly showSearchWidget = this._showSearchWidget.asObservable();
  public readonly showElementsPanel = this._showElementsPanel.asObservable();
  
  // Estado del elemento seleccionado
  private selectedElement = new BehaviorSubject<NetworkElement | null>(null);
  
  // Estado de visualización actual
  private currentViewMode = new BehaviorSubject<ViewMode>('map');
  
  // Estado para cambios pendientes
  private isDirtyState = new BehaviorSubject<boolean>(false);
  
  // Estado actual de edición
  private isEditingState = new BehaviorSubject<boolean>(false);
  
  // Centro actual del mapa
  private mapCenter = new BehaviorSubject<GeoPosition>(
    createGeographicPosition(18.735693, -70.162651) // Ubicación inicial (Republic Dominicana)
  );
  
  // Nivel de zoom actual del mapa
  private mapZoom = new BehaviorSubject<number>(7);
  
  // Estado del elemento en edición
  private editingElement = new BehaviorSubject<NetworkElement | null>(null);
  
  // Estado de visibilidad del mapa
  private mapVisible = new BehaviorSubject<boolean>(true);
  
  // Modo de visualización del mapa
  private mapViewMode = new BehaviorSubject<MapViewMode>(MapViewMode.DEFAULT);
  
  // Modo de edición de elementos
  private elementEditMode = new BehaviorSubject<ElementEditMode>(ElementEditMode.VIEW);
  
  // Conexión seleccionada
  private selectedConnection = new BehaviorSubject<NetworkConnection | null>(null);
  
  // Capas visibles
  private visibleLayers = new BehaviorSubject<CustomLayer[]>([]);
  
  // Configuración de widgets
  private widgets = new BehaviorSubject<NetworkWidgetConfig[]>([]);
  
  // Visibilidad de widgets específicos
  private widgetVisibility = new BehaviorSubject<Record<string, boolean>>({
    'search': true,
    'elements-panel': true,
    'mini-map': true,
    'layer-control': true
  });
  
  constructor(
    private logger: LoggerService,
    private layerService: LayerService
  ) {
    // Inicializar con todos los tipos de ElementType activos por defecto
    const defaultActiveElementTypes = new Set(Object.values(ElementType).filter(v => typeof v === 'number') as ElementType[]);
    this.updateActiveLayers(defaultActiveElementTypes);
    
    // Suscribirse a la lista de CustomLayers de LayerService
    this.layerService.getLayersAsObservable().pipe(
      takeUntil(this.destroy$)
    ).subscribe(customLayersFromService => {
      this.updateCustomLayersList(customLayersFromService);
    });

    this.logger.debug('NetworkStateService inicializado');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
   * Actualiza la lista de capas personalizadas disponibles en el estado.
   * Esta lista proviene de LayerService.
   */
  private updateCustomLayersList(customLayers: CustomLayer[]): void {
    const currentState = this.getCurrentState();
    // Validar que las capas activas actualmente sigan existiendo en la nueva lista
    const validActiveCustomLayers = new Set<string>();
    currentState.activeCustomLayers.forEach(activeId => {
      if (customLayers.some(cl => cl.id === activeId)) {
        validActiveCustomLayers.add(activeId);
      }
    });

    this.stateSubject.next({
      ...currentState,
      customLayers: customLayers,
      activeCustomLayers: validActiveCustomLayers // Mantener solo las activas que aún existen
    });
    this.logger.debug('NetworkStateService: Lista de CustomLayers actualizada desde LayerService.', customLayers.length);
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
    this.isDirtySubject.next(this.getCurrentState().hasUnsavedChanges);
    this.logger.debug(`NetworkStateService: modo oscuro ${isDarkMode ? 'activado' : 'desactivado'}`);
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
    this.isDirtySubject.next(hasUnsavedChanges);
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
    // Asegurar que solo IDs de capas existentes estén en activeCustomLayers
    const validActiveCustomLayers = new Set<string>();
    activeCustomLayers.forEach(id => {
        if (currentState.customLayers.some(cl => cl.id === id)) {
            validActiveCustomLayers.add(id);
        }
    });
    this.stateSubject.next({ ...currentState, activeCustomLayers: validActiveCustomLayers });
    this.logger.debug('NetworkStateService: ActiveCustomLayers actualizado.', Array.from(validActiveCustomLayers));
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
    this.selectedConnection.next(connection);
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
    this.logger.debug(`Capa ${ElementType[type]} alternada. Estado: ${activeLayers.has(type)}`);
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
    this.editingElement.next(element);
  }

  /**
   * Obtiene el elemento en edición
   */
  getEditingElement(): Observable<NetworkElement | null> {
    return this.editingElement.asObservable();
  }

  /**
   * Establece la visibilidad del mapa
   */
  setMapVisibility(visible: boolean): void {
    this.mapVisible.next(visible);
  }

  /**
   * Obtiene la visibilidad del mapa
   */
  getMapVisibility(): Observable<boolean> {
    return this.mapVisible.asObservable();
  }

  /**
   * Establece si hay cambios sin guardar
   */
  setIsDirty(isDirty: boolean): void {
    this.updateUnsavedChanges(isDirty);
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
    return this.isDirtySubject.getValue();
  }

  /**
   * Establece el modo de vista actual
   */
  setCurrentViewMode(mode: ViewMode): void {
    this.currentViewModeSubject.next(mode);
  }

  /**
   * Obtiene el modo de vista actual
   */
  getCurrentViewMode(): Observable<ViewMode> {
    return this.currentViewModeSubject.asObservable();
  }

  /**
   * Muestra un mensaje de notificación
   */
  showSnackbar(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.logger.info(`[Snackbar] ${message} (${type})`);
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
    this.logger.debug(`Panel de elementos: ${show ? 'visible' : 'oculto'}`);
  }

  /**
   * Obtiene la visibilidad del panel de elementos como un Observable
   */
  getShowElementsPanel(): Observable<boolean> {
    return this.showElementsPanel;
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
  setSelectedPosition(position: GeoPosition): void {
    this.selectedPositionSubject.next(position);
    this.logger.debug(`Posición seleccionada: [${position.lat}, ${position.lng}]`);
  }

  /**
   * Obtiene la posición seleccionada
   */
  getSelectedPosition(): Observable<GeoPosition | null> {
    return this.selectedPositionSubject.asObservable();
  }

  /**
   * Restablece el estado global a los valores iniciales
   */
  resetState(): void {
    this.stateSubject.next(this.initialState);
    this.layerService.getLayersAsObservable().pipe(takeUntil(this.destroy$)).subscribe(customLayersFromService => {
      this.updateCustomLayersList(customLayersFromService);
    });
    this.logger.debug('NetworkStateService: estado restablecido a valores iniciales');
  }

  /**
   * Establece el centro del mapa
   */
  setMapCenter(center: GeoPosition): void {
    this.mapCenter.next(center);
  }

  /**
   * Obtiene el centro del mapa como Observable
   */
  getMapCenterAsObservable(): Observable<GeoPosition> {
    return this.mapCenter.asObservable();
  }

  /**
   * Establece el nivel de zoom del mapa
   */
  setMapZoom(zoom: number): void {
    this.mapZoom.next(zoom);
  }

  /**
   * Obtiene el nivel de zoom del mapa como Observable
   */
  getMapZoomAsObservable(): Observable<number> {
    return this.mapZoom.asObservable();
  }

  /**
   * Centra el mapa en un elemento específico
   */
  centerMapOnElement(element: NetworkElement): void {
    if (element && element.position) {
      this.setMapCenter(element.position);
      this.setMapZoom(18); // Zoom cercano para ver el elemento con detalle
    }
  }

  /**
   * Restablece la visualización del mapa a los valores iniciales
   */
  resetMapView(): void {
    this.setMapCenter(createGeographicPosition(18.735693, -70.162651));
    this.setMapZoom(7);
  }

  /**
   * Obtiene el modo de vista del mapa
   * @returns Observable con el modo de vista
   */
  getMapViewMode(): Observable<MapViewMode> {
    return this.mapViewMode.asObservable();
  }
  
  /**
   * Establece el modo de vista del mapa
   * @param mode Modo de vista
   */
  setMapViewMode(mode: MapViewMode): void {
    this.mapViewMode.next(mode);
  }
  
  /**
   * Obtiene el modo de edición de elementos
   * @returns Observable con el modo de edición
   */
  getElementEditMode(): Observable<ElementEditMode> {
    return this.elementEditMode.asObservable();
  }
  
  /**
   * Establece el modo de edición de elementos
   * @param mode Modo de edición
   */
  setElementEditMode(mode: ElementEditMode): void {
    this.elementEditMode.next(mode);
  }
  
  /**
   * Obtiene la conexión seleccionada
   * @returns Observable con la conexión seleccionada o null
   */
  getSelectedConnection(): Observable<NetworkConnection | null> {
    return this.selectedConnection.asObservable();
  }
  
  /**
   * Obtiene las capas visibles
   * @returns Observable con las capas visibles
   */
  getVisibleLayers(): Observable<CustomLayer[]> {
    return this.visibleLayers.asObservable();
  }
  
  /**
   * Establece las capas visibles
   * @param layers Capas visibles
   */
  setVisibleLayers(layers: CustomLayer[]): void {
    this.visibleLayers.next(layers);
  }
  
  /**
   * Obtiene la configuración de widgets
   * @returns Observable con la configuración de widgets
   */
  getWidgets(): Observable<NetworkWidgetConfig[]> {
    return this.widgets.asObservable();
  }
  
  /**
   * Establece la configuración de widgets
   * @param widgetConfigs Configuración de widgets
   */
  setWidgets(widgetConfigs: NetworkWidgetConfig[]): void {
    this.widgets.next(widgetConfigs);
  }
  
  /**
   * Actualiza la visibilidad de un widget específico
   * @param widgetId ID del widget
   * @param visible Estado de visibilidad
   */
  updateWidgetVisibility(widgetId: string, visible: boolean): void {
    const currentVisibility = this.widgetVisibility.getValue();
    this.widgetVisibility.next({
      ...currentVisibility,
      [widgetId]: visible
    });
  }
  
  /**
   * Obtiene el estado de visibilidad de los widgets
   * @returns Observable con el estado de visibilidad
   */
  getWidgetVisibility(): Observable<Record<string, boolean>> {
    return this.widgetVisibility.asObservable();
  }
}
