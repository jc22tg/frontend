import { Injectable } from '@angular/core';
import { Observable, Subject, filter } from 'rxjs';
import { NetworkElement, NetworkConnection, ElementType } from '../../../shared/types/network.types';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Tipos de eventos que pueden ser emitidos en el bus de eventos de la red
 */
export enum NetworkEventType {
  // Eventos de estado
  STATE_CHANGED = 'state_changed',
  
  // Eventos de mapa
  MAP_READY = 'map_ready',
  MAP_ERROR = 'map_error',
  MAP_CLICKED = 'map_clicked',
  MAP_MOVED = 'map_moved',
  MAP_RESET = 'map_reset',
  MAP_UPDATED = 'map_updated',
  
  // Eventos de elementos
  ELEMENT_SELECTED = 'element_selected',
  ELEMENT_CREATED = 'element_created',
  ELEMENT_UPDATED = 'element_updated',
  ELEMENT_DELETED = 'element_deleted',
  
  // Eventos de conexiones
  CONNECTION_SELECTED = 'connection_selected',
  CONNECTION_CREATED = 'connection_created',
  CONNECTION_UPDATED = 'connection_updated',
  CONNECTION_DELETED = 'connection_deleted',
  
  // Eventos de capas
  LAYER_TOGGLED = 'layer_toggled',
  LAYER_CREATED = 'layer_created',
  LAYER_UPDATED = 'layer_updated',
  LAYER_DELETED = 'layer_deleted',
  
  // Eventos de herramientas
  TOOL_CHANGED = 'tool_changed',
  
  // Eventos de mediciones
  MEASUREMENT_STARTED = 'measurement_started',
  MEASUREMENT_UPDATED = 'measurement_updated',
  MEASUREMENT_COMPLETED = 'measurement_completed',
  MEASUREMENT_CANCELLED = 'measurement_cancelled',
  
  // Eventos de exportación
  EXPORT_STARTED = 'export_started',
  EXPORT_COMPLETED = 'export_completed',
  EXPORT_ERROR = 'export_error',
  
  // Eventos de guardado
  SAVE_STARTED = 'save_started',
  SAVE_COMPLETED = 'save_completed',
  SAVE_ERROR = 'save_error',
  
  // Eventos de visualización
  VIEW_MODE_CHANGED = 'view_mode_changed',
  CLUSTER_VIEW_TOGGLED = 'cluster_view_toggled',
  HEATMAP_TOGGLED = 'heatmap_toggled',
  MINI_MAP_TOGGLED = 'mini_map_toggled',
  DARK_MODE_TOGGLED = 'dark_mode_toggled',
  UI_COMPONENT_TOGGLED = 'ui_component_toggled',
  
  // Eventos de rendimiento
  PERFORMANCE_DEGRADED = 'performance_degraded',
  PERFORMANCE_IMPROVED = 'performance_improved',
  PERFORMANCE_CRITICAL = 'performance_critical',
  
  // Eventos de área de selección
  AREA_SELECTION_STARTED = 'area_selection_started',
  AREA_SELECTION_UPDATED = 'area_selection_updated',
  AREA_SELECTION_COMPLETED = 'area_selection_completed',
  AREA_SELECTION_CANCELLED = 'area_selection_cancelled',
  
  // Eventos de búsqueda
  SEARCH_STARTED = 'search_started',
  SEARCH_RESULTS = 'search_results',
  SEARCH_CLEARED = 'search_cleared',
  
  // Eventos de acción cancelada
  ACTION_CANCELLED = 'action_cancelled',
  
  // Eventos de zoom
  ZOOM_CHANGED = 'zoom_changed'
}

/**
 * Interfaz para definir la estructura de los eventos que se envían a través del bus
 */
export interface NetworkEvent {
  type: NetworkEventType;
  payload?: Record<string, unknown>;
  timestamp?: number;
}

/**
 * Evento específico para cuando se selecciona un elemento
 */
