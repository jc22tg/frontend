import { Injectable, Signal, computed, effect, signal } from '@angular/core';
import { NetworkElement, NetworkConnection, ElementType } from '../../../shared/types/network.types';
import { NetworkStateService } from './network-state.service';
import { ElementService } from './element.service';
import { ConnectionService } from './connection.service';
import { Observable, combineLatest, map, of, BehaviorSubject } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Interfaz para el estado del mapa
 */
export interface MapState {
  elements: NetworkElement[];
  connections: NetworkConnection[];
  selectedElement: NetworkElement | null;
  selectedConnection: NetworkConnection | null;
  visibleElementTypes: Set<ElementType>;
  visibleCustomLayers: Set<string>;
  filteredElements: NetworkElement[];
  filteredConnections: NetworkConnection[];
  zoomLevel: number;
  viewportBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null;
  isDarkMode: boolean;
  currentTool: string;
  loading: boolean;
  searchQuery: string;
  statistics: {
    totalElements: number;
    visibleElements: number;
    totalConnections: number;
    visibleConnections: number;
  };
}

/**
 * Servicio para gestionar el estado del mapa de red utilizando signals
 * Centraliza la gestión de estado y proporciona una API reactiva
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkMapStateService {
  // Estado principal del mapa con signals
  private _elements = signal<NetworkElement[]>([]);
  private _connections = signal<NetworkConnection[]>([]);
  private _selectedElement = signal<NetworkElement | null>(null);
  private _selectedConnection = signal<NetworkConnection | null>(null);
  private _visibleElementTypes = signal<Set<ElementType>>(new Set(Object.values(ElementType)));
  private _visibleCustomLayers = signal<Set<string>>(new Set());
  private _zoomLevel = signal<number>(100);
  private _viewportBounds = signal<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null>(null);
  private _isDarkMode = signal<boolean>(false);
  private _currentTool = signal<string>('pan');
  private _loading = signal<boolean>(false);
  private _searchQuery = signal<string>('');

  // BehaviorSubjects para comunicación vía observables
  private selectedElementSubject = new BehaviorSubject<NetworkElement | null>(null);
  public selectedElement$ = this.selectedElementSubject.asObservable();
  
  private selectedConnectionSubject = new BehaviorSubject<NetworkConnection | null>(null);
  public selectedConnection$ = this.selectedConnectionSubject.asObservable();
  
  private elementsCountSubject = new BehaviorSubject<number>(0);
  public elementsCount$ = this.elementsCountSubject.asObservable();

  // Signals computadas
  public readonly filteredElements: Signal<NetworkElement[]> = computed(() => {
    const elements = this._elements();
    const visibleTypes = this._visibleElementTypes();
    const searchTerm = this._searchQuery().toLowerCase();
    
    return elements.filter(element => {
      // Filtrar por tipo visible
      if (!visibleTypes.has(element.type)) {
        return false;
      }
      
      // Filtrar por búsqueda
      if (searchTerm && !(
        element.name?.toLowerCase().includes(searchTerm) ||
        element.id.toLowerCase().includes(searchTerm) ||
        element.description?.toLowerCase().includes(searchTerm)
      )) {
        return false;
      }
      
      return true;
    });
  });
  
  public readonly filteredConnections: Signal<NetworkConnection[]> = computed(() => {
    const connections = this._connections();
    const visibleElements = new Set(this.filteredElements().map(e => e.id));
    
    return connections.filter(connection => 
      visibleElements.has(connection.sourceId) && 
      visibleElements.has(connection.targetId)
    );
  });
  
  public readonly statistics: Signal<{
    totalElements: number;
    visibleElements: number;
    totalConnections: number;
    visibleConnections: number;
  }> = computed(() => {
    return {
      totalElements: this._elements().length,
      visibleElements: this.filteredElements().length,
      totalConnections: this._connections().length,
      visibleConnections: this.filteredConnections().length
    };
  });

  // Getters públicos para los signals
  public get elements(): Signal<NetworkElement[]> { return this._elements.asReadonly(); }
  public get connections(): Signal<NetworkConnection[]> { return this._connections.asReadonly(); }
  public get selectedElement(): Signal<NetworkElement | null> { return this._selectedElement.asReadonly(); }
  public get selectedConnection(): Signal<NetworkConnection | null> { return this._selectedConnection.asReadonly(); }
  public get visibleElementTypes(): Signal<Set<ElementType>> { return this._visibleElementTypes.asReadonly(); }
  public get visibleCustomLayers(): Signal<Set<string>> { return this._visibleCustomLayers.asReadonly(); }
  public get zoomLevel(): Signal<number> { return this._zoomLevel.asReadonly(); }
  public get viewportBounds(): Signal<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null> { return this._viewportBounds.asReadonly(); }
  public get isDarkMode(): Signal<boolean> { return this._isDarkMode.asReadonly(); }
  public get currentTool(): Signal<string> { return this._currentTool.asReadonly(); }
  public get loading(): Signal<boolean> { return this._loading.asReadonly(); }
  public get searchQuery(): Signal<string> { return this._searchQuery.asReadonly(); }

  // Observable público para suscribirse a cambios de estado
  public readonly state$ = new BehaviorSubject<{
    loading: boolean;
    isDarkMode: boolean;
    currentTool: string;
    visibleElementTypes: Set<ElementType>;
  }>({
    loading: false,
    isDarkMode: false,
    currentTool: 'pan',
    visibleElementTypes: new Set<ElementType>()
  });

  constructor(
    private networkStateService: NetworkStateService,
    private elementService: ElementService,
    private connectionService: ConnectionService,
    private logger: LoggerService
  ) {
    // Inicializar el estado
    this.initializeState();
    
    // Configurar efectos para sincronizar con otros servicios
    effect(() => {
      // Sincronizar modo oscuro con el estado global
      this.networkStateService.updateDarkMode(this._isDarkMode());
    });
    
    effect(() => {
      // Sincronizar herramienta actual con el estado global
      this.networkStateService.updateCurrentTool(this._currentTool());
    });
    
    effect(() => {
      // Sincronizar tipos de elementos visibles con capas activas
      const elementTypes = Array.from(this._visibleElementTypes());
      this.networkStateService.updateActiveLayers(new Set(elementTypes));
    });
    
    // Actualizar conteo de elementos cuando cambia la lista filtrada
    effect(() => {
      const filteredCount = this.filteredElements().length;
      this.elementsCountSubject.next(filteredCount);
    });
  }
  
  /**
   * Inicializa el estado con datos del backend
   */
  private initializeState(): void {
    this._loading.set(true);
    
    // Actualizar el estado observable
    this.updateState();
    
    // Cargar elementos
    this.elementService.getAllElements().subscribe({
      next: (elements) => {
        this._elements.set(elements);
        this.logger.debug(`Cargados ${elements.length} elementos`);
      },
      error: (err) => {
        this.logger.error('Error al cargar elementos:', err);
        this._elements.set([]);
      }
    });
    
    // Cargar conexiones
    this.connectionService.getConnections().subscribe({
      next: (connections) => {
        this._connections.set(connections);
        this.logger.debug(`Cargadas ${connections.length} conexiones`);
      },
      error: (err) => {
        this.logger.error('Error al cargar conexiones:', err);
        this._connections.set([]);
      },
      complete: () => {
        this._loading.set(false);
        // Actualizar el estado observable
        this.updateState();
      }
    });
    
    // Sincronizar con el estado global
    this.networkStateService.state$.subscribe(state => {
      this._isDarkMode.set(state.isDarkMode);
      this._currentTool.set(state.currentTool);
      
      // Actualizar tipos de elementos visibles desde capas activas
      if (state.activeLayers instanceof Set) {
        this._visibleElementTypes.set(state.activeLayers);
      } else {
        const visibleTypes = new Set<ElementType>(state.activeLayers);
        this._visibleElementTypes.set(visibleTypes);
      }
      
      // Actualizar el estado observable
      this.updateState();
    });
    
    // Configurar efectos para actualizar el estado observable
    effect(() => {
      this.updateState();
    });
  }
  
  /**
   * Actualiza el estado observable
   */
  private updateState(): void {
    this.state$.next({
      loading: this._loading(),
      isDarkMode: this._isDarkMode(),
      currentTool: this._currentTool(),
      visibleElementTypes: this._visibleElementTypes()
    });
  }
  
  /**
   * Selecciona un elemento en el mapa
   */
  selectElement(element: NetworkElement | null): void {
    this._selectedElement.set(element);
    this.selectedElementSubject.next(element);
    
    // Si seleccionamos un elemento, deseleccionar conexión
    if (element) {
      this._selectedConnection.set(null);
      this.selectedConnectionSubject.next(null);
    }
  }
  
  /**
   * Selecciona una conexión en el mapa
   */
  selectConnection(connection: NetworkConnection | null): void {
    this._selectedConnection.set(connection);
    this.selectedConnectionSubject.next(connection);
    
    // Si seleccionamos una conexión, deseleccionar elemento
    if (connection) {
      this._selectedElement.set(null);
      this.selectedElementSubject.next(null);
    }
  }
  
  /**
   * Actualiza el nivel de zoom
   */
  updateZoomLevel(level: number): void {
    this._zoomLevel.set(level);
  }
  
  /**
   * Actualiza los límites visibles del viewport
   */
  updateViewportBounds(bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null): void {
    this._viewportBounds.set(bounds);
  }
  
  /**
   * Cambia la herramienta actual
   */
  setCurrentTool(tool: string): void {
    this._currentTool.set(tool);
  }
  
  /**
   * Cambia la visibilidad de un tipo de elemento
   */
  toggleElementType(type: ElementType): void {
    this._visibleElementTypes.update(types => {
      const newTypes = new Set(types);
      if (newTypes.has(type)) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }
      return newTypes;
    });
  }
  
  /**
   * Cambia la visibilidad de una capa personalizada
   */
  toggleCustomLayer(layerId: string): void {
    this._visibleCustomLayers.update(layers => {
      const newLayers = new Set(layers);
      if (newLayers.has(layerId)) {
        newLayers.delete(layerId);
      } else {
        newLayers.add(layerId);
      }
      return newLayers;
    });
  }
  
  /**
   * Actualiza la consulta de búsqueda
   */
  updateSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }
  
  /**
   * Cambia el modo oscuro
   */
  toggleDarkMode(): void {
    this._isDarkMode.update(current => !current);
  }
  
  /**
   * Agrega un nuevo elemento al mapa
   */
  addElement(element: NetworkElement): void {
    this._elements.update(elements => [...elements, element]);
  }
  
  /**
   * Actualiza un elemento existente
   */
  updateElement(updatedElement: NetworkElement): void {
    this._elements.update(elements => 
      elements.map(element => 
        element.id === updatedElement.id ? updatedElement : element
      )
    );
    
    // Si el elemento seleccionado es el que se actualizó, actualizar la selección
    if (this._selectedElement()?.id === updatedElement.id) {
      this._selectedElement.set(updatedElement);
    }
  }
  
  /**
   * Elimina un elemento
   */
  removeElement(elementId: string): void {
    this._elements.update(elements => 
      elements.filter(element => element.id !== elementId)
    );
    
    // Si el elemento seleccionado es el que se eliminó, limpiar la selección
    if (this._selectedElement()?.id === elementId) {
      this._selectedElement.set(null);
    }
    
    // Eliminar conexiones asociadas
    this._connections.update(connections => 
      connections.filter(connection => 
        connection.sourceId !== elementId && connection.targetId !== elementId
      )
    );
  }
  
  /**
   * Agrega una nueva conexión
   */
  addConnection(connection: NetworkConnection): void {
    this._connections.update(connections => [...connections, connection]);
  }
  
  /**
   * Actualiza una conexión existente
   */
  updateConnection(updatedConnection: NetworkConnection): void {
    this._connections.update(connections => 
      connections.map(connection => 
        connection.id === updatedConnection.id ? updatedConnection : connection
      )
    );
    
    // Si la conexión seleccionada es la que se actualizó, actualizar la selección
    if (this._selectedConnection()?.id === updatedConnection.id) {
      this._selectedConnection.set(updatedConnection);
    }
  }
  
  /**
   * Elimina una conexión
   */
  removeConnection(connectionId: string): void {
    this._connections.update(connections => 
      connections.filter(connection => connection.id !== connectionId)
    );
    
    // Si la conexión seleccionada es la que se eliminó, limpiar la selección
    if (this._selectedConnection()?.id === connectionId) {
      this._selectedConnection.set(null);
    }
  }
  
  /**
   * Actualiza los tipos de elementos visibles
   */
  updateVisibleElementTypes(types: ElementType[]): void {
    this._visibleElementTypes.set(new Set(types));
    this.updateState();
  }
  
  /**
   * Refresca los datos del mapa desde el backend
   */
  refreshMapData(): Observable<boolean> {
    this._loading.set(true);
    this.updateState();
    
    // Obtener elementos y conexiones
    return new Observable<boolean>(observer => {
      combineLatest([
        this.elementService.getAllElements(),
        this.connectionService.getConnections()
      ]).subscribe({
        next: ([elements, connections]) => {
          this._elements.set(elements);
          this._connections.set(connections);
          this._loading.set(false);
          this.updateState();
          observer.next(true);
          observer.complete();
        },
        error: (err) => {
          this.logger.error('Error al cargar datos del mapa', err);
          this._loading.set(false);
          this.updateState();
          observer.error(err);
        }
      });
    });
  }
  
  /**
   * Obtiene los elementos visibles según los filtros actuales
   * @param limit Límite opcional de elementos a devolver
   * @returns Lista de elementos visibles
   */
  getVisibleElements(limit?: number): NetworkElement[] {
    const filtered = this.filteredElements();
    if (limit && limit > 0 && limit < filtered.length) {
      return filtered.slice(0, limit);
    }
    return filtered;
  }
  
  /**
   * Obtiene las conexiones visibles según los filtros actuales
   * @param limit Límite opcional de conexiones a devolver
   * @returns Lista de conexiones visibles
   */
  getVisibleConnections(limit?: number): NetworkConnection[] {
    const filtered = this.filteredConnections();
    if (limit && limit > 0 && limit < filtered.length) {
      return filtered.slice(0, limit);
    }
    return filtered;
  }
} 