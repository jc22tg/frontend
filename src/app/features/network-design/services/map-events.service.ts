import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { LoggerService } from '../../../core/services/logger.service';
import { NetworkElement, NetworkConnection, ElementType } from '../../../shared/types/network.types';

/**
 * Enum de todos los tipos de eventos del mapa
 * Cada tipo corresponde a una interfaz de evento específica
 */
export enum MapEventType {
  ELEMENT_SELECTED = 'element_selected',
  CONNECTION_SELECTED = 'connection_selected',
  CONNECTION_CREATED = 'connection_created',
  ELEMENT_CREATED = 'element_created',
  ELEMENT_DELETED = 'element_deleted',
  MEASUREMENT_COMPLETED = 'measurement_completed',
  LAYER_TOGGLED = 'layer_toggled',
  ACTION_CANCELLED = 'action_cancelled',
  ZOOM_CHANGED = 'zoom_changed',
  TOOL_CHANGED = 'tool_changed',
  MAP_CLICKED = 'map_clicked',
  DRAG_STARTED = 'drag_started',
  DRAG_ENDED = 'drag_ended',
  ELEMENT_UPDATED = 'element_updated',
  CONNECTION_UPDATED = 'connection_updated',
  MAP_CENTER_CHANGED = 'map_center_changed',
  MAP_BOUNDS_CHANGED = 'map_bounds_changed',
  MAP_READY = 'map_ready',
  MAP_ERROR = 'map_error'
}

/**
 * Interfaz base para todos los eventos del mapa
 */
export interface MapEvent {
  type: MapEventType;
  timestamp: Date;
}

// Interfaces para eventos específicos del mapa

export interface ElementSelectedEvent extends MapEvent {
  type: MapEventType.ELEMENT_SELECTED;
  element: NetworkElement | null;
}

export interface ConnectionSelectedEvent extends MapEvent {
  type: MapEventType.CONNECTION_SELECTED;
  connection: NetworkConnection | null;
}

export interface ConnectionCreatedEvent extends MapEvent {
  type: MapEventType.CONNECTION_CREATED;
  connection: NetworkConnection;
}

export interface ElementCreatedEvent extends MapEvent {
  type: MapEventType.ELEMENT_CREATED;
  element: NetworkElement;
}

export interface ElementDeletedEvent extends MapEvent {
  type: MapEventType.ELEMENT_DELETED;
  elementId: string;
  elementName: string;
}

export interface MeasurementCompletedEvent extends MapEvent {
  type: MapEventType.MEASUREMENT_COMPLETED;
  sourceElement: NetworkElement;
  targetElement: NetworkElement;
  distance: number;
}

export interface LayerToggledEvent extends MapEvent {
  type: MapEventType.LAYER_TOGGLED;
  layerType: ElementType;
  active: boolean;
}

export interface ActionCancelledEvent extends MapEvent {
  type: MapEventType.ACTION_CANCELLED;
  action: string;
  reason?: string;
}

export interface ZoomChangedEvent extends MapEvent {
  type: MapEventType.ZOOM_CHANGED;
  level: number;
}

export interface ToolChangedEvent extends MapEvent {
  type: MapEventType.TOOL_CHANGED;
  tool: string;
  previousTool: string;
}

export interface MapClickedEvent extends MapEvent {
  type: MapEventType.MAP_CLICKED;
  position: { x: number, y: number };
}

export interface DragStartedEvent extends MapEvent {
  type: MapEventType.DRAG_STARTED;
  elementId: string;
  startPosition: { x: number, y: number };
}

export interface DragEndedEvent extends MapEvent {
  type: MapEventType.DRAG_ENDED;
  elementId: string;
  endPosition: { x: number, y: number };
}

export interface ElementUpdatedEvent extends MapEvent {
  type: MapEventType.ELEMENT_UPDATED;
  element: NetworkElement;
  previousState?: Partial<NetworkElement>;
}

export interface ConnectionUpdatedEvent extends MapEvent {
  type: MapEventType.CONNECTION_UPDATED;
  connection: NetworkConnection;
  previousState?: Partial<NetworkConnection>;
}

export interface MapCenterChangedEvent extends MapEvent {
  type: MapEventType.MAP_CENTER_CHANGED;
  center: { lat: number, lng: number };
  zoom: number;
}

