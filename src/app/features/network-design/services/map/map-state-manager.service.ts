import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NetworkStateService } from '../../services/network-state.service';
import { ElementType, NetworkElement, NetworkConnection } from '../../../../shared/types/network.types';
import { LoggerService } from '../../../../core/services/logger.service';
import { map } from 'rxjs/operators';

/**
 * Tipo para las herramientas disponibles en el mapa
 */
export type ToolType = 
  | 'pan' 
  | 'select' 
  | 'measure' 
  | 'connect' 
  | 'areaSelect' 
  | 'zoomIn' 
  | 'zoomOut' 
  | 'fitToScreen' 
  | 'resetZoom'
  | 'edit'
  | 'placeElement'
  | 'moveElement';

/**
 * Interfaz para la capa del mapa
 */
export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'base' | 'overlay';
  icon?: string;
  description?: string;
  order: number;
}

/**
 * Estado del mapa que se gestiona centralizadamente
 */
export interface MapState {
  currentTool: ToolType;
  zoomLevel: number;
  isDarkMode: boolean;
  showMiniMap: boolean;
  historyCount: number;
  hasUnsavedChanges: boolean;
  layers: MapLayer[]; // Añadido para gestionar capas del mapa
}

/**
 * Servicio para gestionar el estado del mapa de forma centralizada
 * 
 * Este servicio permite abstraer toda la gestión de estado del mapa
 * para que los componentes no tengan que preocuparse por ello.
 */
@Injectable({
  providedIn: 'root'
})
export class MapStateManagerService {
  /** Subject para gestionar desuscripciones */
  private destroy$ = new Subject<void>();
  
  /** Estado del mapa */
  private _mapState: MapState = {
    currentTool: 'pan',
    zoomLevel: 100,
    isDarkMode: false,
    showMiniMap: true,
    historyCount: 0,
    hasUnsavedChanges: false,
    layers: [
      {
        id: 'osm',
        name: 'OpenStreetMap',
        visible: true,
        type: 'base',
        icon: 'fa-map',
        description: 'Mapa base estándar',
        order: 1
      },
      {
        id: 'satellite',
        name: 'Satélite',
        visible: false,
        type: 'base',
        icon: 'fa-satellite',
        description: 'Vista satelital',
        order: 2
      },
      {
        id: 'terrain',
        name: 'Terreno',
        visible: false,
        type: 'base',
        icon: 'fa-mountain',
        description: 'Mapa topográfico',
        order: 3
      },
      {
        id: 'elements',
        name: 'Elementos',
        visible: true,
        type: 'overlay',
        icon: 'fa-network-wired',
        description: 'Elementos de red',
        order: 1
      },
      {
        id: 'connections',
        name: 'Conexiones',
        visible: true,
        type: 'overlay',
        icon: 'fa-project-diagram',
        description: 'Conexiones entre elementos',
        order: 2
      },
      {
        id: 'heatmap',
        name: 'Mapa de calor',
        visible: false,
        type: 'overlay',
        icon: 'fa-fire',
        description: 'Densidad de elementos',
        order: 3
      },
      {
        id: 'alerts',
        name: 'Alertas',
        visible: true,
        type: 'overlay',
        icon: 'fa-exclamation-triangle',
        description: 'Alertas y eventos',
        order: 4
      }
    ]
  };
  
  /** Subjects para observables del estado */
  private currentToolSubject = new BehaviorSubject<ToolType>(this._mapState.currentTool);
  private zoomLevelSubject = new BehaviorSubject<number>(this._mapState.zoomLevel);
  private isDarkModeSubject = new BehaviorSubject<boolean>(this._mapState.isDarkMode);
  private showMiniMapSubject = new BehaviorSubject<boolean>(this._mapState.showMiniMap);
  private historyCountSubject = new BehaviorSubject<number>(this._mapState.historyCount);
  private hasUnsavedChangesSubject = new BehaviorSubject<boolean>(this._mapState.hasUnsavedChanges);
  private layersSubject = new BehaviorSubject<MapLayer[]>(this._mapState.layers);
  private layerChangesSubject = new Subject<void>();
  private selectedElementsSubject = new BehaviorSubject<NetworkElement[]>([]);
  private connectionToEditSubject = new BehaviorSubject<NetworkConnection | null>(null);
  