export interface ElementSelectedEvent extends NetworkEvent {
  type: NetworkEventType.ELEMENT_SELECTED;
  payload: {
    element: NetworkElement | null;
  };
}

/**
 * Evento específico para cuando se crea un elemento
 */
export interface ElementCreatedEvent extends NetworkEvent {
  type: NetworkEventType.ELEMENT_CREATED;
  payload: {
    element: NetworkElement;
  };
}

/**
 * Evento específico para cuando se actualiza un elemento
 */
export interface ElementUpdatedEvent extends NetworkEvent {
  type: NetworkEventType.ELEMENT_UPDATED;
  payload: {
    element: NetworkElement;
    previousState?: NetworkElement;
  };
}

/**
 * Evento específico para cuando se elimina un elemento
 */
export interface ElementDeletedEvent extends NetworkEvent {
  type: NetworkEventType.ELEMENT_DELETED;
  payload: {
    element: NetworkElement;
  };
}

/**
 * Evento específico para cuando se selecciona una conexión
 */
export interface ConnectionSelectedEvent extends NetworkEvent {
  type: NetworkEventType.CONNECTION_SELECTED;
  payload: {
    connection: NetworkConnection | null;
  };
}

/**
 * Evento específico para cuando se crea una conexión
 */
export interface ConnectionCreatedEvent extends NetworkEvent {
  type: NetworkEventType.CONNECTION_CREATED;
  payload: {
    connection: NetworkConnection;
  };
}

/**
 * Evento específico para cuando se actualiza una conexión
 */
export interface ConnectionUpdatedEvent extends NetworkEvent {
  type: NetworkEventType.CONNECTION_UPDATED;
  payload: {
    connection: NetworkConnection;
    previousState?: NetworkConnection;
  };
}

/**
 * Evento específico para cuando se elimina una conexión
 */
export interface ConnectionDeletedEvent extends NetworkEvent {
  type: NetworkEventType.CONNECTION_DELETED;
  payload: {
    connection: NetworkConnection;
  };
}

/**
 * Evento específico para cuando se alterna una capa
 */
export interface LayerToggledEvent extends NetworkEvent {
  type: NetworkEventType.LAYER_TOGGLED;
  payload: {
    layer: ElementType | string;
    active: boolean;
  };
}

/**
 * Evento específico para cuando se cambia de herramienta
 */
export interface ToolChangedEvent extends NetworkEvent {
  type: NetworkEventType.TOOL_CHANGED;
  payload: {
    tool: string;
    previousTool?: string;
  };
}

/**
 * Evento específico para cuando el mapa está listo
 */
export interface MapReadyEvent extends NetworkEvent {
  type: NetworkEventType.MAP_READY;
  payload: {
    map: unknown;
  };
}

/**
 * Evento específico para cuando hay un error en el mapa
 */
export interface MapErrorEvent extends NetworkEvent {
  type: NetworkEventType.MAP_ERROR;
  payload: {
    error: Error | unknown;
  };
}

/**
 * Evento específico para cuando se hace clic en el mapa
 */
export interface MapClickedEvent extends NetworkEvent {
  type: NetworkEventType.MAP_CLICKED;
  payload: {
    latlng: [number, number];
    originalEvent: MouseEvent;
  };
}

/**
 * Evento específico para cuando se completa una medición
 */
export interface MeasurementCompletedEvent extends NetworkEvent {
  type: NetworkEventType.MEASUREMENT_COMPLETED;
  payload: {
    sourceElement: NetworkElement;
    targetElement: NetworkElement;
    distance: number;
  };
}

/**
 * Evento específico para cuando se cambia el modo de visualización
 */
export interface ViewModeChangedEvent extends NetworkEvent {
  type: NetworkEventType.VIEW_MODE_CHANGED;
  payload: {
    mode: string;
    previousMode?: string;
  };
}

/**
 * Evento específico para cuando se alterna la vista en clúster
 */