export interface MapBoundsChangedEvent extends MapEvent {
  type: MapEventType.MAP_BOUNDS_CHANGED;
  bounds: { 
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface MapReadyEvent extends MapEvent {
  type: MapEventType.MAP_READY;
  mapInstance: any; // Tipo genérico para compatibilidad con distintas librerías de mapas
}

export interface MapErrorEvent extends MapEvent {
  type: MapEventType.MAP_ERROR;
  error: Error;
  context?: string;
}

// Tipo unión de todos los eventos
export type MapEventUnion = 
  | ElementSelectedEvent 
  | ConnectionSelectedEvent 
  | ConnectionCreatedEvent 
  | ElementCreatedEvent 
  | ElementDeletedEvent 
  | MeasurementCompletedEvent 
  | LayerToggledEvent 
  | ActionCancelledEvent 
  | ZoomChangedEvent 
  | ToolChangedEvent
  | MapClickedEvent
  | DragStartedEvent
  | DragEndedEvent
  | ElementUpdatedEvent
  | ConnectionUpdatedEvent
  | MapCenterChangedEvent
  | MapBoundsChangedEvent
  | MapReadyEvent
  | MapErrorEvent;

/**
 * Servicio para gestionar eventos del mapa de forma centralizada
 * Permite la comunicación entre componentes y la cancelación de acciones
 * 
 * Este servicio implementa un patrón de Event Bus centralizado para manejar
 * todos los eventos relacionados con el mapa y sus interacciones.
 */
@Injectable({
  providedIn: 'root'
})
export class MapEventsService {
  // BehaviorSubject para el último evento ocurrido
  private eventSubject = new BehaviorSubject<MapEventUnion | null>(null);
  
  // Subject para acciones cancelables
  private cancelActionsSubject = new Subject<string>();

  constructor(private logger: LoggerService) {
    this.logger.debug('MapEventsService inicializado');
  }

  /**
   * Envía un evento al sistema
   * @param event Evento a emitir
   */
  dispatch(event: MapEventUnion): void {
    this.logger.debug(`Evento del mapa emitido: ${event.type}`);
    this.eventSubject.next(event);
  }

  /**
   * Obtiene todos los eventos como Observable
   */
  getEvents(): Observable<MapEventUnion> {
    return this.eventSubject.asObservable().pipe(
      filter((event): event is MapEventUnion => event !== null)
    );
  }

  /**
   * Obtiene eventos de un tipo específico
   * @param eventType Tipo de evento a filtrar
   */
  getEventsByType<T extends MapEventUnion>(eventType: MapEventType): Observable<T> {
    return this.getEvents().pipe(
      filter((event): event is T => event.type === eventType)
    );
  }

  /**
   * Suscribe a eventos de un tipo específico (alias de getEventsByType)
   * @param eventType Tipo de evento a escuchar
   */
  on<T extends MapEventUnion>(eventType: MapEventType): Observable<T> {
    return this.getEventsByType<T>(eventType);
  }

  /**
   * Cancela una acción en curso
   * @param action Identificador de la acción a cancelar
   * @param reason Motivo opcional de la cancelación
   */
  cancelAction(action: string, reason = 'Cancelled by user'): void {
    this.logger.debug(`Solicitud de cancelación para acción: ${action}`);
    this.cancelActionsSubject.next(action);
    
    // Emitir evento de cancelación
    this.dispatch({
      type: MapEventType.ACTION_CANCELLED,
      timestamp: new Date(),
      action,
      reason
    });
  }

  /**
   * Obtiene un Observable para suscribirse a cancelaciones
   * @param actionId Identificador de la acción a monitorear
   */
  onActionCancelled(actionId: string): Observable<void> {
    return this.cancelActionsSubject.asObservable().pipe(
      filter(action => action === actionId),
      map(() => void 0)
    );
  }

  /**
   * Crea un manejador que se cancela automáticamente
   * @param actionId Identificador de la acción
   * @param callback Función a ejecutar
   */
  withCancellation<T>(actionId: string, callback: (cancel$: Observable<void>) => Observable<T>): Observable<T> {
    const cancel$ = this.onActionCancelled(actionId);
    return callback(cancel$);
  }
  
  /**
   * Emite evento de selección de elemento
   * @param element Elemento seleccionado o null si se deselecciona
   */
  selectElement(element: NetworkElement | null): void {
    this.dispatch({
      type: MapEventType.ELEMENT_SELECTED,
      timestamp: new Date(),
      element
    });
  }

  /**
   * Emite evento de selección de conexión
   * @param connection Conexión seleccionada o null si se deselecciona
   */
  selectConnection(connection: NetworkConnection | null): void {
    this.dispatch({
      type: MapEventType.CONNECTION_SELECTED,
      timestamp: new Date(),
      connection
    });
  }

  /**
   * Emite evento de creación de conexión
   * @param connection Conexión creada
   */
  createConnection(connection: NetworkConnection): void {
    this.dispatch({
      type: MapEventType.CONNECTION_CREATED,
      timestamp: new Date(),
      connection
    });
  }

  /**
   * Emite evento de creación de elemento
   * @param element Elemento creado
   */
  createElement(element: NetworkElement): void {
    this.dispatch({
      type: MapEventType.ELEMENT_CREATED,
      timestamp: new Date(),
      element
    });
  }

  /**
   * Emite evento de eliminación de elemento
   * @param elementId ID del elemento eliminado
   * @param elementName Nombre del elemento para log/auditoría
   */
  deleteElement(elementId: string, elementName: string): void {
    this.dispatch({
      type: MapEventType.ELEMENT_DELETED,
      timestamp: new Date(),
      elementId,
      elementName
    });
  }

  /**
   * Emite evento de medición completada
   * @param sourceElement Elemento origen
   * @param targetElement Elemento destino
   * @param distance Distancia calculada
   */
  completeMeasurement(sourceElement: NetworkElement, targetElement: NetworkElement, distance: number): void {
    this.dispatch({
      type: MapEventType.MEASUREMENT_COMPLETED,
      timestamp: new Date(),
      sourceElement,
      targetElement,
      distance
    });
  }

  /**
   * Emite evento de capa activada/desactivada
   * @param layerType Tipo de elemento que define la capa
   * @param active Estado (true=visible, false=oculta)
   */
  toggleLayer(layerType: ElementType, active: boolean): void {
    this.dispatch({
      type: MapEventType.LAYER_TOGGLED,
      timestamp: new Date(),
      layerType,
      active
    });
  }

  /**
   * Emite evento de cambio de zoom
   * @param level Nivel de zoom
   */
  changeZoom(level: number): void {
    this.dispatch({
      type: MapEventType.ZOOM_CHANGED,
      timestamp: new Date(),
      level
    });
  }

  /**
   * Emite evento de cambio de herramienta
   * @param tool Nueva herramienta
   * @param previousTool Herramienta anterior
   */
  changeTool(tool: string, previousTool: string): void {
    this.dispatch({
      type: MapEventType.TOOL_CHANGED,
      timestamp: new Date(),
      tool,
      previousTool
    });
  }

  /**
   * Emite evento de clic en el mapa
   * @param position Coordenadas del clic
   */
  mapClicked(position: { x: number, y: number }): void {
    this.dispatch({
      type: MapEventType.MAP_CLICKED,
      timestamp: new Date(),
      position
    });
  }

  /**
   * Emite evento de inicio de arrastre
   * @param elementId ID del elemento
   * @param startPosition Posición inicial
   */
  dragStarted(elementId: string, startPosition: { x: number, y: number }): void {
    this.dispatch({
      type: MapEventType.DRAG_STARTED,
      timestamp: new Date(),
      elementId,
      startPosition
    });
  }

  /**
   * Emite evento de fin de arrastre
   * @param elementId ID del elemento
   * @param endPosition Posición final
   */
  dragEnded(elementId: string, endPosition: { x: number, y: number }): void {
    this.dispatch({
      type: MapEventType.DRAG_ENDED,
      timestamp: new Date(),
      elementId,
      endPosition
    });
  }

  /**
   * Emite evento de actualización de elemento
   * @param element Elemento actualizado
   * @param previousState Estado anterior opcional
   */
  updateElement(element: NetworkElement, previousState?: Partial<NetworkElement>): void {
    this.dispatch({
      type: MapEventType.ELEMENT_UPDATED,
      timestamp: new Date(),
      element,
      previousState
    });
  }

  /**
   * Emite evento de actualización de conexión
   * @param connection Conexión actualizada
   * @param previousState Estado anterior opcional
   */
  updateConnection(connection: NetworkConnection, previousState?: Partial<NetworkConnection>): void {
    this.dispatch({
      type: MapEventType.CONNECTION_UPDATED,
      timestamp: new Date(),
      connection,
      previousState
    });
  }

  /**
   * Emite evento de cambio del centro del mapa
   * @param center Nuevas coordenadas del centro
   * @param zoom Nivel de zoom actual
   */
  mapCenterChanged(center: { lat: number, lng: number }, zoom: number): void {
    this.dispatch({
      type: MapEventType.MAP_CENTER_CHANGED,
      timestamp: new Date(),
      center,
      zoom
    });
  }

  /**
   * Emite evento de cambio de los límites del mapa
   * @param bounds Nuevos límites
   */
  mapBoundsChanged(bounds: { north: number; south: number; east: number; west: number }): void {
    this.dispatch({
      type: MapEventType.MAP_BOUNDS_CHANGED,
      timestamp: new Date(),
      bounds
    });
  }

  /**
   * Emite evento de mapa listo
   * @param mapInstance Instancia del mapa
   */
  mapReady(mapInstance: any): void {
    this.dispatch({
      type: MapEventType.MAP_READY,
      timestamp: new Date(),
      mapInstance
    });
  }

  /**
   * Emite evento de error del mapa
   * @param error Error ocurrido
   * @param context Contexto opcional
   */
  mapError(error: Error, context?: string): void {
    this.dispatch({
      type: MapEventType.MAP_ERROR,
      timestamp: new Date(),
      error,
      context
    });
  }
} 