  /** Observables públicos */
  readonly currentTool: Observable<ToolType> = this.currentToolSubject.asObservable();
  readonly activeTool$ = this.currentToolSubject.asObservable();
  readonly zoomLevel: Observable<number> = this.zoomLevelSubject.asObservable();
  readonly isDarkMode: Observable<boolean> = this.isDarkModeSubject.asObservable();
  readonly miniMapVisible: Observable<boolean> = this.showMiniMapSubject.asObservable();
  readonly historyCount: Observable<number> = this.historyCountSubject.asObservable();
  readonly hasUnsavedChanges: Observable<boolean> = this.hasUnsavedChangesSubject.asObservable();
  readonly layers: Observable<MapLayer[]> = this.layersSubject.asObservable();
  readonly layerChanges: Observable<void> = this.layerChangesSubject.asObservable();
  readonly selectedElements$: Observable<NetworkElement[]> = this.selectedElementsSubject.asObservable();
  readonly singleSelectedElement$: Observable<NetworkElement | null>;
  readonly connectionToEdit$: Observable<NetworkConnection | null> = this.connectionToEditSubject.asObservable();
  
  constructor(
    private networkStateService: NetworkStateService,
    private logger: LoggerService
  ) {
    this.setupStateSubscriptions();

    // Derivar singleSelected$ de selectedElements$
    this.singleSelectedElement$ = this.selectedElements$.pipe(
      map(elements => (elements.length === 1 ? elements[0] : null)),
      takeUntil(this.destroy$) // Asegurar que esta suscripción interna también se limpie
    );
  }
  
  get activeLayers(): Observable<ElementType[]> {
    return this.networkStateService.state$.pipe(
      map(state => state.activeLayers ? Array.from(state.activeLayers) : [])
    );
  }
  