export interface ClusterViewToggledEvent extends NetworkEvent {
  type: NetworkEventType.CLUSTER_VIEW_TOGGLED;
  payload: {
    enabled: boolean;
  };
}

/**
 * Evento específico para cuando se alterna el mapa de calor
 */
export interface HeatmapToggledEvent extends NetworkEvent {
  type: NetworkEventType.HEATMAP_TOGGLED;
  payload: {
    enabled: boolean;
  };
}

/**
 * Evento específico para cuando se alterna el mini mapa
 */
export interface MiniMapToggledEvent extends NetworkEvent {
  type: NetworkEventType.MINI_MAP_TOGGLED;
  payload: {
    enabled: boolean;
  };
}

/**
 * Evento específico para cuando se completa una selección de área
 */
export interface AreaSelectionCompletedEvent extends NetworkEvent {
  type: NetworkEventType.AREA_SELECTION_COMPLETED;
  payload: {
    bounds: {
      northEast: [number, number];
      southWest: [number, number];
    };
    elements: NetworkElement[];
  };
}

/**
 * Evento específico para cuando se obtienen resultados de búsqueda
 */
export interface SearchResultsEvent extends NetworkEvent {
  type: NetworkEventType.SEARCH_RESULTS;
  payload: {
    query: string;
    results: NetworkElement[];
  };
}

/**
 * Evento específico para cuando se cancela una acción
 */
export interface ActionCancelledEvent extends NetworkEvent {
  type: NetworkEventType.ACTION_CANCELLED;
  payload: {
    action: string;
    reason?: string;
  };
}

/**
 * Evento específico para cuando cambia el nivel de zoom
 */
export interface ZoomChangedEvent extends NetworkEvent {
  type: NetworkEventType.ZOOM_CHANGED;
  payload: {
    level: number;
    previousLevel?: number;
  };
}

/**
 * Evento específico para cuando se alterna el modo oscuro
 */
export interface DarkModeToggledEvent extends NetworkEvent {
  type: NetworkEventType.DARK_MODE_TOGGLED;
  payload: {
    enabled: boolean;
  };
}

/**
 * Evento específico para cuando se alterna un componente de la UI
 */
export interface UIComponentToggledEvent extends NetworkEvent {
  type: NetworkEventType.UI_COMPONENT_TOGGLED;
  payload: {
    component: string;
    visible: boolean;
  };
}

/**
 * Servicio de bus de eventos para la comunicación entre componentes de la red
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkEventBusService {
  private eventSubject = new Subject<NetworkEvent>();
  
  constructor(private logger: LoggerService) { }
  
  /**
   * Emite un evento en el bus
   * @param event Evento a emitir
   */
  emit(event: NetworkEvent): void {
    // Agregar timestamp si no está presente
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }
    
    this.logger.debug(`[EventBus] Emitiendo evento: ${event.type}`, event);
    this.eventSubject.next(event);
  }
  
  /**
   * Obtiene el Observable para escuchar todos los eventos
   */
  get events$(): Observable<NetworkEvent> {
    return this.eventSubject.asObservable();
  }
  
  /**
   * Obtiene un Observable filtrado por tipo de evento
   * @param eventType Tipo de evento a filtrar
   */
  ofType<T extends NetworkEvent>(eventType: NetworkEventType): Observable<T> {
    return this.eventSubject.asObservable().pipe(
      filter((event): event is T => event.type === eventType)
    );
  }
  
  /**
   * Obtiene un Observable para eventos de elemento seleccionado
   */
  get elementSelected$(): Observable<ElementSelectedEvent> {
    return this.ofType<ElementSelectedEvent>(NetworkEventType.ELEMENT_SELECTED);
  }
  
  /**
   * Obtiene un Observable para eventos de conexión seleccionada
   */
  get connectionSelected$(): Observable<ConnectionSelectedEvent> {
    return this.ofType<ConnectionSelectedEvent>(NetworkEventType.CONNECTION_SELECTED);
  }
  
  /**
   * Obtiene un Observable para eventos de mapa listo
   */
  get mapReady$(): Observable<MapReadyEvent> {
    return this.ofType<MapReadyEvent>(NetworkEventType.MAP_READY);
  }
  
  /**
   * Obtiene un Observable para eventos de error de mapa
   */
  get mapError$(): Observable<MapErrorEvent> {
    return this.ofType<MapErrorEvent>(NetworkEventType.MAP_ERROR);
  }
  
  /**
   * Obtiene un Observable para eventos de cambio de herramienta
   */
  get toolChanged$(): Observable<ToolChangedEvent> {
    return this.ofType<ToolChangedEvent>(NetworkEventType.TOOL_CHANGED);
  }
  
  /**
   * Obtiene un Observable para eventos de medición completada
   */
  get measurementCompleted$(): Observable<MeasurementCompletedEvent> {
    return this.ofType<MeasurementCompletedEvent>(NetworkEventType.MEASUREMENT_COMPLETED);
  }
  
  /**
   * Obtiene un Observable para eventos de cambio de modo de visualización
   */
  get viewModeChanged$(): Observable<ViewModeChangedEvent> {
    return this.ofType<ViewModeChangedEvent>(NetworkEventType.VIEW_MODE_CHANGED);
  }
  
  /**
   * Obtiene un Observable para eventos de selección de área completada
   */
  get areaSelectionCompleted$(): Observable<AreaSelectionCompletedEvent> {
    return this.ofType<AreaSelectionCompletedEvent>(NetworkEventType.AREA_SELECTION_COMPLETED);
  }
  
  /**
   * Obtiene un Observable para eventos de cambio de zoom
   */
  get zoomChanged$(): Observable<ZoomChangedEvent> {
    return this.ofType<ZoomChangedEvent>(NetworkEventType.ZOOM_CHANGED);
  }

  /**
   * Emite un evento de selección de elemento
   * @param element Elemento seleccionado (null para deseleccionar)
   */
  emitElementSelected(element: NetworkElement | null): void {
    this.emit({
      type: NetworkEventType.ELEMENT_SELECTED,
      payload: { element },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de selección de conexión
   * @param connection Conexión seleccionada (null para deseleccionar)
   */
  emitConnectionSelected(connection: NetworkConnection | null): void {
    this.emit({
      type: NetworkEventType.CONNECTION_SELECTED,
      payload: { connection },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de creación de elemento
   * @param element Elemento creado
   */
  emitElementCreated(element: NetworkElement): void {
    this.emit({
      type: NetworkEventType.ELEMENT_CREATED,
      payload: { element },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de actualización de elemento
   * @param element Elemento actualizado
   * @param previousState Estado previo del elemento (opcional)
   */
  emitElementUpdated(element: NetworkElement, previousState?: NetworkElement): void {
    this.emit({
      type: NetworkEventType.ELEMENT_UPDATED,
      payload: { element, previousState },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de eliminación de elemento
   * @param element Elemento eliminado
   */
  emitElementDeleted(element: NetworkElement): void {
    this.emit({
      type: NetworkEventType.ELEMENT_DELETED,
      payload: { element },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de creación de conexión
   * @param connection Conexión creada
   */
  emitConnectionCreated(connection: NetworkConnection): void {
    this.emit({
      type: NetworkEventType.CONNECTION_CREATED,
      payload: { connection },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de actualización de conexión
   * @param connection Conexión actualizada
   * @param previousState Estado previo de la conexión (opcional)
   */
  emitConnectionUpdated(connection: NetworkConnection, previousState?: NetworkConnection): void {
    this.emit({
      type: NetworkEventType.CONNECTION_UPDATED,
      payload: { connection, previousState },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de eliminación de conexión
   * @param connection Conexión eliminada
   */
  emitConnectionDeleted(connection: NetworkConnection): void {
    this.emit({
      type: NetworkEventType.CONNECTION_DELETED,
      payload: { connection },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de cambio de herramienta
   * @param tool Herramienta seleccionada
   * @param previousTool Herramienta previa (opcional)
   */
  emitToolChanged(tool: string, previousTool?: string): void {
    this.emit({
      type: NetworkEventType.TOOL_CHANGED,
      payload: { tool, previousTool },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de mapa listo
   * @param map Referencia al mapa
   */
  emitMapReady(map: unknown): void {
    this.emit({
      type: NetworkEventType.MAP_READY,
      payload: { map },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de error en el mapa
   * @param error Error ocurrido
   */
  emitMapError(error: Error | unknown): void {
    this.emit({
      type: NetworkEventType.MAP_ERROR,
      payload: { error },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de clic en el mapa
   * @param latlng Coordenadas del clic [longitud, latitud]
   * @param originalEvent Evento original del mouse
   */
  emitMapClicked(latlng: [number, number], originalEvent: MouseEvent): void {
    this.emit({
      type: NetworkEventType.MAP_CLICKED,
      payload: { latlng, originalEvent },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de cambio de zoom
   * @param level Nivel de zoom actual
   * @param previousLevel Nivel de zoom previo (opcional)
   */
  emitZoomChanged(level: number, previousLevel?: number): void {
    this.emit({
      type: NetworkEventType.ZOOM_CHANGED,
      payload: { level, previousLevel },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de medición completada
   * @param sourceElement Elemento de origen
   * @param targetElement Elemento de destino
   * @param distance Distancia medida
   */
  emitMeasurementCompleted(sourceElement: NetworkElement, targetElement: NetworkElement, distance: number): void {
    this.emit({
      type: NetworkEventType.MEASUREMENT_COMPLETED,
      payload: { sourceElement, targetElement, distance },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de cambio de modo de vista
   * @param mode Modo de vista actual
   * @param previousMode Modo de vista previo (opcional)
   */
  emitViewModeChanged(mode: string, previousMode?: string): void {
    this.emit({
      type: NetworkEventType.VIEW_MODE_CHANGED,
      payload: { mode, previousMode },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de cambio de vista en clúster
   * @param enabled Si la vista en clúster está activada
   */
  emitClusterViewToggled(enabled: boolean): void {
    this.emit({
      type: NetworkEventType.CLUSTER_VIEW_TOGGLED,
      payload: { enabled },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de toggle de mapa de calor
   * @param enabled Si el mapa de calor está activado
   */
  emitHeatmapToggled(enabled: boolean): void {
    this.emit({
      type: NetworkEventType.HEATMAP_TOGGLED,
      payload: { enabled },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de toggle de mini mapa
   * @param enabled Si el mini mapa está activado
   */
  emitMiniMapToggled(enabled: boolean): void {
    this.emit({
      type: NetworkEventType.MINI_MAP_TOGGLED,
      payload: { enabled },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de alternar capa
   * @param layer Capa alternada (puede ser un ElementType o un ID de capa personalizada)
   * @param active Si la capa está activa
   */
  emitLayerToggled(layer: ElementType | string, active: boolean): void {
    this.emit({
      type: NetworkEventType.LAYER_TOGGLED,
      payload: { layer, active },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de toggle de modo oscuro
   * @param enabled Si el modo oscuro está activado
   */
  emitDarkModeToggled(enabled: boolean): void {
    this.emit({
      type: NetworkEventType.DARK_MODE_TOGGLED,
      payload: { enabled },
      timestamp: Date.now()
    });
  }

  /**
   * Emite un evento de toggle de componente de UI
   * @param component Nombre del componente
   * @param visible Si el componente está visible
   */
  emitUIComponentToggled(component: string, visible: boolean): void {
    this.emit({
      type: NetworkEventType.UI_COMPONENT_TOGGLED,
      payload: { component, visible },
      timestamp: Date.now()
    });
  }
} 