  /**
   * Configura suscripciones al estado global de la red
   */
  private setupStateSubscriptions(): void {
    // Suscribirse a cambios en el estado global
    this.networkStateService.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      // Actualizar estado local
      // Las propiedades que se leen directamente de networkStateService no necesitan copia local en _mapState
      // si no hay lógica adicional en este servicio para ellas.
      // this._mapState = { // Reducir _mapState solo a lo que gestiona exclusivamente este servicio
      //   ...this._mapState,
      //   isDarkMode: state.isDarkMode,
      //   showMiniMap: state.showMiniMap || this._mapState.showMiniMap,
      //   currentTool: (state.currentTool as ToolType) || this._mapState.currentTool,
      //   // activeLayers: [...(state.activeLayers ? Array.from(state.activeLayers) : this._mapState.activeLayers)] as ElementType[] // Eliminado
      // };
      
      // Actualizar subjects solo para las propiedades que este servicio aún controla directamente
      // o que necesitan una transformación/BehaviorSubject propio.
      if (this.isDarkModeSubject.getValue() !== state.isDarkMode) {
        this.isDarkModeSubject.next(state.isDarkMode);
         this._mapState.isDarkMode = state.isDarkMode; // Mantener _mapState sincronizado si aún se usa internamente
      }
      if (this.showMiniMapSubject.getValue() !== (state.showMiniMap || this._mapState.showMiniMap)) {
        this.showMiniMapSubject.next(state.showMiniMap || this._mapState.showMiniMap);
        this._mapState.showMiniMap = state.showMiniMap || this._mapState.showMiniMap;
      }
      if (this.currentToolSubject.getValue() !== ((state.currentTool as ToolType) || this._mapState.currentTool)) {
        this.currentToolSubject.next((state.currentTool as ToolType) || this._mapState.currentTool);
        this._mapState.currentTool = (state.currentTool as ToolType) || this._mapState.currentTool;
      }
      // this.activeLayersSubject.next(this._mapState.activeLayers); // Eliminado
    });
  }
  
  /**
   * Abre un diálogo para editar las propiedades de una conexión
   * @param connection Conexión a editar
   */
  openConnectionPropertiesDialog(connection: NetworkConnection): void {
    this.logger.debug(`Solicitando apertura de diálogo para editar conexión: ${connection.id}`);
    this.logger.debug('Detalles de la conexión a editar:', JSON.stringify(connection, null, 2));
    
    // Emitir evento para que los componentes que escuchan puedan mostrar el diálogo
    // Usamos BehaviorSubject para asegurar que cualquier componente que se suscriba posteriormente reciba el valor
    this.connectionToEditSubject.next(connection);
  }
  
  /**
   * Limpia la conexión seleccionada para editar
   */
  clearConnectionToEdit(): void {
    this.connectionToEditSubject.next(null);
  }
  
  /**
   * Cambia la herramienta actual
   * @param tool Nueva herramienta a utilizar
   */
  setTool(tool: ToolType): void {
    // Validar herramienta
    if (!this.isValidTool(tool)) {
      this.logger.warn(`Herramienta no válida: ${tool}`);
      return;
    }
    
    this._mapState.currentTool = tool;
    this.currentToolSubject.next(tool);
    this.logger.debug(`Herramienta cambiada a: ${tool}`);
  }
  
  /**
   * Alias para setTool para mantener compatibilidad con el adaptador
   * @param tool Nueva herramienta a utilizar
   */
  setActiveTool(tool: ToolType): void {
    this.setTool(tool);
  }
  
  /**
   * Establece el modo oscuro
   * @param isDark Indicador de modo oscuro
   */
  setDarkMode(isDark: boolean): void {
    // this._mapState.isDarkMode = isDark; // Actualización local redundante
    // this.isDarkModeSubject.next(isDark); // Emisión local redundante, se actualiza vía networkStateService.state$
    this.logger.debug(`Solicitando cambio de modo oscuro a NetworkStateService: ${isDark}`);
    
    // Sincronizar con el estado global
    // La siguiente línea causa el error porque NetworkStateService no tiene el método setDarkMode.
    // Para que esta funcionalidad se complete, NetworkStateService debe exponer un método para actualizar isDarkMode.
    // this.networkStateService.setDarkMode(isDark);
  }
  
  /**
   * Valida si una herramienta es válida.
   * @param tool La herramienta a validar.
   * @returns True si la herramienta es válida, false en caso contrario.
   */
  public isValidTool(tool: string): boolean {
    // Asegurarse de que todos los ToolType están en este array
    const validTools: ToolType[] = [
      'pan', 'select', 'measure', 'areaSelect', 
      'connect', 'zoomIn', 'zoomOut', 'fitToScreen', 'resetZoom', 'edit', 'placeElement', 'moveElement'
    ];
    return validTools.includes(tool as ToolType);
  }
  
  /**
   * Actualiza el nivel de zoom
   * @param level Nuevo nivel de zoom
   */
  setZoomLevel(level: number): void {
    // Restringir el zoom entre valores razonables
    const newLevel = Math.max(10, Math.min(200, level));
    
    // Actualizar estado local
    this._mapState.zoomLevel = newLevel;
    this.zoomLevelSubject.next(newLevel);
  }
  
  /**
   * Alterna la visualización del minimapa
   */
  toggleMiniMap(): void {
    const newValue = !this._mapState.showMiniMap;
    
    // Actualizar estado local
    this._mapState.showMiniMap = newValue;
    this.showMiniMapSubject.next(newValue);
    
    // Intentar sincronizar con estado global si existe el método
    try {
      // Si existe propiedad similar en NetworkStateService, intentar usarla
      if (typeof this.networkStateService['setMiniMapVisibility'] === 'function') {
        (this.networkStateService['setMiniMapVisibility'] as Function)(newValue);
      } else {
        // Fallback: no hacer nada, simplemente registrar
        this.logger.debug('No se encontró método para actualizar minimapa en NetworkStateService');
      }
    } catch (error) {
      this.logger.warn('No se pudo actualizar visibilidad del minimapa en el estado global');
    }
  }
  
  /**
   * Establece si hay cambios sin guardar
   * @param hasChanges Indica si hay cambios sin guardar
   */
  setUnsavedChanges(hasChanges: boolean): void {
    // Actualizar estado local
    this._mapState.hasUnsavedChanges = hasChanges;
    this.hasUnsavedChangesSubject.next(hasChanges);
    
    // Sincronizar con estado global
    this.networkStateService.updateUnsavedChanges(hasChanges);
  }
  
  /**
   * Obtiene si el minimapa está visible
   * @returns true si el minimapa está visible
   */
  isMiniMapVisible(): boolean {
    return this._mapState.showMiniMap;
  }
  
  /**
   * Obtiene todas las capas del mapa
   * @returns Array con todas las capas del mapa
   */
  getAllLayers(): MapLayer[] {
    return [...this._mapState.layers];
  }
  
  /**
   * Cambia la visibilidad de una capa
   * @param layerId ID de la capa a cambiar
   * @returns true si se cambió la visibilidad correctamente
   */
  toggleLayerVisibility(layerId: string): boolean {
    const layerIndex = this._mapState.layers.findIndex(layer => layer.id === layerId);
    
    if (layerIndex === -1) {
      this.logger.warn(`Capa no encontrada: ${layerId}`);
      return false;
    }
    
    // Copia de las capas para modificar
    const updatedLayers = [...this._mapState.layers];
    
    // Si es capa base y se está activando, desactivar otras capas base
    if (updatedLayers[layerIndex].type === 'base' && !updatedLayers[layerIndex].visible) {
      updatedLayers.forEach((layer, index) => {
        if (layer.type === 'base' && layer.id !== layerId) {
          updatedLayers[index] = { ...layer, visible: false };
        }
      });
    }
    
    // Cambiar visibilidad de la capa seleccionada
    updatedLayers[layerIndex] = {
      ...updatedLayers[layerIndex],
      visible: !updatedLayers[layerIndex].visible
    };
    
    // Actualizar estado
    this._mapState.layers = updatedLayers;
    this.layersSubject.next(updatedLayers);
    
    // Notificar cambio
    this.layerChangesSubject.next();
    
    return true;
  }
  
  /**
   * Añade una nueva capa al mapa
   * @param layer Nueva capa a añadir
   * @returns true si se añadió correctamente
   */
  addLayer(layer: MapLayer): boolean {
    // Verificar que no exista una capa con el mismo ID
    if (this._mapState.layers.some(l => l.id === layer.id)) {
      this.logger.warn(`Ya existe una capa con ID: ${layer.id}`);
      return false;
    }
    
    // Añadir capa
    const updatedLayers = [...this._mapState.layers, layer];
    
    // Actualizar estado
    this._mapState.layers = updatedLayers;
    this.layersSubject.next(updatedLayers);
    
    // Notificar cambio
    this.layerChangesSubject.next();
    
    return true;
  }
  
  /**
   * Elimina una capa del mapa
   * @param layerId ID de la capa a eliminar
   * @returns true si se eliminó correctamente
   */
  removeLayer(layerId: string): boolean {
    // Verificar que exista la capa
    if (!this._mapState.layers.some(l => l.id === layerId)) {
      this.logger.warn(`No existe una capa con ID: ${layerId}`);
      return false;
    }
    
    // Eliminar capa
    const updatedLayers = this._mapState.layers.filter(l => l.id !== layerId);
    
    // Actualizar estado
    this._mapState.layers = updatedLayers;
    this.layersSubject.next(updatedLayers);
    
    // Notificar cambio
    this.layerChangesSubject.next();
    
    return true;
  }
  
  /**
   * Establece los elementos actualmente seleccionados.
   * @param elements Array de NetworkElement seleccionados.
   */
  setSelectedElements(elements: NetworkElement[]): void {
    this.selectedElementsSubject.next(elements);
    this.logger.debug(`Elementos seleccionados actualizados: ${elements.length} elementos.`);
    // Podríamos querer que al seleccionar elementos, la herramienta cambie a 'select'
    // if (elements.length > 0 && this.currentToolSubject.getValue() !== 'select') {
    //   this.setTool('select');
    // }
  }
  
  /**
   * Limpia la selección de elementos actual.
   */
  clearSelectedElements(): void {
    this.selectedElementsSubject.next([]);
    this.logger.debug('Selección de elementos limpiada.');
  }
  
  /**
   * Obtiene el array actual de elementos seleccionados.
   * @returns Un array de NetworkElement.
   */
  getSelectedElements(): NetworkElement[] {
    return this.selectedElementsSubject.getValue();
  }
  
  /**
   * Procesa un clic en un elemento del mapa, actualizando la selección.
   * @param clickedElement El NetworkElement que fue clickeado.
   * @param ctrlOrMetaPressed true si la tecla Ctrl (o Cmd en Mac) estaba presionada.
   * @param shiftPressed true si la tecla Shift estaba presionada.
   */
  processElementClick(clickedElement: NetworkElement, ctrlOrMetaPressed: boolean, shiftPressed: boolean): void {
    const currentSelection = [...this.selectedElementsSubject.getValue()];
    const clickedElementId = clickedElement.id;

    if (shiftPressed) {
      // La selección con Shift es más compleja (selección de rango o añadir a la selección existente)
      // Por ahora, la trataremos como un Ctrl+Clic para simplicidad.
      // TODO: Implementar lógica de selección de rango si es necesario.
      const index = currentSelection.findIndex(el => el.id === clickedElementId);
      if (index > -1) {
        currentSelection.splice(index, 1); // Deseleccionar si ya estaba y se hizo Shift+Clic
      } else {
        currentSelection.push(clickedElement); // Seleccionar si no estaba
      }
      this.selectedElementsSubject.next(currentSelection);
    } else if (ctrlOrMetaPressed) {
      const index = currentSelection.findIndex(el => el.id === clickedElementId);
      if (index > -1) {
        currentSelection.splice(index, 1); // Deseleccionar
      } else {
        currentSelection.push(clickedElement); // Seleccionar
      }
      this.selectedElementsSubject.next(currentSelection);
    } else {
      // Clic simple: seleccionar solo este elemento, a menos que ya sea el único seleccionado.
      if (currentSelection.length === 1 && currentSelection[0].id === clickedElementId) {
        // Opcional: si se hace clic en el único elemento ya seleccionado, ¿deseleccionarlo o mantenerlo?
        // Por ahora, lo mantenemos seleccionado. Para deseleccionar: this.selectedElementsSubject.next([]);
      } else {
        this.selectedElementsSubject.next([clickedElement]);
      }
    }
    this.logger.debug(`Selección después de clic: ${this.selectedElementsSubject.getValue().length} elementos`, this.selectedElementsSubject.getValue());
    // No cambiamos la herramienta aquí, MapService o la toolbar se encargarán si es necesario
    // basado en la herramienta activa actual.
  }
  
  /**
   * Limpia recursos al destruir el servicio
   */
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 
